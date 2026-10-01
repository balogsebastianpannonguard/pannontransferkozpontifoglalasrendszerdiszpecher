import { MongoClient } from "mongodb";
import { getMongoDb } from "./mongodb";

/**
 * Jelenléti ív → Diszpécser sofőr-szinkron.
 *
 * A Jelenléti ív alkalmazás sofőrjei (users kollekció, role: "user") állandó sofőrként
 * jelennek meg a diszpécser 'staff_users' kollekciójában. A jelenléti ív adatbázisát
 * KIZÁRÓLAG OLVASSUK – oda soha nem írunk.
 *
 * - Új jelenléti íves sofőr → új, állandó sofőr jön létre a diszpécserben.
 * - Már szinkronizált sofőr → a diszpécserben végzett módosítások (név, telefon, típus,
 *   státusz, jármű, megjegyzés) megmaradnak, csak a kapcsolat adatai frissülnek.
 * - A diszpécserben törölt szinkronizált sofőrt nem hozzuk vissza (driver_sync_exclusions).
 */

export const ATTENDANCE_SOURCE = "jelenleti_iv";
const EXCLUSIONS_COLLECTION = "driver_sync_exclusions";
const SYNC_INTERVAL_MS = 60_000;

const globalForAttendance = globalThis as unknown as {
  __attendanceClientPromise?: Promise<MongoClient>;
  __attendanceLastSync?: number;
  __attendanceSyncRunning?: Promise<AttendanceSyncResult>;
};

export interface AttendanceSyncResult {
  ok: boolean;
  skipped?: "not_configured" | "throttled";
  created: number;
  linked: number;
  total: number;
  error?: string;
}

function getAttendanceClient(): Promise<MongoClient> | null {
  const uri = process.env.JELENLETI_MONGODB_URI;
  if (!uri) return null;
  if (!globalForAttendance.__attendanceClientPromise) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
    globalForAttendance.__attendanceClientPromise = client.connect().catch((err) => {
      globalForAttendance.__attendanceClientPromise = undefined;
      throw err;
    });
  }
  return globalForAttendance.__attendanceClientPromise;
}

interface AttendanceUser {
  _id: { toString(): string };
  name?: string;
  email?: string;
  createdAt?: Date | string | number;
}

async function runSync(): Promise<AttendanceSyncResult> {
  const clientPromise = getAttendanceClient();
  if (!clientPromise) return { ok: false, skipped: "not_configured", created: 0, linked: 0, total: 0 };

  const client = await clientPromise;
  const dbName = process.env.JELENLETI_MONGODB_DB;
  const attendanceDb = dbName ? client.db(dbName) : client.db();

  const attendanceUsers = (await attendanceDb
    .collection("users")
    .find({ role: "user" }, { projection: { name: 1, email: 1, createdAt: 1 } })
    .toArray()) as unknown as AttendanceUser[];

  const db = await getMongoDb();
  const staff = db.collection("staff_users");
  const excludedIds = new Set(
    (await db.collection(EXCLUSIONS_COLLECTION).find({}, { projection: { attendanceUserId: 1 } }).toArray()).map(
      (d) => String(d.attendanceUserId)
    )
  );

  let created = 0;
  let linked = 0;
  const now = Date.now();

  for (const u of attendanceUsers) {
    const attendanceUserId = u._id.toString();
    if (excludedIds.has(attendanceUserId)) continue;

    const email = (u.email || "").trim();
    const normalizedEmail = email.toLowerCase();
    const name = (u.name || "").trim() || email.split("@")[0] || "Ismeretlen";

    const alreadyLinked = await staff.findOne({ attendanceUserId }, { projection: { _id: 1 } });
    if (alreadyLinked) {
      await staff.updateOne(
        { _id: alreadyLinked._id },
        { $set: { attendanceSyncedAt: now } }
      );
      continue;
    }

    if (normalizedEmail) {
      const existing = await staff.findOne({ normalizedEmail }, { projection: { _id: 1, role: 1 } });
      if (existing) {
        // Csak sofőrt kapcsolunk össze; más szerepkörű (admin/diszpécser) fiókhoz nem nyúlunk
        if (existing.role === "driver") {
          await staff.updateOne(
            { _id: existing._id },
            { $set: { attendanceUserId, source: ATTENDANCE_SOURCE, attendanceSyncedAt: now } }
          );
          linked++;
        }
        continue;
      }
    }

    const createdAt = u.createdAt ? new Date(u.createdAt).getTime() : now;
    await staff.insertOne({
      email: email || `driver_${attendanceUserId}@pannontransfer.hu`,
      normalizedEmail: normalizedEmail || `driver_${attendanceUserId}@pannontransfer.hu`,
      role: "driver",
      name,
      driverType: "permanent",
      phone: "",
      driverStatus: "active",
      assignedVehicle: "",
      note: "",
      isActivated: false,
      requireTwoFactor: false,
      source: ATTENDANCE_SOURCE,
      attendanceUserId,
      attendanceSyncedAt: now,
      createdAt: Number.isFinite(createdAt) ? createdAt : now,
      updatedAt: now,
    });
    created++;
  }

  return { ok: true, created, linked, total: attendanceUsers.length };
}

/**
 * Szinkron futtatása. Alapból legfeljebb percenként egyszer fut (force: azonnal).
 * Hibánál nem dob kivételt, hogy a sofőrlista akkor is betöltődjön.
 */
export async function syncDriversFromAttendance(options: { force?: boolean } = {}): Promise<AttendanceSyncResult> {
  const last = globalForAttendance.__attendanceLastSync || 0;
  if (!options.force && Date.now() - last < SYNC_INTERVAL_MS) {
    return { ok: true, skipped: "throttled", created: 0, linked: 0, total: 0 };
  }
  if (globalForAttendance.__attendanceSyncRunning) return globalForAttendance.__attendanceSyncRunning;

  const running = runSync()
    .then((result) => {
      if (result.ok) globalForAttendance.__attendanceLastSync = Date.now();
      return result;
    })
    .catch((error: unknown) => {
      console.error("Jelenléti ív szinkron hiba:", error);
      return {
        ok: false,
        created: 0,
        linked: 0,
        total: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    })
    .finally(() => {
      globalForAttendance.__attendanceSyncRunning = undefined;
    });

  globalForAttendance.__attendanceSyncRunning = running;
  return running;
}

/** Törölt szinkronizált sofőr megjegyzése, hogy a következő szinkron ne hozza vissza. */
export async function excludeAttendanceDriver(attendanceUserId: string, name?: string) {
  const db = await getMongoDb();
  await db.collection(EXCLUSIONS_COLLECTION).updateOne(
    { attendanceUserId },
    { $set: { attendanceUserId, name: name || "", excludedAt: Date.now() } },
    { upsert: true }
  );
}

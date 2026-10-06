import { ObjectId } from "mongodb";
import { getMongoDb } from "./mongodb";
import { createBooking, type Booking, type BookingCategory } from "./bookings";
import { getAllPartnerMeta, resolvePartnerMeta } from "./partner-meta";
import { looksLikeAirport } from "./airport-detect";

/**
 * Előre felvett utak (pl. a következő hónap menetrendje): a diszpécserek soronként viszik fel, a rendszer
 * a központi foglalások közé menti őket, így megjelennek a központi naptárban is – a felvevő nevével.
 */

export interface AdvanceTripInput {
  pickupDate: string;
  pickupTime: string;
  companyName: string;
  travelers: number;
  fromAddress: string;
  toAddress: string;
  flightNumber?: string;
  travelerName?: string;
  travelerPhone?: string;
  comment?: string;
}

export interface AdvanceActor {
  email: string;
  name: string;
}

export interface AdvanceRowResult {
  index: number;
  ok: boolean;
  error?: string;
  bookingId?: string;
  bookingCode?: string;
}

export const MAX_ADVANCE_ROWS = 100;
export const NO_TRAVELER_NAME = "Nincs megadva";
const COLLECTION = "bookings";

/** A beírt cégnevet a beállított partnerekhez illeszti (pl. "ni" → National Instruments); ismeretlen cég marad szabad szöveg. */
export function normalizeCompany(input: string): { companyName: string; portal?: string; known: boolean } {
  const typed = input.trim();
  const meta = resolvePartnerMeta({ companyName: typed });
  if (meta) return { companyName: meta.name, portal: meta.id, known: true };
  return { companyName: typed, known: false };
}

export function knownCompanyNames(): string[] {
  return getAllPartnerMeta().map((meta) => meta.name);
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // UTC-ben ellenőrizzük, hogy a szerver időzónája ne számítson (pl. 2030-02-31 érvénytelen)
  const [y, m, day] = value.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, day));
  return d.getUTCFullYear() === y && d.getUTCMonth() === m - 1 && d.getUTCDate() === day;
}

function validTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function validateAdvanceTrip(raw: Partial<AdvanceTripInput>): { ok: true; trip: AdvanceTripInput } | { ok: false; error: string } {
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const trip: AdvanceTripInput = {
    pickupDate: text(raw.pickupDate, 10),
    pickupTime: text(raw.pickupTime, 5),
    companyName: text(raw.companyName, 120),
    travelers: Number(raw.travelers),
    fromAddress: text(raw.fromAddress, 200),
    toAddress: text(raw.toAddress, 200),
    flightNumber: text(raw.flightNumber, 20),
    travelerName: text(raw.travelerName, 120),
    travelerPhone: text(raw.travelerPhone, 40),
    comment: text(raw.comment, 500),
  };

  if (!validDate(trip.pickupDate)) return { ok: false, error: "Érvénytelen dátum." };
  if (!validTime(trip.pickupTime)) return { ok: false, error: "Érvénytelen időpont (ÓÓ:PP)." };
  if (!trip.companyName) return { ok: false, error: "A cég megadása kötelező." };
  if (!Number.isInteger(trip.travelers) || trip.travelers < 1 || trip.travelers > 60) {
    return { ok: false, error: "Az utasok száma 1 és 60 között legyen." };
  }
  if (!trip.fromAddress) return { ok: false, error: "A kiindulási hely megadása kötelező." };
  if (!trip.toAddress) return { ok: false, error: "Az úti cél megadása kötelező." };
  return { ok: true, trip };
}

/**
 * Egy köteg út mentése. A batchId miatt egy újrapróbált vagy duplán elküldött köteg nem készít másodpéldányt.
 * Az útról nem megy ki e-mail: utas e-mail nélkül a rendszer sehova nem küld értesítést.
 */
export async function createAdvanceBookings(
  rows: Array<Partial<AdvanceTripInput>>,
  actor: AdvanceActor,
  batchId: string
): Promise<{ results: AdvanceRowResult[]; alreadySaved: boolean }> {
  const db = await getMongoDb();
  const col = db.collection(COLLECTION);

  if (batchId) {
    const existing = await col.countDocuments({ advanceBatchId: batchId });
    if (existing > 0) return { results: [], alreadySaved: true };
  }

  const results: AdvanceRowResult[] = [];
  for (let index = 0; index < rows.length; index++) {
    const checked = validateAdvanceTrip(rows[index]);
    if (!checked.ok) {
      results.push({ index, ok: false, error: checked.error });
      continue;
    }
    const trip = checked.trip;
    const company = normalizeCompany(trip.companyName);
    const fromAirport = looksLikeAirport(trip.fromAddress);
    const toAirport = looksLikeAirport(trip.toAddress);
    const category: BookingCategory = fromAirport || toAirport ? "airport" : company.known ? "partner" : "city";

    try {
      const booking = await createBooking(
        {
          userEmail: "",
          travelerEmail: "",
          travelerName: trip.travelerName || NO_TRAVELER_NAME,
          travelerPhone: trip.travelerPhone || "",
          companyName: company.companyName,
          ...(company.portal ? { portal: company.portal } : {}),
          paymentMethod: "bank",
          transferType: "standard",
          fromType: fromAirport ? "airport" : "other",
          fromAddress: trip.fromAddress,
          toType: toAirport ? "airport" : "other",
          toAddress: trip.toAddress,
          flightNumber: trip.flightNumber || undefined,
          pickupDate: trip.pickupDate,
          pickupTime: trip.pickupTime,
          travelers: trip.travelers,
          luggage: 0,
          comment: trip.comment || undefined,
          category,
          status: "confirmed",
          // jelölés a naptárnak és a listának
          advanceEntry: true,
          advanceBatchId: batchId || undefined,
          createdByName: actor.name,
        } as Parameters<typeof createBooking>[0],
        actor.email
      );
      results.push({ index, ok: true, bookingId: booking._id ? String(booking._id) : undefined, bookingCode: booking.bookingCode });
    } catch (error) {
      console.error("[advance-bookings] create failed", error);
      results.push({ index, ok: false, error: "A mentés nem sikerült." });
    }
  }
  return { results, alreadySaved: false };
}

export interface AdvanceListItem {
  id: string;
  bookingCode: string;
  pickupDate: string;
  pickupTime: string;
  companyName: string;
  knownCompany: boolean;
  travelers: number;
  fromAddress: string;
  toAddress: string;
  flightNumber?: string;
  comment?: string;
  travelerName?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: number;
  status: string;
  assignedDriverName?: string;
  deletable: boolean;
}

/** A megadott hónap (ÉÉÉÉ-HH) előre felvett útjai, idő szerint rendezve. */
export async function listAdvanceBookings(month: string, viewer: { email: string; role: string }): Promise<AdvanceListItem[]> {
  const db = await getMongoDb();
  const docs = await db
    .collection(COLLECTION)
    .find({ advanceEntry: true, pickupDate: { $regex: `^${month}-` } })
    .sort({ pickupDate: 1, pickupTime: 1, createdAt: 1 })
    .limit(1000)
    .toArray();

  return docs.map((doc) => {
    const own = String(doc.createdBy || "").toLowerCase() === viewer.email.toLowerCase();
    const editableStatus = doc.status === "confirmed" || doc.status === "pending";
    const unassigned = !doc.assignedDriverId && !doc.assignedVehicleId;
    return {
      id: String(doc._id),
      bookingCode: String(doc.bookingCode || ""),
      pickupDate: String(doc.pickupDate || ""),
      pickupTime: String(doc.pickupTime || ""),
      companyName: String(doc.companyName || ""),
      knownCompany: Boolean(resolvePartnerMeta({ portal: doc.portal, companyName: doc.companyName })),
      travelers: Number(doc.travelers || 0),
      fromAddress: String(doc.fromAddress || ""),
      toAddress: String(doc.toAddress || ""),
      flightNumber: doc.flightNumber || undefined,
      comment: doc.comment || undefined,
      travelerName: doc.travelerName && doc.travelerName !== NO_TRAVELER_NAME ? doc.travelerName : undefined,
      createdBy: doc.createdBy,
      createdByName: doc.createdByName,
      createdAt: Number(doc.createdAt || 0),
      status: String(doc.status || ""),
      assignedDriverName: doc.assignedDriverName,
      deletable: editableStatus && unassigned && (own || viewer.role === "admin"),
    };
  });
}

export async function deleteAdvanceBooking(
  id: string,
  viewer: { email: string; role: string }
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!ObjectId.isValid(id)) return { ok: false, status: 400, error: "Érvénytelen azonosító." };
  const db = await getMongoDb();
  const col = db.collection(COLLECTION);
  const doc = (await col.findOne({ _id: new ObjectId(id) })) as (Booking & { advanceEntry?: boolean }) | null;
  if (!doc || !doc.advanceEntry) return { ok: false, status: 404, error: "Az út nem található." };

  const own = String(doc.createdBy || "").toLowerCase() === viewer.email.toLowerCase();
  if (!own && viewer.role !== "admin") return { ok: false, status: 403, error: "Csak a saját utadat törölheted." };
  if (doc.assignedDriverId || doc.assignedVehicleId || !(doc.status === "confirmed" || doc.status === "pending")) {
    return { ok: false, status: 409, error: "Ehhez az úthoz már sofőr vagy jármű tartozik, vagy lezárták – a Foglalások oldalon kezelhető." };
  }
  await col.deleteOne({ _id: new ObjectId(id), advanceEntry: true });
  return { ok: true };
}

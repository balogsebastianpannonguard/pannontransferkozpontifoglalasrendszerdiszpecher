import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getBookingsCollection } from "@/lib/bookings";
import { getMongoDb } from "@/lib/mongodb";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function generateRandomToken(length: number = 64): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

async function getDispatcherEmails(): Promise<string[]> {
  try {
    const db = await getMongoDb();
    const staffUsers = await db
      .collection("staff_users")
      .find({
        role: { $in: ["dispatcher", "admin"] },
        status: "active",
      })
      .project({ email: 1, _id: 0 })
      .toArray();
    const dbEmails = staffUsers
      .map((u: any) => u.email)
      .filter((e: any) => typeof e === "string" && e.includes("@"));

    // Ha a DB-ben van aktív dispatcher, csak azokat küldjük — nem kell env fallback
    if (dbEmails.length > 0) {
      return Array.from(new Set(dbEmails));
    }

    // Ha nincs senki a DB-ben, fallback az env változóra
    const raw = process.env.DISPATCHER_EMAILS || process.env.DISPATCHER_EMAIL || "";
    const envEmails = raw
      ? raw.split(/[,;]/).map((e) => e.trim()).filter(Boolean)
      : [];

    return envEmails.length > 0
      ? envEmails
      : ["balogh.sebastian@pannonguard.hu"];
  } catch (err) {
    console.error("[notifications] getDispatcherEmails error", err);
    const fallback = process.env.DISPATCHER_EMAIL || "balogh.sebastian@pannonguard.hu";
    return [fallback];
  }
}


export async function GET(request: Request) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  try {
    const col = await getBookingsCollection();
    const { searchParams } = new URL(request.url);
    const sinceParam = Number(searchParams.get("since"));
    const since = Number.isFinite(sinceParam) && sinceParam > 0
      ? sinceParam
      : Date.now() - 60_000;
    const includeHistory = searchParams.get("history") === "1";

    const pendingBookingCount = await col.countDocuments({ status: "pending" });

    const recentDocs = await col
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    const recentBookings = recentDocs.map((doc: any) => ({
      _id: doc._id.toString(),
      bookingCode: doc.bookingCode,
      portal: doc.portal,
      travelerName: doc.travelerName,
      companyName: doc.companyName,
      travelerEmail: doc.travelerEmail,
      userEmail: doc.userEmail,
      pickupDate: doc.pickupDate,
      pickupTime: doc.pickupTime,
      status: doc.status,
      category: doc.category,
      createdAt: doc.createdAt || Date.now(),
    }));

    const eventDocs = await col
      .find(includeHistory
        ? { auditTrail: { $exists: true, $ne: [] } }
        : {
            updatedAt: { $gt: since },
            auditTrail: {
              $elemMatch: { timestamp: { $gt: since } },
            },
          } as any)
      .sort({ updatedAt: -1 })
      .limit(includeHistory ? 120 : 50)
      .toArray();

    const dispatchers = await getDispatcherEmails();
    const dispatcherActors = new Set(
      dispatchers.map((email) => email.toLowerCase())
    );
    const currentDispatcherEmail = String(user.email || "").toLowerCase();
    if (currentDispatcherEmail) dispatcherActors.add(currentDispatcherEmail);

    const notifications = eventDocs
      .flatMap((doc: any) =>
        (Array.isArray(doc.auditTrail) ? doc.auditTrail : [])
          .filter((entry: any) => {
            if (!includeHistory && (typeof entry.timestamp !== "number" || entry.timestamp <= since)) {
              return false;
            }
            return true;
          })
          .filter((entry: any) => {
            const actor = String(entry.actor || "").toLowerCase();
            const isDispatcherAction =
              dispatcherActors.has(actor) ||
              actor === String((user as any).name || "").toLowerCase();
            return !isDispatcherAction;
          })
          .map((entry: any) => {
            let details: { message?: string; changes?: Array<{ field: string; oldValue: unknown; newValue: unknown }> } = {};
            try {
              details = typeof entry.details === "string" ? JSON.parse(entry.details) : entry.details || {};
            } catch {
              details = { message: entry.details };
            }

            const action = String(entry.action || "modified");
            const eventMeta = action === "created"
              ? {
                  type: "new_booking",
                  title: "Új foglalás érkezett",
                  message: details.message || "Új foglalás érkezett a rendszerbe.",
                }
              : action === "partner_modified"
                ? {
                    type: "booking_modified",
                    title: "A partner módosította a foglalást",
                    message: details.message || "A partner módosította a foglalás adatait.",
                  }
                : action === "driver_acknowledged"
                  ? {
                      type: "driver_acknowledged",
                      title: "A sofőr látta a fuvart",
                      message: typeof details === "string"
                        ? details
                        : details.message || `${entry.actor || "A sofőr"} visszaigazolta, hogy látta az utat.`,
                    }
                  : {
                      type: "booking_event",
                      title: "Foglalási esemény",
                      message: typeof details === "string"
                        ? details
                        : details.message || `Esemény: ${action}`,
                    };

            return {
              id: `${doc._id.toString()}-${entry.timestamp}-${action}`,
              bookingId: doc._id.toString(),
              bookingCode: doc.bookingCode,
              travelerName: doc.travelerName,
              companyName: doc.companyName,
              pickupDate: doc.pickupDate,
              pickupTime: doc.pickupTime,
              fromAddress: doc.fromAddress,
              toAddress: doc.toAddress,
              actor: entry.actor,
              timestamp: entry.timestamp,
              updatedAt: entry.timestamp,
              action,
              type: eventMeta.type,
              title: eventMeta.title,
              message: eventMeta.message,
              changes: details.changes || [],
            };
          })
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, includeHistory ? 200 : 100);

    const partnerModifications = notifications.filter(
      (notification) => notification.type === "booking_modified"
    );

    const pollToken = generateRandomToken(64);

    return NextResponse.json({
      pendingBookingCount,
      dispatchers,
      pollToken,
      recentBookings,
      partnerModifications,
      notifications,
    });
  } catch (err) {
    console.error("[notifications GET error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

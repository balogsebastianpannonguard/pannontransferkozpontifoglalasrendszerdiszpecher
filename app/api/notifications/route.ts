import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getBookingsCollection, type Booking } from "@/lib/bookings";
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

    const raw = process.env.DISPATCHER_EMAILS || process.env.DISPATCHER_EMAIL || "";
    const envEmails = raw
      ? raw
          .split(/[,;]/)
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    const fallback = "minimalwebsoft@gmail.com";
    return Array.from(new Set([...dbEmails, ...envEmails, fallback]));
  } catch (err) {
    console.error("[notifications] getDispatcherEmails error", err);
    return ["minimalwebsoft@gmail.com"];
  }
}

export async function GET() {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  try {
    const col = await getBookingsCollection();

    const pendingBookingCount = await col.countDocuments({ status: "pending" });

    const recentDocs = await col
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    const recentBookings = recentDocs.map((doc: any) => ({
      bookingCode: doc.bookingCode,
      travelerName: doc.travelerName,
      pickupDate: doc.pickupDate,
      pickupTime: doc.pickupTime,
      status: doc.status,
    }));

    const dispatchers = await getDispatcherEmails();
    const pollToken = generateRandomToken(64);

    return NextResponse.json({
      pendingBookingCount,
      dispatchers,
      pollToken,
      recentBookings,
    });
  } catch (err) {
    console.error("[notifications GET error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

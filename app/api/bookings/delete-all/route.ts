import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { getMongoClient } from "@/lib/mongodb";
import { createAuditLog } from "@/lib/audit-logs";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  // Csak admin törölheti az összes foglalást
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Ehhez a művelethez admin jogosultság szükséges" },
      { status: 403 }
    );
  }

  try {
    // Megerősítő token ellenőrzése a request body-ban
    const body = (await request.json().catch(() => ({}))) as { confirm?: string };
    if (body.confirm !== "TOROL_MINDEN_FOGLALAST") {
      return NextResponse.json(
        { error: "Hiányzó megerősítés" },
        { status: 400 }
      );
    }

    // 1. Diszpécser saját bookings collection törlése
    const dispatcherBookings = await getCollection("bookings");
    const dispatcherCount = await dispatcherBookings.countDocuments({});
    await dispatcherBookings.deleteMany({});

    // 2. Partnercégek portál db-jéből is törlés (pannontransferfoglalasikozpont db)
    // Ugyanazon MongoDB cluster, de potenciálisan másik DB name
    let partnerCount = 0;
    try {
      const mongoClient = await getMongoClient();
      const partnerDbName = process.env.PARTNER_MONGODB_DB || "pannontransferfoglalasikozpont";
      const partnerDb = mongoClient.db(partnerDbName);
      const partnerBookings = partnerDb.collection("bookings");
      partnerCount = await partnerBookings.countDocuments({});
      await partnerBookings.deleteMany({});

      // Booking logok törlése is
      const partnerBookingLogs = partnerDb.collection("booking_logs");
      await partnerBookingLogs.deleteMany({});
    } catch (partnerErr) {
      console.warn("[delete-all] Partner db törlés sikertelen (lehet, hogy azonos db):", partnerErr);
      // Nem fatális - ha ugyanaz a db, a diszpécser törlés már elvégezte
    }

    const totalDeleted = dispatcherCount + partnerCount;

    // Audit log bejegyzés
    await createAuditLog({
      timestamp: Date.now(),
      action: "bookings.delete_all",
      actor: user.email,
      targetType: "booking",
      targetId: "ALL",
      details: JSON.stringify({
        deletedCount: totalDeleted,
        dispatcherCount,
        partnerCount,
        reason: "Teljes adatbázis törlés az admin által",
      }),
    });

    return NextResponse.json({
      success: true,
      deletedCount: totalDeleted,
      message: `${totalDeleted} foglalás sikeresen törölve (diszpécser: ${dispatcherCount}, partner portál: ${partnerCount}).`,
    });
  } catch (err) {
    console.error("[bookings delete-all error]", err);
    return NextResponse.json({ error: "Szerver hiba a törlés közben" }, { status: 500 });
  }
}

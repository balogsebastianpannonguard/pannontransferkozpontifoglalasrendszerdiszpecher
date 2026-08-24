import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  listAllBookings,
  createBooking,
  countBookingsByStatus,
  type BookingStatus,
} from "@/lib/bookings";
import { createAuditLog } from "@/lib/audit-logs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as BookingStatus | undefined;
    const fromDate = searchParams.get("fromDate") || undefined;
    const toDate = searchParams.get("toDate") || undefined;

    const filter: { status?: BookingStatus; fromDate?: string; toDate?: string } = {};
    if (status) filter.status = status;
    if (fromDate) filter.fromDate = fromDate;
    if (toDate) filter.toDate = toDate;

    const bookings = await listAllBookings(filter);
    const { pendingCount, totalCount } = await countBookingsByStatus();

    return NextResponse.json({
      bookings,
      meta: {
        pendingCount,
        totalCount,
      },
    });
  } catch (err) {
    console.error("[bookings GET error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;

    const requiredFields = [
      "userEmail",
      "travelerEmail",
      "travelerName",
      "travelerPhone",
      "paymentMethod",
      "transferType",
      "fromType",
      "fromAddress",
      "toType",
      "toAddress",
      "pickupDate",
      "pickupTime",
      "travelers",
      "luggage",
      "category",
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json(
          { error: `Hiányzó mező: ${field}` },
          { status: 400 }
        );
      }
    }

    const booking = await createBooking(body as any, user.email);

    await createAuditLog({
      timestamp: Date.now(),
      action: "booking.created",
      actor: user.email,
      targetType: "booking",
      targetId: booking._id,
      details: JSON.stringify({
        bookingCode: booking.bookingCode,
        travelerName: booking.travelerName,
      }),
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    console.error("[bookings POST error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

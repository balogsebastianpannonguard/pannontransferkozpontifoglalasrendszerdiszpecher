import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getBookingById, updateBooking, type Booking } from "@/lib/bookings";
import { createAuditLog } from "@/lib/audit-logs";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Foglalás nem található" }, { status: 404 });
    }
    return NextResponse.json({ booking });
  } catch (err) {
    console.error("[booking GET error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await getBookingById(id);
    if (!existing) {
      return NextResponse.json({ error: "Foglalás nem található" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Partial<Booking>;

    const patch: Partial<Omit<Booking, "_id" | "createdAt" | "updatedAt" | "auditTrail">> =
      {};

    const allowedFields: (keyof Omit<
      Booking,
      "_id" | "createdAt" | "updatedAt" | "auditTrail"
    >)[] = [
      "bookingCode",
      "userEmail",
      "travelerEmail",
      "travelerName",
      "travelerPhone",
      "secondTravelerEmail",
      "secondTravelerPhone",
      "companyName",
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
      "comment",
      "category",
      "status",
      "assignedDriverId",
      "assignedDriverName",
      "assignedVehicleId",
      "assignedVehicleName",
      "price",
      "createdBy",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        (patch as any)[field] = (body as any)[field];
      }
    }

    const updated = await updateBooking(id, patch, user.email, "Dispatcher módosítás");
    if (!updated) {
      return NextResponse.json({ error: "Módosítás sikertelen" }, { status: 400 });
    }

    await createAuditLog({
      timestamp: Date.now(),
      action: "booking.modified",
      actor: user.email,
      targetType: "booking",
      targetId: id,
      details: JSON.stringify(patch),
    });

    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("[booking PATCH error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

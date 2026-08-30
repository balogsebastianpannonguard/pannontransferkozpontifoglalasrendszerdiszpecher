import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getBookingById, updateBooking } from "@/lib/bookings";
import { createAuditLog } from "@/lib/audit-logs";
// import { sendEmail } from "@/lib/email"; // TODO: Email sending logic

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  try {
    const { withDriver } = await request.json();
    const id = params.id;
    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "A foglalás nem található" }, { status: 404 });
    }

    if (withDriver && !booking.assignedDriverId) {
      return NextResponse.json({ error: "Nincs sofőr hozzárendelve" }, { status: 400 });
    }

    const newStatus = "confirmed";
    const updateData: any = { status: newStatus };

    if (withDriver) {
      updateData.driverNotified = true;
      updateData.driverAcknowledged = false;
    }

    const actor = user.name || user.email;
    await updateBooking(id, updateData, actor, withDriver ? "Véglegesítve és kiküldve a sofőrnek" : "Véglegesítve");

    // TODO: Send emails here to traveler and optionally to driver
    // if (withDriver) { sendEmail(driverEmail...) }
    // sendEmail(travelerEmail...)

    await createAuditLog({
      action: "booking.status_changed",
      actor: actor,
      targetType: "booking",
      targetId: id,
      timestamp: Date.now(),
      details: {
        from: booking.status,
        to: newStatus,
        message: withDriver ? "Véglegesítve és kiküldve a sofőrnek." : "Véglegesítve (utas értesítve).",
      },
    });

    const updatedBooking = await getBookingById(id);
    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error: any) {
    console.error("[Booking Finalize API error]", error);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

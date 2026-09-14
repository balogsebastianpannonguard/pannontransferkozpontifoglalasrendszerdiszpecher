import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentSession } from "@/lib/auth";
import { getBookingById, updateBooking } from "@/lib/bookings";
import { createAuditLog } from "@/lib/audit-logs";
import { sendEmail } from "@/lib/nodemailer";
import { buildTravelerFinalizedEmail } from "@/lib/email-templates";
import { getMongoDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  try {
    const { withDriver } = await request.json();
    const { id } = await params;

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

    const db = await getMongoDb();
    const assignedDriver =
      booking.assignedDriverId && ObjectId.isValid(booking.assignedDriverId)
        ? await db.collection("staff_users").findOne(
            { _id: new ObjectId(booking.assignedDriverId) },
            { projection: { name: 1, phone: 1, email: 1 } }
          )
        : null;

    let emailWarning: string | null = null;
    if (booking.travelerEmail) {
      const travelerEmailHtml = buildTravelerFinalizedEmail({
        bookingCode: booking.bookingCode,
        travelerName: booking.travelerName,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        fromAddress: booking.fromAddress,
        toAddress: booking.toAddress,
        travelers: booking.travelers,
        luggage: booking.luggage,
        transferType: booking.transferType,
        paymentMethod: booking.paymentMethod,
        companyName: booking.companyName,
        assignedDriverName:
          booking.assignedDriverName || assignedDriver?.name || undefined,
        assignedDriverPhone: assignedDriver?.phone || undefined,
        assignedVehicleName: booking.assignedVehicleName,
        price: booking.price,
        comment: booking.comment,
      });

      const travelerEmailResult = await sendEmail({
        to: booking.travelerEmail,
        subject: `Utazása véglegesítve · #${booking.bookingCode} · Pannon Transfer`,
        html: travelerEmailHtml,
      });

      if (!travelerEmailResult.success) {
        emailWarning = "A foglalás véglegesítve lett, de az utas e-mail kiküldése nem sikerült.";
      }
    }

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
    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      warning: emailWarning,
    });
  } catch (error: any) {
    console.error("[Booking Finalize API error]", error);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

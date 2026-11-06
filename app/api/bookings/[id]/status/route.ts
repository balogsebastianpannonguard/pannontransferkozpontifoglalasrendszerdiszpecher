import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  getBookingById,
  updateBookingStatus,
  type BookingStatus,
} from "@/lib/bookings";
import { createAuditLog } from "@/lib/audit-logs";
import { updateDriver } from "@/lib/drivers";
import { updateVehicle } from "@/lib/vehicles";
import { sendEmail } from "@/lib/nodemailer";
import { isNiBooking, niCopyRecipients } from "@/lib/ni-recipients";
import { buildBookingModificationEmail } from "@/lib/email-templates";
import { buildTrackUrl } from "@/lib/partner-portal-url";

export const dynamic = "force-dynamic";

const VALID_STATUSES: BookingStatus[] = [
  "pending",
  "modified",
  "confirmed",
  "in-progress",
  "completed",
  "cancelled",
];

export async function POST(
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

    const body = (await request.json().catch(() => ({}))) as {
      status: BookingStatus;
      details?: string;
    };

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: "Érvénytelen vagy hiányzó státusz" },
        { status: 400 }
      );
    }

    const oldStatus = existing.status;
    const updated = await updateBookingStatus(
      id,
      body.status,
      user.email,
      body.details
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Státusz módosítás sikertelen" },
        { status: 400 }
      );
    }

    if (body.status === "completed" || body.status === "cancelled") {
      if (existing.assignedVehicleId) {
        await updateVehicle(existing.assignedVehicleId, { status: "parked" });
      }
      if (existing.assignedDriverId) {
        await updateDriver(existing.assignedDriverId, { status: "active" });
      }
    }

    await createAuditLog({
      timestamp: Date.now(),
      action: "booking.status_changed",
      actor: user.email,
      targetType: "booking",
      targetId: id,
      details: JSON.stringify({
        oldStatus,
        newStatus: body.status,
        details: body.details || "",
      }),
    });

    const emailTarget = existing.userEmail || existing.travelerEmail;
    // E-mailt csak a lemondásról küldünk innen; minden más státuszváltásról
    // (pl. véglegesítés) a dedikált /finalize route küld értesítést, vagy
    // egyáltalán nem küldünk (pl. sima adminisztratív státuszváltás).
    if (emailTarget && oldStatus !== body.status && body.status === "cancelled") {
      const cancelTargets = [emailTarget];
      if (isNiBooking(existing)) {
        // NI: az utas, az admin, a Location Support és az NI felügyelő is értesül.
        if (existing.travelerEmail) cancelTargets.push(existing.travelerEmail);
        cancelTargets.push(...niCopyRecipients(existing));
      }
      const uniqueCancelTargets = Array.from(new Map(cancelTargets.map((e) => [e.trim().toLowerCase(), e.trim()])).values());
      for (const cancelTo of uniqueCancelTargets) {
      const emailResult = await sendEmail({
        to: cancelTo,
        subject:
          existing.language === "en"
            ? `Booking cancelled · #${existing.bookingCode}`
            : `Foglalás lemondva · #${existing.bookingCode}`,
        html: buildBookingModificationEmail({
          bookingCode: existing.bookingCode,
          travelerName: existing.travelerName,
          changes: [{
            field: "Foglalás állapota",
            oldValue: oldStatus,
            newValue: body.status,
          }],
          trackUrl: buildTrackUrl(existing.bookingTrackToken),
          language: existing.language,
        }),
      });
      if (!emailResult.success) {
        console.warn("[booking status] lemondási e-mail nem küldhető:", cancelTo, emailResult.error);
      }
      }
    }

    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("[booking status error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

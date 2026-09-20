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
    if (emailTarget && oldStatus !== body.status) {
      const emailResult = await sendEmail({
        to: emailTarget,
        subject: `Foglalás állapota módosítva · #${existing.bookingCode}`,
        html: buildBookingModificationEmail({
          bookingCode: existing.bookingCode,
          travelerName: existing.travelerName,
          changes: [{
            field: "Foglalás állapota",
            oldValue: oldStatus,
            newValue: body.status,
          }],
          trackUrl: buildTrackUrl(existing.bookingTrackToken),
        }),
      });
      if (!emailResult.success) {
        console.warn("[booking status] módosítási e-mail nem küldhető:", emailResult.error);
      }
    }

    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("[booking status error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

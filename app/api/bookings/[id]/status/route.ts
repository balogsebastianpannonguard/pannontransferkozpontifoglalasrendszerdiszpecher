import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  getBookingById,
  updateBookingStatus,
  type BookingStatus,
} from "@/lib/bookings";
import { createAuditLog } from "@/lib/audit-logs";

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

    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("[booking status error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

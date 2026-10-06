import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-logs";
import {
  MAX_ADVANCE_ROWS,
  createAdvanceBookings,
  deleteAdvanceBooking,
  listAdvanceBookings,
  type AdvanceTripInput,
} from "@/lib/advance-bookings";

export const dynamic = "force-dynamic";

async function requireStaff() {
  const user = await getCurrentSession();
  if (!user || (user.role !== "dispatcher" && user.role !== "admin")) return null;
  return user;
}

/** Egy hónap (?month=ÉÉÉÉ-HH) előre felvett útjai – minden diszpécser látja mindegyiket. */
export async function GET(request: NextRequest) {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });

  const month = new URL(request.url).searchParams.get("month") || "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: "Érvénytelen hónap." }, { status: 400 });
  }
  try {
    const items = await listAdvanceBookings(month, { email: user.email, role: user.role });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[advance-bookings GET]", error);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

/** Több út mentése egyszerre. A válasz soronként jelzi, melyik sikerült. */
export async function POST(request: NextRequest) {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });

  try {
    const body = (await request.json().catch(() => ({}))) as { trips?: Array<Partial<AdvanceTripInput>>; batchId?: string };
    const trips = Array.isArray(body.trips) ? body.trips : [];
    if (trips.length === 0) return NextResponse.json({ error: "Nincs mentendő út." }, { status: 400 });
    if (trips.length > MAX_ADVANCE_ROWS) {
      return NextResponse.json({ error: `Egyszerre legfeljebb ${MAX_ADVANCE_ROWS} út menthető.` }, { status: 400 });
    }
    const batchId = typeof body.batchId === "string" ? body.batchId.slice(0, 64) : "";

    const { results, alreadySaved } = await createAdvanceBookings(
      trips,
      { email: user.email, name: user.name || user.email },
      batchId
    );
    if (alreadySaved) return NextResponse.json({ alreadySaved: true, results: [], saved: 0 });

    const saved = results.filter((r) => r.ok).length;
    if (saved > 0) {
      await createAuditLog({
        timestamp: Date.now(),
        action: "booking.advance_created",
        actor: user.email,
        targetType: "booking",
        details: JSON.stringify({ saved, failed: results.length - saved, batchId }),
      });
    }
    return NextResponse.json({ results, saved }, { status: saved > 0 ? 201 : 400 });
  } catch (error) {
    console.error("[advance-bookings POST]", error);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

/** Saját (vagy adminként bármelyik) még nem kiosztott előre felvett út törlése. */
export async function DELETE(request: NextRequest) {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id") || "";
  const result = await deleteAdvanceBooking(id, { email: user.email, role: user.role });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  await createAuditLog({
    timestamp: Date.now(),
    action: "booking.advance_deleted",
    actor: user.email,
    targetType: "booking",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}

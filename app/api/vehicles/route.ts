import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  seedVehiclesIfEmpty,
  updateVehicle,
  type Vehicle,
  type VehicleCondition,
  type VehicleStatus,
} from "@/lib/vehicles";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

async function requireAuth() {
  const user = await getCurrentSession();
  if (!user || (user.role !== "admin" && user.role !== "dispatcher")) {
    return null;
  }
  return user;
}

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Nincs jogosultságod." }, { status: 401 });
    await seedVehiclesIfEmpty();
    const list = await listVehicles();
    return NextResponse.json({ vehicles: list });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Hiba" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Nincs jogosultságod." }, { status: 401 });
    const body = (await req.json()) as Partial<Vehicle> & { seed?: boolean };
    if (body?.seed) {
      const inserted = await seedVehiclesIfEmpty();
      return NextResponse.json({ ok: true, inserted });
    }
    if (!body.name || !body.type) {
      return NextResponse.json({ error: "Név és típus megadása kötelező." }, { status: 400 });
    }
    const created = await createVehicle({
      name: String(body.name).trim(),
      type: String(body.type).trim(),
      plates: body.plates ? String(body.plates).trim() : undefined,
      seats: body.seats ? Number(body.seats) : undefined,
      color: body.color ? String(body.color).trim() : undefined,
      status: (body.status as VehicleStatus) || "parked",
      condition: (body.condition as VehicleCondition) || "working",
      note: body.note ? String(body.note).trim() : undefined,
    });
    return NextResponse.json({ ok: true, vehicle: created });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Hiba" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Nincs jogosultságod." }, { status: 401 });
    const body = (await req.json()) as Partial<Vehicle> & { id: string };
    if (!body.id) return NextResponse.json({ error: "Hiányzó id." }, { status: 400 });
    const patch: Partial<Vehicle> = {};
    if (body.name !== undefined) patch.name = String(body.name).trim();
    if (body.type !== undefined) patch.type = String(body.type).trim();
    if (body.plates !== undefined) patch.plates = body.plates ? String(body.plates).trim() : undefined;
    if (body.seats !== undefined) patch.seats = Number(body.seats);
    if (body.color !== undefined) patch.color = body.color ? String(body.color).trim() : undefined;
    if (body.status !== undefined) patch.status = body.status as VehicleStatus;
    if (body.condition !== undefined) patch.condition = body.condition as VehicleCondition;
    if (body.note !== undefined) patch.note = body.note ? String(body.note).trim() : undefined;
    const ok = await updateVehicle(body.id, patch);
    return NextResponse.json({ ok });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Hiba" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Nincs jogosultságod." }, { status: 401 });
    const body = (await req.json()) as { id: string };
    if (!body?.id) return NextResponse.json({ error: "Hiányzó id." }, { status: 400 });
    let ok = false;
    try {
      ok = await deleteVehicle(new ObjectId(body.id));
    } catch {
      ok = await deleteVehicle(body.id);
    }
    return NextResponse.json({ ok });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Hiba" }, { status: 500 });
  }
}

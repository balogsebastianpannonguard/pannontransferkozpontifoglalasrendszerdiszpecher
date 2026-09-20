import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-logs";
import { getDrivers, createDriver, updateDriver, deleteDriver } from "@/lib/drivers";

export async function GET() {
  try {
    const drivers = await getDrivers();
    return NextResponse.json({ success: true, drivers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentSession();
    if (!user) return NextResponse.json({ success: false, error: "Nincs jogosultságod" }, { status: 401 });
    const body = await req.json();
    const driver = await createDriver(body);
    await createAuditLog({
      timestamp: Date.now(),
      action: "driver.created",
      actor: user.email,
      targetType: "driver",
      targetId: String(driver._id || ""),
      details: JSON.stringify({ name: driver.name }),
    });
    return NextResponse.json({ success: true, driver });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentSession();
    if (!user) return NextResponse.json({ success: false, error: "Nincs jogosultságod" }, { status: 401 });
    const body = await req.json();
    const { id, ...patch } = body;
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    await updateDriver(id, patch);
    await createAuditLog({
      timestamp: Date.now(),
      action: "driver.modified",
      actor: user.email,
      targetType: "driver",
      targetId: id,
      details: JSON.stringify(patch),
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentSession();
    if (!user) return NextResponse.json({ success: false, error: "Nincs jogosultságod" }, { status: 401 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    await deleteDriver(body.id);
    await createAuditLog({
      timestamp: Date.now(),
      action: "driver.deleted",
      actor: user.email,
      targetType: "driver",
      targetId: body.id,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

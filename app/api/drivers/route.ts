import { NextResponse } from "next/server";
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
    const body = await req.json();
    const driver = await createDriver(body);
    return NextResponse.json({ success: true, driver });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...patch } = body;
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    await updateDriver(id, patch);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    await deleteDriver(body.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

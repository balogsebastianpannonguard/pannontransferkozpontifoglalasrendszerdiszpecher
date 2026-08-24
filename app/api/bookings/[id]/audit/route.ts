import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { listAuditLogsForTarget } from "@/lib/audit-logs";

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
    const logs = await listAuditLogsForTarget("booking", id, 100);
    return NextResponse.json({ logs });
  } catch (err) {
    console.error("[booking audit error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

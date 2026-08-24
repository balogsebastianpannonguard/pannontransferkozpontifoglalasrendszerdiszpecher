import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  listAllAuditLogs,
  listAuditLogsForActor,
  listAuditLogsForTarget,
  getAuditLogsCollection,
  initAuditIndexes,
} from "@/lib/audit-logs";
import { Filter } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const actor = searchParams.get("actor") || undefined;
    const targetType = searchParams.get("targetType") as
      | "booking"
      | "driver"
      | "vehicle"
      | undefined;
    const targetId = searchParams.get("targetId") || undefined;
    const limitRaw = searchParams.get("limit");
    const skipRaw = searchParams.get("skip");

    const limit = limitRaw ? Math.min(parseInt(limitRaw, 10) || 100, 500) : 100;
    const skip = skipRaw ? Math.max(parseInt(skipRaw, 10) || 0, 0) : 0;

    if (actor && !targetType && !targetId) {
      const logs = await listAuditLogsForActor(actor, limit);
      return NextResponse.json({ logs });
    }

    if (targetType && targetId && !actor) {
      const logs = await listAuditLogsForTarget(targetType, targetId, limit);
      return NextResponse.json({ logs });
    }

    if (actor || targetType || targetId) {
      await initAuditIndexes();
      const col = await getAuditLogsCollection();
      const query: Filter<any> = {};
      if (actor) query.actor = actor;
      if (targetType) query.targetType = targetType;
      if (targetId) query.targetId = targetId;

      const docs = await col
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const logs = docs.map((doc: any) => ({
        ...doc,
        _id: doc._id.toString(),
      }));

      return NextResponse.json({ logs });
    }

    const logs = await listAllAuditLogs(limit, skip);
    return NextResponse.json({ logs });
  } catch (err) {
    console.error("[audit-logs GET error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

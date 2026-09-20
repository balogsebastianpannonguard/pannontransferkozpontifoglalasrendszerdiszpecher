import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-logs";

export async function POST() {
  try {
    const user = await getCurrentSession();
    if (user) {
      await createAuditLog({
        timestamp: Date.now(),
        action: "auth.logout",
        actor: user.email,
      });
    }
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Kijelentkezési hiba történt." }, { status: 500 });
  }
}

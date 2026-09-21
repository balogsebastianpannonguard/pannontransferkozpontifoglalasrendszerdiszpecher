import { NextRequest, NextResponse } from "next/server";
import { findStaffUserByDirectLoginToken, recordStaffSuccessfulLogin } from "@/lib/staff-auth";
import { createSessionToken, setSessionCookie, type DispatcherUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-logs";

export const dynamic = "force-dynamic";

/**
 * Password-less "direct login" for staff members who were given a personal,
 * persistent access link (?token=... on /login). Does not affect the normal
 * email+password login flow in any way.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { token?: string };
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Hiányzó token." },
        { status: 400 }
      );
    }

    const staffUser = await findStaffUserByDirectLoginToken(token);
    if (!staffUser || !staffUser._id) {
      return NextResponse.json(
        { success: false, message: "Érvénytelen link." },
        { status: 404 }
      );
    }
    if (!staffUser.isActivated) {
      return NextResponse.json(
        { success: false, message: "A fiók még nincs aktiválva." },
        { status: 400 }
      );
    }
    if (staffUser.role !== "admin" && staffUser.role !== "dispatcher") {
      return NextResponse.json(
        { success: false, message: "Nincs jogosultság a Diszpécser Központba." },
        { status: 403 }
      );
    }

    const user: DispatcherUser = {
      email: staffUser.email,
      name: staffUser.name || staffUser.email.split("@")[0],
      role: staffUser.role,
      company: process.env.DISPATCHER_COMPANY || "Pannon Transfer",
      loginAt: Date.now(),
      requireTwoFactor: !!staffUser.requireTwoFactor,
      twoFactorEnabled: !!staffUser.twoFactorEnabled,
      staffId: String(staffUser._id),
    };

    const sessionToken = createSessionToken(user, true);
    await setSessionCookie(sessionToken, true);
    await recordStaffSuccessfulLogin(staffUser._id);
    await createAuditLog({
      timestamp: Date.now(),
      action: "auth.direct_login",
      actor: user.email,
      details: JSON.stringify({ role: user.role }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Dispatcher Direct Login Error]", err);
    return NextResponse.json(
      { success: false, message: "Váratlan hiba történt. Kérjük, próbálja újra." },
      { status: 500 }
    );
  }
}

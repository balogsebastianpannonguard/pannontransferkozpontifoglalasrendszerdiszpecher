import { NextRequest, NextResponse } from "next/server";
import {
  verifyCredentials,
  createSessionToken,
  setSessionCookie,
  getDispatcherProfile,
  type DispatcherUser,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
      remember?: boolean;
    };
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const remember = body.remember !== false;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Kérjük, adja meg az e-mail címet és a jelszót." },
        { status: 400 }
      );
    }

    const result = await verifyCredentials(email, password);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, message: result.message || "Hibás e-mail cím vagy jelszó." },
        { status: 401 }
      );
    }

    // 2FA check: ha kötelező de még nincs bekapcsolva, akkor is engedjük a belépést,
    // de a frontend értesíti a felhasználót, hogy be kell kapcsolnia.
    // Egy másik megközelítés: most a sessionbe beleírjuk az requireTwoFactor és twoFactorEnabled mezőket.

    const user: DispatcherUser = await getDispatcherProfile(result.user);
    const token = createSessionToken(user, remember);
    await setSessionCookie(token, remember);

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        loginAt: user.loginAt,
        requireTwoFactor: !!user.requireTwoFactor,
        twoFactorEnabled: !!user.twoFactorEnabled,
        staffId: user.staffId,
      },
    });
  } catch (err) {
    console.error("[Dispatcher Login Error]", err);
    return NextResponse.json(
      { success: false, message: "Váratlan hiba történt. Kérjük, próbálja újra." },
      { status: 500 }
    );
  }
}

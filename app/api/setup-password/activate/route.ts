import { NextRequest, NextResponse } from "next/server";
import {
  findStaffUserByInviteToken,
  setStaffUserPasswordAndActivate,
  type StaffUser,
} from "@/lib/staff-auth";
import { createSessionToken, setSessionCookie, getDispatcherProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      token?: string;
      password?: string;
      name?: string;
    };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Hiányzó aktiválási token." },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "A jelszónak legalább 6 karakter hosszúnak kell lennie." },
        { status: 400 }
      );
    }

    const user: StaffUser | null = await findStaffUserByInviteToken(token);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Érvénytelen vagy lejárt aktiválási link. Kérjük, szólj a rendszergazdának, hogy újraküldje a meghívást.",
        },
        { status: 400 }
      );
    }
    if (!user._id) {
      return NextResponse.json(
        { success: false, message: "Rendszerhiba: felhasználó ID hiányzik." },
        { status: 500 }
      );
    }

    const ok = await setStaffUserPasswordAndActivate(user._id, password);
    if (!ok) {
      return NextResponse.json(
        { success: false, message: "Nem sikerült a jelszó beállítása. Kérjük, próbálja újra." },
        { status: 500 }
      );
    }

    // Auto-login after activation
    const profile = await getDispatcherProfile({
      email: user.email,
      name: user.name || user.email.split("@")[0],
      role: user.role as any,
      loginAt: Date.now(),
      requireTwoFactor: !!user.requireTwoFactor,
      twoFactorEnabled: !!user.twoFactorEnabled,
      staffId: String(user._id),
    });
    const sessionToken = createSessionToken(profile, true);
    await setSessionCookie(sessionToken, true);

    return NextResponse.json({
      success: true,
      message: "Fiók sikeresen aktiválva! Belépés folyamatban...",
      user: {
        email: profile.email,
        name: profile.name,
        role: profile.role,
        company: profile.company,
        loginAt: profile.loginAt,
        requireTwoFactor: !!profile.requireTwoFactor,
        twoFactorEnabled: !!profile.twoFactorEnabled,
      },
    });
  } catch (err) {
    console.error("[setup-password activate] error", err);
    return NextResponse.json(
      { success: false, message: "Váratlan hiba történt. Kérjük, próbálja újra." },
      { status: 500 }
    );
  }
}

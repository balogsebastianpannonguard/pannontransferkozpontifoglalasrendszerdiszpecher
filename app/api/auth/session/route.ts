import { NextResponse } from "next/server";
import { getCurrentSession, isAlwaysLoggedIn, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }
    // Tartósan bejelentkezett felhasználó: minden ellenőrzéskor megújítjuk a sütit.
    if (isAlwaysLoggedIn(user.email)) {
      const { iat: _iat, exp: _exp, ...profile } = user as typeof user & { iat?: number; exp?: number };
      void _iat; void _exp;
      await setSessionCookie(createSessionToken(profile, true), true);
    }
    return NextResponse.json({
      authenticated: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        loginAt: user.loginAt,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}

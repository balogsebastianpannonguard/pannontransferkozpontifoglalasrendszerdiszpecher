import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
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

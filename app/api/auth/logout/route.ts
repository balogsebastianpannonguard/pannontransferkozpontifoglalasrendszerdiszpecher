import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Kijelentkezési hiba történt." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  findStaffUserByInviteToken,
  setStaffUserPasswordAndActivate,
  type StaffUser,
} from "@/lib/staff-auth";

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

    return NextResponse.json({
      success: true,
      message: "Fiók sikeresen aktiválva! Kérjük, jelentkezzen be.",
    });
  } catch (err) {
    console.error("[setup-password activate] error", err);
    return NextResponse.json(
      { success: false, message: "Váratlan hiba történt. Kérjük, próbálja újra." },
      { status: 500 }
    );
  }
}

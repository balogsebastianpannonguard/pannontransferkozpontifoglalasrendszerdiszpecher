import { NextRequest, NextResponse } from "next/server";
import { findStaffUserByInviteToken, type StaffUser } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || "";
    const role = searchParams.get("role") || "dispatcher";

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Hiányzó aktiválási token." },
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

    // Dispatcher központ csak dispatcher és admin role számára érhető el
    if (user.role !== "dispatcher" && user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "A szerepköröd miatt nem férsz hozzá a Diszpécser Központhoz. Kérjük, vedd fel a kapcsolatot a rendszergazdával.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        requireTwoFactor: !!user.requireTwoFactor,
        inviteExpiresAt: user.inviteExpiresAt,
      },
      roleRequested: role,
    });
  } catch (err) {
    console.error("[setup-password verify] error", err);
    return NextResponse.json(
      { success: false, message: "Váratlan hiba történt. Kérjük, próbálja újra." },
      { status: 500 }
    );
  }
}

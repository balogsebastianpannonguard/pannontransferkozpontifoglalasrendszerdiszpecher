import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email = "dispecer@pannon.hu" } = await request.json().catch(() => ({}));

    const dummyUser = {
      email,
      name: "Pannon Diszpécser",
      role: "dispatcher",
      company: "Pannon Transfer",
    };

    return NextResponse.json({
      success: true,
      user: dummyUser,
      _note: "Auth temporarily disabled — everything succeeds. Will be wired later.",
    });
  } catch (err) {
    console.error("[Dispatcher Login Error]", err);
    return NextResponse.json(
      { success: false, message: "Váratlan hiba történt. Kérjük, próbálja újra." },
      { status: 500 }
    );
  }
}

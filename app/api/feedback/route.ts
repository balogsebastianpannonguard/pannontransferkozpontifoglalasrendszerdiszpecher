import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { listFeedbacks } from "@/lib/feedbacks";

export const dynamic = "force-dynamic";

/** A diszpécser/admin „Visszajelzések” füléhez: a leadott visszajelzések, legújabb elöl. */
export async function GET() {
  const user = await getCurrentSession();
  if (!user || (user.role !== "dispatcher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  try {
    const feedbacks = await listFeedbacks();
    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error("[feedback GET error]", error);
    return NextResponse.json({ error: "A visszajelzések nem tölthetők be." }, { status: 500 });
  }
}

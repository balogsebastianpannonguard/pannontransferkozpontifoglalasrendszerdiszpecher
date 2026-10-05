import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createTestFeedbackRequest } from "@/lib/feedbacks";
import { buildNiFeedbackRequestHtml } from "@/lib/feedback-request-email";
import { sendEmail } from "@/lib/nodemailer";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * NI próba visszajelzés (csak admin): létrehoz egy próba kérdőívet a valódi oldalon.
 * - sendEmail !== false: az utasnak menő levél ugyanazzal a tartalommal a megadott címre megy.
 * - A kitöltés összefoglalója szintén a megadott címre érkezik, a Location Support nem kap semmit.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Csak admin indíthat próba visszajelzést." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string; language?: string; sendEmail?: boolean };
    const email = String(body.email || "").trim();
    const language = body.language === "en" ? "en" : "hu";
    const shouldSend = body.sendEmail !== false;

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Adj meg egy érvényes e-mail címet." }, { status: 400 });
    }

    const travelerName = (user.name || "").trim() || (language === "en" ? "Test Passenger" : "Teszt Utas");
    const created = await createTestFeedbackRequest({ recipient: email, travelerName, language });

    let sent = false;
    if (shouldSend) {
      const result = await sendEmail({
        to: email,
        subject:
          language === "en"
            ? `[TEST] Your trip is complete – share your feedback – #${created.bookingCode}`
            : `[PRÓBA] Az utazása befejeződött – kérjük, adjon visszajelzést – #${created.bookingCode}`,
        html: buildNiFeedbackRequestHtml({
          travelerName,
          bookingCode: created.bookingCode,
          feedbackUrl: created.url,
          language,
        }),
      });
      sent = result.success;
      if (!result.success) {
        console.error("[feedback test] email failed", result.error);
        return NextResponse.json(
          { error: "A próba levél küldése nem sikerült. A kérdőív linkje ettől még használható.", url: created.url },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ success: true, url: created.url, sent, email, bookingCode: created.bookingCode });
  } catch (error) {
    console.error("[feedback test error]", error);
    return NextResponse.json({ error: "A próba visszajelzés létrehozása nem sikerült." }, { status: 500 });
  }
}

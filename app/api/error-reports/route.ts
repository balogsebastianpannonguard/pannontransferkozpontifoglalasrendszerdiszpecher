import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-logs";
import {
  createErrorReport,
  listErrorReportsForReporter,
} from "@/lib/error-reports";
import { sendEmail } from "@/lib/nodemailer";

export const dynamic = "force-dynamic";

const RECIPIENT = "balogh.sebastian@pannonguard.hu";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function GET() {
  const user = await getCurrentSession();
  if (!user) return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });

  try {
    const reports = await listErrorReportsForReporter(user.email.toLowerCase());
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("[error-reports GET error]", error);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentSession();
  if (!user) return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });

  try {
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      description?: string;
    };
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();

    if (!title || !description) {
      return NextResponse.json(
        { error: "A cím és a hiba részletes leírása kötelező." },
        { status: 400 }
      );
    }
    if (title.length > 160 || description.length > 10_000) {
      return NextResponse.json({ error: "A bejelentés túl hosszú." }, { status: 400 });
    }

    const report = await createErrorReport({
      title,
      description,
      reporterEmail: user.email.toLowerCase(),
      reporterName: user.name || user.email,
      createdAt: Date.now(),
      status: "open",
    });

    await createAuditLog({
      timestamp: Date.now(),
      action: "error_report.created",
      actor: user.email,
      details: JSON.stringify({ reportId: report._id, title }),
    });

    const emailResult = await sendEmail({
      to: RECIPIENT,
      subject: `Új hibabejelentés · ${title}`,
      text: [
        `Új hibabejelentés érkezett.`,
        `Cím: ${title}`,
        `Bejelentő: ${user.name || "Ismeretlen"} (${user.email})`,
        "",
        description,
      ].join("\n"),
      html: `<h2>Új hibabejelentés érkezett</h2>
        <p><strong>Cím:</strong> ${escapeHtml(title)}</p>
        <p><strong>Bejelentő:</strong> ${escapeHtml(user.name || "Ismeretlen")} (${escapeHtml(user.email)})</p>
        <p><strong>Leírás:</strong></p>
        <p>${escapeHtml(description).replaceAll("\n", "<br />")}</p>`,
    });

    if (!emailResult.success) {
      console.error("[error-reports POST email error]", emailResult.error);
      return NextResponse.json(
        { error: "A hibajegy mentése sikerült, de az értesítő e-mail küldése nem sikerült." },
        { status: 502 }
      );
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("[error-reports POST error]", error);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

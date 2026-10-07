import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getErrorReportFile } from "@/lib/error-reports";

export const dynamic = "force-dynamic";

/** Csatolt kép megjelenítése – csak a bejelentő (vagy admin) láthatja. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentSession();
  if (!user) return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });

  const { id } = await params;
  const file = await getErrorReportFile(id);
  if (!file) return NextResponse.json({ error: "A kép nem található." }, { status: 404 });

  const isOwner = file.reporterEmail.toLowerCase() === user.email.toLowerCase();
  if (!isOwner && user.role !== "admin") return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 403 });

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

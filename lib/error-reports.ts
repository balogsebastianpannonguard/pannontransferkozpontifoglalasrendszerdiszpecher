import { Binary, ObjectId } from "mongodb";
import { getMongoDb } from "./mongodb";

export interface ErrorReportAttachment {
  id: string;
  name: string;
  mime: string;
  size: number;
}

export interface ErrorReport {
  _id?: string;
  title: string;
  description: string;
  reporterEmail: string;
  reporterName: string;
  createdAt: number;
  status: "open" | "in_progress" | "resolved";
  attachments?: ErrorReportAttachment[];
}

const COLLECTION_NAME = "dispatcher_error_reports";
const FILES_COLLECTION_NAME = "dispatcher_error_report_files";

export async function getErrorReportsCollection() {
  const db = await getMongoDb();
  return db.collection<ErrorReport>(COLLECTION_NAME);
}

export async function initErrorReportIndexes() {
  const collection = await getErrorReportsCollection();
  await collection.createIndex({ reporterEmail: 1, createdAt: -1 });
  await collection.createIndex({ createdAt: -1 });
}

export async function listErrorReportsForReporter(reporterEmail: string) {
  await initErrorReportIndexes();
  const reports = await (await getErrorReportsCollection())
    .find({ reporterEmail })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return reports.map((report) => ({
    ...report,
    _id: report._id?.toString(),
  }));
}

export async function createErrorReport(
  report: Omit<ErrorReport, "_id">
): Promise<ErrorReport> {
  await initErrorReportIndexes();
  const collection = await getErrorReportsCollection();
  const result = await collection.insertOne(report as any);
  return { ...report, _id: result.insertedId.toString() };
}

// ---- Csatolt képek (screenshot, fotó) ----

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 2_500_000; // egy kép
export const MAX_TOTAL_ATTACHMENT_BYTES = 4_000_000; // összesen (a Vercel kérés-limitje 4,5 MB)

export type AttachmentMime = "image/png" | "image/jpeg" | "image/webp" | "image/gif";

/** A fájl valódi típusa a tartalmából (nem a megadott kiterjesztésből / MIME-ból). Csak képet fogadunk el. */
export function detectImageMime(buf: Buffer): AttachmentMime | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export interface PreparedAttachment {
  name: string;
  mime: AttachmentMime;
  buffer: Buffer;
}

function safeFileName(name: string, mime: AttachmentMime, index: number): string {
  const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" }[mime];
  const base = name.replace(/\.[^.]*$/, "").replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 60) || `kep-${index + 1}`;
  return `${base}.${ext}`;
}

export async function prepareAttachments(
  files: Array<{ name: string; buffer: Buffer }>
): Promise<{ ok: true; attachments: PreparedAttachment[] } | { ok: false; error: string }> {
  if (files.length > MAX_ATTACHMENTS) return { ok: false, error: `Legfeljebb ${MAX_ATTACHMENTS} kép csatolható.` };
  let total = 0;
  const attachments: PreparedAttachment[] = [];
  for (let i = 0; i < files.length; i++) {
    const { name, buffer } = files[i];
    if (buffer.length > MAX_ATTACHMENT_BYTES) return { ok: false, error: `A(z) „${name}" kép túl nagy (legfeljebb 2,5 MB).` };
    const mime = detectImageMime(buffer);
    if (!mime) return { ok: false, error: `A(z) „${name}" nem támogatott képformátum (PNG, JPG, WEBP vagy GIF lehet).` };
    total += buffer.length;
    attachments.push({ name: safeFileName(name, mime, i), mime, buffer });
  }
  if (total > MAX_TOTAL_ATTACHMENT_BYTES) return { ok: false, error: "A csatolt képek együttes mérete túl nagy (legfeljebb 4 MB)." };
  return { ok: true, attachments };
}

export async function saveErrorReportFiles(
  reportId: string,
  reporterEmail: string,
  attachments: PreparedAttachment[]
): Promise<ErrorReportAttachment[]> {
  if (attachments.length === 0) return [];
  const db = await getMongoDb();
  const files = db.collection(FILES_COLLECTION_NAME);
  await files.createIndex({ reportId: 1 });
  const saved: ErrorReportAttachment[] = [];
  for (const attachment of attachments) {
    const result = await files.insertOne({
      reportId,
      reporterEmail,
      name: attachment.name,
      mime: attachment.mime,
      size: attachment.buffer.length,
      data: new Binary(attachment.buffer),
      createdAt: Date.now(),
    });
    saved.push({ id: result.insertedId.toString(), name: attachment.name, mime: attachment.mime, size: attachment.buffer.length });
  }
  const reports = await getErrorReportsCollection();
  await reports.updateOne({ _id: new ObjectId(reportId) } as never, { $set: { attachments: saved } });
  return saved;
}

export async function getErrorReportFile(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getMongoDb();
  const doc = await db.collection(FILES_COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return {
    reporterEmail: String(doc.reporterEmail || ""),
    name: String(doc.name || "kep"),
    mime: String(doc.mime || "application/octet-stream"),
    data: Buffer.from((doc.data as Binary).buffer),
  };
}

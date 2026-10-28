import { getMongoDb } from "./mongodb";

const APP_NAME = "dispatcher";
const MAX_HTML = 150000;
const MAX_TEXT = 20000;

type Addr = string | string[] | undefined;

export interface EmailLogInput {
  to: Addr;
  cc?: Addr;
  bcc?: Addr;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  kind?: string;
  status: "sent" | "failed";
  error?: string;
  messageId?: string;
}

function splitAddresses(value: Addr): string[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .flatMap((v) => String(v).split(","))
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

/** One-time secrets must never be stored: token query/hash values and /track/<token> path tokens. */
export function redactSecrets(input: string): string {
  return input
    .replace(/([?&#]token=)[^&#"'\s<>)]+/gi, "$1[redacted]")
    .replace(/(\/track\/)[A-Za-z0-9_\-.~%]+/gi, "$1[redacted]");
}

function inferKind(subject: string): string | undefined {
  const s = subject.toLowerCase();
  if (s.includes("hibabejelentés")) return "error-report";
  if (s.includes("ár jóváhagy") || s.includes("ár elutasít")) return "price-approval";
  if (s.includes("új fuvar")) return "driver-assignment";
  if (s.includes("visszajelzés") || s.includes("feedback")) return "feedback";
  if (s.includes("foglalás") || s.includes("booking")) return "booking-update";
  return undefined;
}

/** Fire-and-forget; never throws and never blocks the caller. */
export function logEmail(input: EmailLogInput): void {
  void (async () => {
    try {
      const db = await getMongoDb();
      const doc: Record<string, unknown> = {
        sentAt: Date.now(),
        app: APP_NAME,
        to: splitAddresses(input.to),
        subject: input.subject,
        status: input.status,
      };
      const cc = [...splitAddresses(input.cc), ...splitAddresses(input.bcc)];
      if (cc.length) doc.cc = cc;
      if (input.from) doc.from = input.from;
      const kind = input.kind || inferKind(input.subject);
      if (kind) doc.kind = kind;
      if (input.error) doc.error = input.error.slice(0, 500);
      if (input.messageId) doc.messageId = input.messageId;
      if (input.html) doc.html = redactSecrets(input.html).slice(0, MAX_HTML);
      if (input.text) doc.text = redactSecrets(input.text).slice(0, MAX_TEXT);
      await db.collection("email_logs").insertOne(doc);
    } catch {
      // logging must never affect sending
    }
  })();
}

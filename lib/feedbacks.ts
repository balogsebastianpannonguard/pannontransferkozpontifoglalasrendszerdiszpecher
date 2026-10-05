import { randomBytes } from "crypto";
import { getMongoDb } from "./mongodb";

export type ConcernArea = "booking" | "notifications" | "driver" | "vehicle" | "other";
export type BookingEase = "very_easy" | "easy" | "neutral" | "difficult" | "very_difficult";

/** A partnerportál kérdőívén leadott visszajelzés (feedbacks gyűjtemény). */
export interface FeedbackItem {
  id: string;
  bookingId: string;
  bookingCode: string;
  companyName?: string;
  respondentName: string;
  respondentEmail: string;
  language: "hu" | "en";
  pickupDate?: string;
  pickupTime?: string;
  fromAddress?: string;
  toAddress?: string;
  driverName?: string;
  vehicleName?: string;
  satisfied: boolean;
  concerns: ConcernArea[];
  concernOther?: string;
  experience?: string;
  notificationReceived: boolean;
  bookingEase: BookingEase;
  difficulties?: string;
  createdAt: number;
  /** Admin által indított próba: nem számít a statisztikába. */
  test?: boolean;
}

const COLLECTION = "feedbacks";
const REQUESTS_COLLECTION = "feedback_requests";
const DEFAULT_PORTAL_URL = "https://pannontransferkomplexxpartnerceg.vercel.app";

export async function listFeedbacks(limit = 500): Promise<FeedbackItem[]> {
  const db = await getMongoDb();
  const docs = await db.collection(COLLECTION).find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map((doc) => ({
    id: String(doc._id),
    bookingId: String(doc.bookingId ?? ""),
    bookingCode: String(doc.bookingCode ?? ""),
    companyName: doc.companyName,
    respondentName: String(doc.respondentName ?? ""),
    respondentEmail: String(doc.respondentEmail ?? ""),
    language: doc.language === "en" ? "en" : "hu",
    pickupDate: doc.pickupDate,
    pickupTime: doc.pickupTime,
    fromAddress: doc.fromAddress,
    toAddress: doc.toAddress,
    driverName: doc.driverName,
    vehicleName: doc.vehicleName,
    satisfied: Boolean(doc.satisfied),
    concerns: Array.isArray(doc.concerns) ? doc.concerns : [],
    concernOther: doc.concernOther,
    experience: doc.experience,
    notificationReceived: Boolean(doc.notificationReceived),
    bookingEase: doc.bookingEase,
    difficulties: doc.difficulties,
    createdAt: Number(doc.createdAt ?? 0),
    test: doc.test === true ? true : undefined,
  }));
}


export function getPartnerPortalBaseUrl(): string {
  return (process.env.PARTNER_PORTAL_URL || process.env.NEXT_PUBLIC_PARTNER_PORTAL_URL || DEFAULT_PORTAL_URL).replace(/\/$/, "");
}

export interface TestFeedbackRequest {
  token: string;
  url: string;
  bookingCode: string;
  travelerName: string;
}

/**
 * Próba visszajelzési kérés (NI): a valódi kérdőívre vezet, de "test" jelölésű. A kitöltés összefoglalója
 * kizárólag a megadott címre megy (nem a Location Supportnak), és a próba nem számít a statisztikába.
 */
export async function createTestFeedbackRequest(params: {
  recipient: string;
  travelerName: string;
  language: "hu" | "en";
}): Promise<TestFeedbackRequest> {
  const db = await getMongoDb();
  const token = randomBytes(24).toString("hex");
  const bookingCode = `TEST-${randomBytes(2).toString("hex").toUpperCase()}`;
  const now = new Date();
  const pickupDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  await db.collection(REQUESTS_COLLECTION).insertOne({
    token,
    bookingId: "",
    bookingCode,
    portal: "ni",
    companyName: "National Instruments",
    travelerName: params.travelerName,
    email: params.recipient,
    language: params.language,
    pickupDate,
    pickupTime: "08:30",
    fromAddress: "Budapest Liszt Ferenc Nemzetközi Repülőtér (BUD)",
    toAddress: "Debrecen, NI Hungary Kft.",
    driverName: "Teszt Sofőr",
    vehicleName: "Mercedes V-Klass",
    createdAt: Date.now(),
    test: true,
    testRecipient: params.recipient,
  });

  return { token, url: `${getPartnerPortalBaseUrl()}/feedback/${token}`, bookingCode, travelerName: params.travelerName };
}

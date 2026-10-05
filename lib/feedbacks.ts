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
}

const COLLECTION = "feedbacks";

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
  }));
}

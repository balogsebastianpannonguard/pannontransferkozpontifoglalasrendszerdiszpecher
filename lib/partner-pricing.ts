import { getCollection } from "./db";
import type { ObjectId } from "mongodb";

export interface PricingVehicle {
  id: string;
  name: string;
  capacity: string;
  bpBudAirport: number;
  dbDbAirport: number | null;
  newPrice2026: number;
  modification12to24h: number;
  modification0to12h: number;
  cancellation12to24h: number;
  cancellation0to12h: number;
  extraWaitingPerHour: number;
  dailyRate: number;
}

export interface PricingTerms {
  modification: {
    "12-24h": { percentage: number; description: string };
    "0-12h": { percentage: number; description: string };
  };
  cancellation: {
    "12-24h": { percentage: number; description: string };
    "0-12h": { percentage: number; description: string };
  };
}

export interface PartnerPricing {
  _id?: ObjectId;
  partnerKey: string;
  partnerName: string;
  isActive: boolean;
  vehicles: PricingVehicle[];
  terms: PricingTerms;
  meta?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

const COLLECTION_NAME = "partner_pricing";

export const DEFAULT_CATL_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "catl",
  partnerName: "CATL Hungary Kft.",
  isActive: true,
  vehicles: [
    {
      id: "skoda",
      name: "Skoda",
      capacity: "1-3 passenger",
      bpBudAirport: 60808,
      dbDbAirport: 18400,
      newPrice2026: 82550,
      modification12to24h: 102157,
      modification0to12h: 122589,
      cancellation12to24h: 34052,
      cancellation0to12h: 54484,
      extraWaitingPerHour: 7000,
      dailyRate: 65000,
    },
    {
      id: "opel_ford",
      name: "Opel/Ford",
      capacity: "3-8 passenger",
      bpBudAirport: 94107,
      dbDbAirport: 25300,
      newPrice2026: 95250,
      modification12to24h: 158100,
      modification0to12h: 189720,
      cancellation12to24h: 52700,
      cancellation0to12h: 84320,
      extraWaitingPerHour: 10000,
      dailyRate: 80000,
    },
    {
      id: "v_class",
      name: "V class",
      capacity: "3-7 passenger",
      bpBudAirport: 137541,
      dbDbAirport: null,
      newPrice2026: 154046,
      modification12to24h: 154046,
      modification0to12h: 277283,
      cancellation12to24h: 77023,
      cancellation0to12h: 123237,
      extraWaitingPerHour: 15000,
      dailyRate: 120000,
    },
    {
      id: "s_class",
      name: "S class",
      capacity: "1-3 passenger",
      bpBudAirport: 166497,
      dbDbAirport: null,
      newPrice2026: 186477,
      modification12to24h: 186477,
      modification0to12h: 335658,
      cancellation12to24h: 93238,
      cancellation0to12h: 149181,
      extraWaitingPerHour: 25000,
      dailyRate: 150000,
    },
    {
      id: "man_bus",
      name: "MAN busz",
      capacity: "Large group",
      bpBudAirport: 173736,
      dbDbAirport: 40250,
      newPrice2026: 194584,
      modification12to24h: 194584,
      modification0to12h: 350252,
      cancellation12to24h: 97292,
      cancellation0to12h: 155667,
      extraWaitingPerHour: 20000,
      dailyRate: 145000,
    },
  ],
  terms: {
    modification: {
      "12-24h": { percentage: 150, description: "150% felár" },
      "0-12h": { percentage: 180, description: "180% felár" },
    },
    cancellation: {
      "12-24h": { percentage: 50, description: "50% kötbér" },
      "0-12h": { percentage: 80, description: "80% kötbér" },
    },
  },
};

export async function getPricingCollection() {
  return getCollection<PartnerPricing>(COLLECTION_NAME);
}

export async function initPricingIndexes() {
  const collection = await getPricingCollection();
  try {
    await collection.createIndex({ partnerKey: 1 }, { unique: true });
  } catch {
    // ignore
  }
}

export async function getAllPartnerPricing(): Promise<PartnerPricing[]> {
  const collection = await getPricingCollection();
  await initPricingIndexes();
  const docs = await collection.find({}).sort({ updatedAt: -1 }).toArray();
  return docs.map((d: any) => d as unknown as PartnerPricing);
}

export async function getPartnerPricingByKey(
  partnerKey: string,
  { seedIfMissing = true }: { seedIfMissing?: boolean } = {}
): Promise<PartnerPricing | null> {
  const collection = await getPricingCollection();
  await initPricingIndexes();
  const existing = (await collection.findOne({ partnerKey })) as PartnerPricing | null;
  if (existing) return existing;

  if (seedIfMissing && partnerKey === "catl") {
    const now = Date.now();
    const seed: PartnerPricing = {
      ...DEFAULT_CATL_PRICING,
      createdAt: now,
      updatedAt: now,
    };
    const res = await collection.insertOne(seed as any);
    const created = (await collection.findOne({ _id: res.insertedId })) as PartnerPricing | null;
    return created;
  }

  return null;
}

export async function createPartnerPricing(
  data: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt">
): Promise<PartnerPricing> {
  const collection = await getPricingCollection();
  await initPricingIndexes();
  const now = Date.now();
  const doc: PartnerPricing = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const res = await collection.insertOne(doc as any);
  const created = (await collection.findOne({ _id: res.insertedId })) as PartnerPricing | null;
  if (!created) throw new Error("Nem sikerült létrehozni a pricing rekordot.");
  return created;
}

export async function updatePartnerPricing(
  partnerKey: string,
  patch: Partial<Omit<PartnerPricing, "_id" | "createdAt" | "partnerKey">>
): Promise<PartnerPricing | null> {
  const collection = await getPricingCollection();
  await initPricingIndexes();
  const existing = (await collection.findOne({ partnerKey })) as PartnerPricing | null;
  if (!existing) {
    const now = Date.now();
    if (partnerKey === "catl") {
      const seed: PartnerPricing = {
        ...DEFAULT_CATL_PRICING,
        ...patch,
        partnerKey,
        createdAt: now,
        updatedAt: now,
      };
      const res = await collection.insertOne(seed as any);
      return (await collection.findOne({ _id: res.insertedId })) as PartnerPricing | null;
    }
    return null;
  }
  await collection.updateOne(
    { partnerKey },
    {
      $set: {
        ...patch,
        updatedAt: Date.now(),
      },
    }
  );
  return (await collection.findOne({ partnerKey })) as PartnerPricing | null;
}

export async function deletePartnerPricing(partnerKey: string): Promise<boolean> {
  const collection = await getPricingCollection();
  const res = await collection.deleteOne({ partnerKey });
  return res.deletedCount > 0;
}

export function pricingToLegacyFormat(pricing: PartnerPricing) {
  const pricingMap: Record<string, PricingVehicle> = {};
  for (const v of pricing.vehicles) pricingMap[v.id] = v;
  const prices = pricing.vehicles.map((v) => v.newPrice2026);
  return {
    pricing: pricingMap,
    terms: pricing.terms,
    count: pricing.vehicles.length,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
}

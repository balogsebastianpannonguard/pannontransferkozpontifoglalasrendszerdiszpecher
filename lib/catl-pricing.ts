export interface CatlVehiclePricing {
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

export interface PricingVehicle extends CatlVehiclePricing {}

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
  _id?: unknown;
  partnerKey: string;
  partnerName: string;
  isActive: boolean;
  vehicles: PricingVehicle[];
  terms: PricingTerms;
  meta?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
}

export const CATL_PRICING: Record<string, PricingVehicle> = {
  skoda: {
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
  opel_ford: {
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
  v_class: {
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
  s_class: {
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
  man_bus: {
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
};

export const CATL_TERMS: PricingTerms = {
  modification: {
    "12-24h": { percentage: 150, description: "150% felár" },
    "0-12h": { percentage: 180, description: "180% felár" },
  },
  cancellation: {
    "12-24h": { percentage: 50, description: "50% kötbér" },
    "0-12h": { percentage: 80, description: "80% kötbér" },
  },
};

export const CATL_VEHICLE_COUNT = 5;
export const CATL_MIN_PRICE = 82550;
export const CATL_MAX_PRICE = 194584;

export function formatHuf(amount: number): string {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(amount);
}

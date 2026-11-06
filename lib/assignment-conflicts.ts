/**
 * Sofőr/jármű ütközésvizsgálat kiosztáskor: csak az az út foglalja az erőforrást, amelyik IDŐBEN átfedi a kiosztandót.
 * Egy út becsült időtartama: városi/reptéri ~2,5 óra, vidéki (pl. Budapest–Debrecen, oda-vissza) ~7 óra.
 * (Korábban minden le nem zárt kiosztott út – akár napokkal későbbi is – tiltotta a kiosztást.)
 */

const HOUR = 60 * 60 * 1000;
export const SHORT_TRIP_MS = 2.5 * HOUR;
export const LONG_TRIP_MS = 7 * HOUR;

export interface TripLike {
  _id?: unknown;
  bookingCode?: string;
  pickupDate?: string;
  pickupTime?: string;
  fromAddress?: string;
  toAddress?: string;
  category?: string;
  status?: string;
}

/** A felvétel időpontja (helyi idő szerint) ms-ban; null, ha a dátum hiányzik vagy hibás. Hiányzó időnél a nap eleje. */
export function tripStartMs(trip: TripLike): number | null {
  const date = (trip.pickupDate || "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return null;
  const t = /^([01]?\d|2[0-3]):([0-5]\d)/.exec((trip.pickupTime || "").trim());
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), t ? Number(t[1]) : 0, t ? Number(t[2]) : 0);
  return d.getTime();
}

function cityOf(address?: string): "budapest" | "other" | "unknown" {
  const a = (address || "").toLowerCase();
  if (!a.trim()) return "unknown";
  if (/budapest|liszt ferenc|ferihegy|\bbud\b|repülőtér|airport/.test(a)) return "budapest";
  if (/debrecen|miskolc|győr|gyor|szeged|pécs|pecs|nyíregyháza|nyiregyhaza|kecskemét|kecskemet|székesfehérvár|szekesfehervar|bécs|wien|vienna|pozsony|bratislava|nyíregyh/.test(a)) return "other";
  return "unknown";
}

export function tripDurationMs(trip: TripLike): number {
  if (trip.category === "long-distance") return LONG_TRIP_MS;
  const from = cityOf(trip.fromAddress);
  const to = cityOf(trip.toAddress);
  if ((from === "budapest" && to === "other") || (from === "other" && to === "budapest") || (from === "other" && to === "other")) {
    return LONG_TRIP_MS;
  }
  return SHORT_TRIP_MS;
}

/** Átfedi-e a két út egymást időben. Ha bármelyik időpontja ismeretlen, óvatosan ütközésnek vesszük. */
export function tripsOverlap(a: TripLike, b: TripLike): boolean {
  const sa = tripStartMs(a);
  const sb = tripStartMs(b);
  if (sa === null || sb === null) return true;
  const ea = sa + tripDurationMs(a);
  const eb = sb + tripDurationMs(b);
  return sa < eb && sb < ea;
}

/** A felvétel ennyin belül van-e a mostani időponttól (pl. hogy az "úton van" állapot számít-e). */
export function startsWithin(trip: TripLike, ms: number, now = Date.now()): boolean {
  const s = tripStartMs(trip);
  if (s === null) return true;
  return s - now < ms;
}

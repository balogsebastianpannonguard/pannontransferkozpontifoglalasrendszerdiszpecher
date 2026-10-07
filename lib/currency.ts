/** A diszpécser által kézzel beírható ár pénzneme. Alapértelmezett: HUF. */
export type Currency = "HUF" | "EUR" | "GBP" | "USD";

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: "HUF", label: "HUF — Forint", symbol: "Ft" },
  { value: "EUR", label: "EUR — Euró", symbol: "€" },
  { value: "GBP", label: "GBP — Font", symbol: "£" },
  { value: "USD", label: "USD — Dollár", symbol: "$" },
];

const SYMBOL: Record<Currency, string> = { HUF: "Ft", EUR: "€", GBP: "£", USD: "$" };
const LOCALE: Record<Currency, string> = { HUF: "hu-HU", EUR: "hu-HU", GBP: "en-GB", USD: "en-US" };
// Elöl áll-e a pénznemjel (pl. "$1 250") vagy hátul (pl. "1 250 Ft")
const PREFIXED: Record<Currency, boolean> = { HUF: false, EUR: false, GBP: true, USD: true };

export function normalizeCurrency(value: unknown): Currency {
  return value === "EUR" || value === "GBP" || value === "USD" ? value : "HUF";
}

export function currencySymbol(currency?: string | null): string {
  return SYMBOL[normalizeCurrency(currency)];
}

/** Pl. formatPrice(25000, "HUF") -> "25 000 Ft", formatPrice(1250, "USD") -> "$1,250" */
export function formatPrice(amount: number | undefined | null, currency?: string | null): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return "";
  const cur = normalizeCurrency(currency);
  const formatted = Math.round(amount).toLocaleString(LOCALE[cur]);
  return PREFIXED[cur] ? `${SYMBOL[cur]}${formatted}` : `${formatted} ${SYMBOL[cur]}`;
}

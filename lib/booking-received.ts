/**
 * A diszpécser felületen rögzített foglalásról is kimegy a "megkaptuk az utat" levél az utasnak:
 * a cég arculatú, a foglalás nyelvén írt sablonok a partnercegek alkalmazásban vannak, ezért azt hívjuk meg.
 * Hiba esetén csak naplóz - a foglalást sosem buktatja meg.
 */
export async function sendBookingReceivedEmail(bookingId: string | undefined): Promise<void> {
  const base = (process.env.PARTNER_APP_URL || "https://pannontransferkomplexxpartnerceg.vercel.app").replace(/\/$/, "");
  const secret = process.env.INTERNAL_API_SECRET;
  if (!bookingId || !secret) {
    console.warn("[booking-received] kihagyva: hiányzó bookingId vagy INTERNAL_API_SECRET");
    return;
  }
  try {
    const res = await fetch(`${base}/api/internal/booking-received`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-secret": secret },
      body: JSON.stringify({ bookingId }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) console.error("[booking-received] sikertelen:", res.status, await res.text().catch(() => ""));
  } catch (err) {
    console.error("[booking-received] hívás hiba", err);
  }
}

/**
 * Builds the public passenger status-tracking URL (served by the pannontransferpartnercegek app)
 * for a booking, if a bookingTrackToken exists. The partner-portal app is a separate deployment,
 * so its public base URL must be configured via the PARTNER_PORTAL_URL (or
 * NEXT_PUBLIC_PARTNER_PORTAL_URL) environment variable. Returns undefined if not configured or
 * no token is provided, so callers can simply omit the tracking link when unavailable.
 */
export function buildTrackUrl(bookingTrackToken?: string | null): string | undefined {
  if (!bookingTrackToken) return undefined;
  const base =
    process.env.PARTNER_PORTAL_URL ||
    process.env.NEXT_PUBLIC_PARTNER_PORTAL_URL ||
    "";
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/track/${bookingTrackToken}`;
}

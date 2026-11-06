import { resolvePartnerMeta } from "@/lib/partner-meta";

/**
 * NI (National Instruments / Emerson) foglalásoknál az utason kívül mindig értesítést kap:
 *  - az admin (a foglaláson megadott admin e-mail, ennek hiányában a foglaló),
 *  - a Location Support (LOCATION_SUPPORT_EMAIL),
 *  - az NI felügyelő(k) (NI_SUPERVISOR_EMAILS, alapból Zsuzsi) – bárki bármit csinál a foglalással.
 * Ugyanezek a címek vannak a partnerportál lib/ni-notifications.ts fájljában is.
 */
export const LOCATION_SUPPORT_EMAIL =
  process.env.LOCATION_SUPPORT_EMAIL?.trim() || "locationsupport.request@emerson.com";

export const NI_SUPERVISOR_EMAILS: string[] = (
  process.env.NI_SUPERVISOR_EMAILS?.trim() || "zsuzsa.kukucska@emerson.com"
)
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isNiBooking(booking: {
  portal?: string | null;
  companyName?: string | null;
  travelerEmail?: string | null;
  userEmail?: string | null;
}): boolean {
  return resolvePartnerMeta(booking)?.id === "ni";
}

/** Az utason kívüli NI címzettek (második utas, admin, Location Support, felügyelő), ismétlés nélkül; az első utas címe kimarad, ő a saját levelét kapja. */
export function niCopyRecipients(booking: {
  travelerEmail?: string | null;
  secondTravelerEmail?: string | null;
  adminEmail?: string | null;
  userEmail?: string | null;
}): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (email?: string | null) => {
    if (!email || !EMAIL_PATTERN.test(email.trim())) return;
    const key = email.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(email.trim());
  };
  add(booking.travelerEmail);
  add(booking.secondTravelerEmail);
  add(booking.adminEmail || booking.userEmail);
  add(LOCATION_SUPPORT_EMAIL);
  for (const supervisor of NI_SUPERVISOR_EMAILS) add(supervisor);
  const travelerKey = booking.travelerEmail?.trim().toLowerCase();
  return out.filter((e) => e.toLowerCase() !== travelerKey);
}

/**
 * További utasok egy foglaláson (a fő utason kívül) – a partnerportál tölti ki (NI).
 * A fő utas az 1., a további utasok számozása 2-től indul.
 */
export interface AdditionalPassenger {
  name: string;
  email?: string;
  phone?: string;
  /** Eltérő felvételi hely (üres = a foglalás fő felvételi címe). */
  pickupAddress?: string;
}

/** Az adatbázisból érkező értéket biztonságosan listává alakítja (hibás elemeket eldobja). */
export function readAdditionalPassengers(value: unknown): AdditionalPassenger[] {
  if (!Array.isArray(value)) return [];
  const out: AdditionalPassenger[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const src = item as Record<string, unknown>;
    const name = typeof src.name === "string" ? src.name.trim() : "";
    if (!name) continue;
    const email = typeof src.email === "string" ? src.email.trim() : "";
    const phone = typeof src.phone === "string" ? src.phone.trim() : "";
    const pickupAddress = typeof src.pickupAddress === "string" ? src.pickupAddress.trim() : "";
    out.push({
      name,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(pickupAddress ? { pickupAddress } : {}),
    });
  }
  return out;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A további utasok blokkja a levelekhez. Ha nincs további utas, üres szöveg – így az e-mail
 * pontosan a régi marad.
 */
export function buildAdditionalPassengersHtml(passengers: unknown, en = false): string {
  const list = readAdditionalPassengers(passengers);
  if (list.length === 0) return "";
  const rows = list
    .map((p, i) => {
      const contact = [p.email ? esc(p.email) : "", p.phone ? esc(p.phone) : ""].filter(Boolean).join(" · ");
      return `<div style="padding:8px 0;${i > 0 ? "border-top:1px solid #E2E8F0;" : ""}"><div style="font-size:14px;font-weight:700;color:#0B1A2A;">${i + 2}. ${esc(p.name)}</div>${
        contact ? `<div style="font-size:12px;color:#475569;margin-top:2px;">${contact}</div>` : ""
      }${
        p.pickupAddress
          ? `<div style="font-size:12px;color:#0B1A2A;margin-top:2px;"><strong>${en ? "Pick-up point" : "Felvételi hely"}:</strong> ${esc(p.pickupAddress)}</div>`
          : ""
      }</div>`;
    })
    .join("");
  return `<div style="margin-top:18px;padding:14px 16px;border-radius:10px;background-color:#FFFFFF;border:1px solid #E2E8F0;font-family:Arial,Helvetica,sans-serif;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#64748B;margin-bottom:4px;">${en ? "Additional passengers" : "További utasok"}</div>${rows}</div>`;
}

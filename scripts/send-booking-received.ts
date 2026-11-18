/**
 * "Megkaptuk az utat" levél kiküldése egy foglalás utasának.
 * Használat:  node --env-file=.env.local --import tsx scripts/send-booking-received.ts <FOGLALÁSKÓD> [--send] [--to cím]
 * --send nélkül csak előnézetet ír (scripts/preview-received.html), nem küld semmit.
 */
import { writeFileSync } from "node:fs";
import { getBookingByCode } from "../lib/bookings";
import { buildBookingReceivedEmail } from "../lib/email-templates";
import { sendEmail } from "../lib/nodemailer";

async function main() {
  const args = process.argv.slice(2);
  const code = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--to");
  const toIdx = args.indexOf("--to");
  const toOverride = toIdx >= 0 ? args[toIdx + 1] : undefined;
  const send = args.includes("--send");
  if (!code) throw new Error("Hiányzó foglaláskód");

  const b = await getBookingByCode(code.replace(/^#/, ""));
  if (!b) throw new Error(`Nincs ilyen foglalás: ${code}`);

  const lang = b.language === "en" ? "en" : "hu";
  const html = buildBookingReceivedEmail({
    bookingCode: b.bookingCode,
    travelerName: b.travelerName,
    pickupDate: b.pickupDate,
    pickupTime: b.pickupTime,
    fromAddress: b.fromAddress,
    toAddress: b.toAddress,
    flightNumber: b.flightNumber,
    travelers: b.travelers,
    luggage: b.luggage,
    companyName: b.companyName,
    language: lang,
  });
  const to = toOverride || b.travelerEmail;
  const subject =
    lang === "en"
      ? `We have received your trip · #${b.bookingCode} · Pannon Transfer`
      : `Megkaptuk az utat · #${b.bookingCode} · Pannon Transfer`;

  console.log({ code: b.bookingCode, to, lang, subject, send });
  if (!send) {
    writeFileSync("scripts/preview-received.html", html);
    console.log("Előnézet: scripts/preview-received.html (nem ment ki e-mail)");
  } else {
    const r = await sendEmail({ to, subject, html, kind: "booking-received" });
    console.log(r);
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

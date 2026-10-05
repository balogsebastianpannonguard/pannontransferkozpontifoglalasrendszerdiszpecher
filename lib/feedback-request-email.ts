// A lezárt NI fuvar után az utasoknak küldött "Az utazása befejeződött + visszajelzés" levél.
// Ugyanez a sablon van a sofőr-alkalmazásban (lib/trip-completion.ts); innen a próba-levélhez használjuk.
type TripLanguage = "hu" | "en";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Befejezés + visszajelzési link, a megadott nyelven (hu/en). */
export function buildNiFeedbackRequestHtml(params: {
  travelerName: string;
  bookingCode: string;
  feedbackUrl: string;
  language: TripLanguage;
}): string {
  const en = params.language === "en";
  const t = en
    ? {
        title: "Your trip is complete",
        greeting: params.travelerName.trim() ? `Dear ${params.travelerName},` : "Dear Passenger,",
        body: "Your transfer has been completed successfully. Thank you for choosing Pannon Transfer!",
        ask: "Your feedback will greatly help with the development of our service. It takes only a minute.",
        button: "Share your feedback",
        code: "BOOKING CODE",
        fallback: "If the button does not work, copy this link into your browser:",
        contact: "If you have any questions, please contact our customer service.",
        phone: "Phone",
      }
    : {
        title: "Az utazása befejeződött",
        greeting: params.travelerName.trim() ? `Kedves ${params.travelerName}!` : "Kedves Utasunk!",
        body: "Az utazása sikeresen befejeződött. Köszönjük, hogy a Pannon Transfert választotta!",
        ask: "Visszajelzése nagyban segíti szolgáltatásunk fejlesztését. Kitöltése csupán egy percet vesz igénybe.",
        button: "Visszajelzés megadása",
        code: "FOGLALÁS KÓD",
        fallback: "Ha a gomb nem működik, másolja be ezt a linket a böngészőjébe:",
        contact: "Ha kérdése van, forduljon ügyfélszolgálatunkhoz.",
        phone: "Telefon",
      };

  return `<!DOCTYPE html><html lang="${en ? "en" : "hu"}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAF8F5;padding:40px 16px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">
<tr><td style="background:#0B1A2A;border-radius:12px 12px 0 0;padding:32px 40px;">
<p style="margin:0;font-size:12px;font-weight:700;color:#C9A962;letter-spacing:4px;text-transform:uppercase;">PANNON TRANSFER</p>
</td></tr>
<tr><td style="height:3px;background:#C9A962;"></td></tr>
<tr><td style="background:#fff;border-left:1px solid #E8E3DA;border-right:1px solid #E8E3DA;padding:36px 40px;">
<p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">${t.title}</p>
<p style="margin:0 0 6px;font-size:14px;color:#1A1A1A;line-height:1.6;font-weight:600;">${esc(t.greeting)}</p>
<p style="margin:0 0 16px;font-size:14px;color:#7A7A7A;line-height:1.6;">${t.body}</p>
<p style="margin:0 0 24px;font-size:14px;color:#7A7A7A;line-height:1.6;">${t.ask}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAF6EE;border:1px solid #E6D9B8;border-radius:8px;margin-bottom:28px;">
<tr><td style="padding:20px 24px;">
<p style="margin:0 0 4px;font-size:10px;font-weight:600;color:#C9A962;letter-spacing:2px;text-transform:uppercase;">${t.code}</p>
<p style="margin:0;font-size:18px;font-weight:700;color:#1A1A1A;">#${esc(params.bookingCode)}</p>
</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;"><tr><td align="center">
<a href="${params.feedbackUrl}" style="display:inline-block;background:#0B1A2A;color:#C9A962;text-decoration:none;font-size:15px;font-weight:700;padding:16px 36px;border-radius:10px;border:1px solid #C9A962;">${t.button}</a>
</td></tr></table>
<p style="margin:0 0 6px;font-size:12px;color:#9A9A9A;line-height:1.6;">${t.fallback}</p>
<p style="margin:0 0 24px;font-size:12px;word-break:break-all;"><a href="${params.feedbackUrl}" style="color:#C9A962;">${params.feedbackUrl}</a></p>
<p style="margin:0;font-size:13px;color:#7A7A7A;line-height:1.7;">${t.contact}<br>E-mail: <a href="mailto:balogh.sebastian@pannonguard.hu" style="color:#C9A962;">balogh.sebastian@pannonguard.hu</a><br>${t.phone}: +36 30 665 4135</p>
</td></tr>
<tr><td style="height:1px;background:#C9A962;"></td></tr>
<tr><td style="background:#0B1A2A;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
<p style="margin:0;font-size:10px;color:#7A7A7A;">&copy; 2026 Pannon Transfer Executive Travel</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

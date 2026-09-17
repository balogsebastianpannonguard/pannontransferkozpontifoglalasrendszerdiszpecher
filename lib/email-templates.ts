export function buildCustomerConfirmationEmail(params: {
  bookingCode: string;
  travelerName: string;
  pickupDate: string;
  pickupTime: string;
  fromAddress: string;
  toAddress: string;
  travelers: number;
  luggage: number;
  transferType: 'standard' | 'executive';
  paymentMethod: 'card' | 'bank';
  comment?: string;
  price?: number;
}): string {
  const {
    bookingCode,
    travelerName,
    pickupDate,
    pickupTime,
    fromAddress,
    toAddress,
    travelers,
    luggage,
    transferType,
    paymentMethod,
    comment,
    price,
  } = params;

  const transferTypeLabel = transferType === 'executive' ? 'EXECUTIVE' : 'STANDARD';
  const transferTypeBg = transferType === 'executive' ? '#FAF6EE' : '#F0ECE6';
  const transferTypeBorder = transferType === 'executive' ? '#E6D9B8' : '#E8E3DA';
  const transferTypeColor = transferType === 'executive' ? '#C9A962' : '#4A4A4A';
  const paymentMethodLabel = paymentMethod === 'card' ? 'Bankkártya' : 'Banki átutalás';
  const priceDisplay = price !== undefined ? `${price.toLocaleString('hu-HU')} Ft` : 'Egyeztetés alatt';

  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Foglalás visszaigazolása · #${bookingCode} · Pannon Transfer</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:Arial,Helvetica,sans-serif;min-width:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FAF8F5;padding:48px 16px;">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">
<tr>
<td style="background-color:#0B1A2A;border:1px solid #0B1A2A;border-radius:12px 12px 0 0;padding:0;height:80px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="height:80px;">
<tr>
<td align="center" valign="middle" style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:36px;height:36px;border:4px solid #C9A962;border-radius:4px;">
<tr>
<td align="center" valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#C9A962;">P</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#C9A962;letter-spacing:4px;text-transform:uppercase;padding-top:6px;">PANNON TRANSFER</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:500;color:#7A7A7A;letter-spacing:6px;text-transform:uppercase;padding-top:3px;">EXECUTIVE TRAVEL</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="height:1px;background-color:#C9A962;font-size:0;line-height:0;"></td>
</tr>
<tr>
<td style="background-color:#FFFFFF;border-left:1px solid #E8E3DA;border-right:1px solid #E8E3DA;padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding-left:48px;padding-right:48px;">
<tr>
<td style="padding-top:32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:#1A1A1A;line-height:1.3;">Foglalás visszaigazolása</td>
</tr>
<tr>
<td style="padding-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#7A7A7A;line-height:1.6;">Kedves ${travelerName}! Köszönjük, hogy a Pannon Transfert választotta.</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAF6EE;border:1px solid #E6D9B8;border-radius:999px;padding:10px 24px;">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#C9A962;letter-spacing:2px;text-transform:uppercase;padding-right:12px;">FOGLALÁS KÓD</td>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#1A1A1A;">#${bookingCode}</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F7F4;border:1px solid #D9E2D9;border-radius:999px;padding:8px 20px;">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;color:#3A523A;letter-spacing:1.5px;text-transform:uppercase;">FOGADVA · jóváhagyásra vár</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FFFFFF;border:1px solid #E8E3DA;border-radius:8px;">
<tr>
<td style="padding:32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;color:#C9A962;letter-spacing:2px;text-transform:uppercase;padding-bottom:24px;">UTAZÁS RÉSZLETEI</td>
</tr>
<tr>
<td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td width="50%" valign="top" style="padding-right:24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:6px;">📅 DÁTUM</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#1A1A1A;padding-bottom:18px;">${pickupDate}</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:6px;">🕒 IDŐPONT</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:#C9A962;">${pickupTime}</td>
</tr>
</table>
</td>
<td width="50%" valign="top" style="padding-left:24px;border-left:1px solid #F0ECE6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding-left:24px;">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:6px;">Indulás</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#1A1A1A;line-height:1.5;padding-bottom:12px;">✦ ${fromAddress}</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#C9A962;padding-bottom:12px;">&nbsp;&nbsp;·</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:6px;">Érkezés</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#1A1A1A;line-height:1.5;">${toAddress}</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="padding-bottom:12px;border-bottom:1px solid #F0ECE6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td width="50%" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;">Utasok száma</td>
<td width="50%" align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#C9A962;">${travelers} fő</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:12px;padding-bottom:12px;border-bottom:1px solid #F0ECE6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td width="50%" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;">Csomagok száma</td>
<td width="50%" align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#1A1A1A;">${luggage} db</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:12px;padding-bottom:12px;border-bottom:1px solid #F0ECE6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td width="50%" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;vertical-align:middle;">Szolgáltatás szint</td>
<td width="50%" align="right">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;">
<tr>
<td style="background-color:${transferTypeBg};border:1px solid ${transferTypeBorder};border-radius:4px;padding:6px 14px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:${transferTypeColor};letter-spacing:1.5px;text-transform:uppercase;">${transferTypeLabel}</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:12px;padding-bottom:12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td width="50%" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;">Fizetési mód</td>
<td width="50%" align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#1A1A1A;">${paymentMethodLabel}</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
${price !== undefined ? `
<tr>
<td style="padding-top:24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FAF8F5;border:1px solid #E8E3DA;border-radius:8px;">
<tr>
<td style="padding:20px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:6px;">Végösszeg</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#C9A962;">${priceDisplay}</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
` : ''}
${comment ? `
<tr>
<td style="padding-top:24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FAF6EE;border-left:3px solid #C9A962;border-radius:0 8px 8px 0;">
<tr>
<td style="padding:18px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;color:#C9A962;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;">MEGJEGYZÉS</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-style:italic;color:#4A4A4A;line-height:1.6;">${comment}</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
` : ''}
<tr>
<td style="padding-top:32px;padding-bottom:40px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B1A2A;border-radius:4px;">
<tr>
<td align="center" style="padding:0 48px;height:44px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#FFFFFF;letter-spacing:2px;text-transform:uppercase;line-height:44px;">FOGLALÁS RÉSZLETEI</td>
</tr>
<tr>
<td style="height:2px;background-color:#C9A962;font-size:0;line-height:0;"></td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="height:1px;background-color:#C9A962;font-size:0;line-height:0;"></td>
</tr>
<tr>
<td style="background-color:#0B1A2A;border:1px solid #0B1A2A;border-radius:0 0 12px 12px;padding:40px 48px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:24px;height:24px;border:2px solid #C9A962;border-radius:3px;">
<tr>
<td align="center" valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#C9A962;">P</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#C9A962;letter-spacing:3px;text-transform:uppercase;padding-top:12px;">PANNON TRANSFER</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#7A7A7A;line-height:1.6;padding-top:10px;">✉ minimalwebsoft@gmail.com &nbsp;·&nbsp; ☏ +36 30 665 4135</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#7A7A7A;line-height:1.6;padding-top:12px;">© 2026 Pannon Transfer Executive Travel. Minden jog fenntartva.</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export function buildTravelerFinalizedEmail(params: {
  bookingCode: string;
  travelerName: string;
  pickupDate: string;
  pickupTime: string;
  fromAddress: string;
  toAddress: string;
  travelers: number;
  luggage: number;
  transferType: "standard" | "executive";
  paymentMethod: "card" | "bank";
  companyName?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedVehicleName?: string;
  price?: number;
  comment?: string;
}): string {
  const {
    bookingCode,
    travelerName,
    pickupDate,
    pickupTime,
    fromAddress,
    toAddress,
    travelers,
    luggage,
    transferType,
    paymentMethod,
    companyName,
    assignedDriverName,
    assignedDriverPhone,
    assignedVehicleName,
    price,
    comment,
  } = params;

  const transferTypeLabel = transferType === "executive" ? "EXECUTIVE" : "STANDARD";
  const paymentMethodLabel = paymentMethod === "card" ? "Bankkártya" : "Banki átutalás";
  const priceDisplay =
    typeof price === "number" && price > 0
      ? `${price.toLocaleString("hu-HU")} Ft`
      : "Egyeztetés alatt";
  const driverNameDisplay = assignedDriverName || "Kijelölés alatt";
  const driverPhoneDisplay = assignedDriverPhone || "Később kerül kiküldésre";
  const vehicleDisplay = assignedVehicleName || "Később kerül kiküldésre";

  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Utazás véglegesítve · #${bookingCode} · Pannon Transfer</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:Arial,Helvetica,sans-serif;min-width:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FAF8F5;padding:48px 16px;">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">
<tr>
<td style="background-color:#0B1A2A;border:1px solid #0B1A2A;border-radius:12px 12px 0 0;padding:0;height:80px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="height:80px;">
<tr>
<td align="center" valign="middle" style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:36px;height:36px;border:4px solid #C9A962;border-radius:4px;">
<tr>
<td align="center" valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#C9A962;">P</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#C9A962;letter-spacing:4px;text-transform:uppercase;padding-top:6px;">PANNON TRANSFER</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:500;color:#7A7A7A;letter-spacing:6px;text-transform:uppercase;padding-top:3px;">EXECUTIVE TRAVEL</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="height:1px;background-color:#C9A962;font-size:0;line-height:0;"></td>
</tr>
<tr>
<td style="background-color:#FFFFFF;border-left:1px solid #E8E3DA;border-right:1px solid #E8E3DA;padding:32px 48px 0 48px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#C9A962;letter-spacing:4px;text-transform:uppercase;margin-bottom:12px;">Utazás véglegesítve</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:700;color:#1A1A1A;line-height:1.2;">#${bookingCode}</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#7A7A7A;line-height:1.7;margin-top:10px;">
Kedves ${travelerName}! A foglalását véglegesítettük, az alábbi részletekkel várjuk az utazást.
</div>
<div style="margin-top:18px;display:inline-block;background-color:#ECFDF3;border:1px solid #B7E4C7;border-radius:999px;padding:8px 18px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#166534;letter-spacing:1.5px;text-transform:uppercase;">
Megerősítve • minden részlet rögzítve
</div>
</td>
</tr>
<tr>
<td style="background-color:#FFFFFF;border-left:1px solid #E8E3DA;border-right:1px solid #E8E3DA;padding:24px 48px 0 48px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #E8E3DA;border-radius:12px;background-color:#FFFFFF;">
<tr>
<td style="padding:28px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#C9A962;letter-spacing:2px;text-transform:uppercase;margin-bottom:18px;">Utazás részletei</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td width="50%" style="padding-right:16px;vertical-align:top;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Dátum</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#1A1A1A;margin-bottom:18px;">${pickupDate}</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Időpont</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#C9A962;">${pickupTime}</div>
</td>
<td width="50%" style="padding-left:16px;vertical-align:top;border-left:1px solid #F0ECE6;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#16A34A;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Honnan</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#1A1A1A;line-height:1.6;margin-bottom:16px;">${fromAddress}</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#DC2626;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Hova</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#1A1A1A;line-height:1.6;">${toAddress}</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background-color:#FFFFFF;border-left:1px solid #E8E3DA;border-right:1px solid #E8E3DA;padding:24px 48px 0 48px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #E8E3DA;border-radius:12px;background-color:#FFFFFF;">
<tr>
<td style="padding:28px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#C9A962;letter-spacing:2px;text-transform:uppercase;margin-bottom:18px;">Sofőr és jármű</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="padding-bottom:14px;border-bottom:1px solid #F0ECE6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;">Sofőr</td>
<td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#1A1A1A;">${driverNameDisplay}</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:14px;padding-bottom:14px;border-bottom:1px solid #F0ECE6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;">Sofőr telefonszám</td>
<td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#1A1A1A;">${driverPhoneDisplay}</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;">Jármű</td>
<td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#1A1A1A;">${vehicleDisplay}</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background-color:#FFFFFF;border-left:1px solid #E8E3DA;border-right:1px solid #E8E3DA;padding:24px 48px 0 48px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #E8E3DA;border-radius:12px;background-color:#FFFFFF;">
<tr>
<td style="padding:28px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#C9A962;letter-spacing:2px;text-transform:uppercase;margin-bottom:18px;">További adatok</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="padding-bottom:12px;border-bottom:1px solid #F0ECE6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;">Cég</td>
<td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#1A1A1A;">${companyName || "Magánutas"}</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:12px;padding-bottom:12px;border-bottom:1px solid #F0ECE6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;">Szolgáltatás</td>
<td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#1A1A1A;">${transferTypeLabel}</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:12px;padding-bottom:12px;border-bottom:1px solid #F0ECE6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;">Fizetés</td>
<td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#1A1A1A;">${paymentMethodLabel}</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:12px;padding-bottom:12px;border-bottom:1px solid #F0ECE6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;">Utasok / csomagok</td>
<td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#1A1A1A;">${travelers} fő • ${luggage} db</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;">Várható díj</td>
<td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#1A1A1A;">${priceDisplay}</td>
</tr>
</table>
</td>
</tr>
</table>
${comment ? `<div style="margin-top:18px;padding:16px;border-radius:10px;background-color:#F8FAFC;border:1px solid #E2E8F0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;line-height:1.6;"><strong style="color:#0B1A2A;">Megjegyzés:</strong><br>${comment}</div>` : ""}
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background-color:#FFFFFF;border-left:1px solid #E8E3DA;border-right:1px solid #E8E3DA;padding:24px 48px 32px 48px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4A4A4A;line-height:1.8;">
Kérdés esetén válaszoljon erre az e-mailre, vagy keressen minket a megadott elérhetőségeken. Köszönjük, hogy a Pannon Transfert választotta.
</td>
</tr>
<tr>
<td style="height:1px;background-color:#C9A962;font-size:0;line-height:0;"></td>
</tr>
<tr>
<td style="background-color:#0B1A2A;border:1px solid #0B1A2A;border-radius:0 0 12px 12px;padding:40px 48px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#C9A962;letter-spacing:3px;text-transform:uppercase;">PANNON TRANSFER</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#7A7A7A;line-height:1.6;padding-top:10px;">✉ minimalwebsoft@gmail.com &nbsp;·&nbsp; ☏ +36 30 665 4135</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#7A7A7A;line-height:1.6;padding-top:12px;">© 2026 Pannon Transfer Executive Travel. Minden jog fenntartva.</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export function buildDriverAssignmentEmail(params: {
  bookingCode: string;
  driverName: string;
  travelerName: string;
  travelerPhone: string;
  pickupDate: string;
  pickupTime: string;
  fromAddress: string;
  toAddress: string;
  travelers: number;
  luggage: number;
  assignedVehicleName?: string;
  comment?: string;
}): string {
  const {
    bookingCode,
    driverName,
    travelerName,
    travelerPhone,
    pickupDate,
    pickupTime,
    fromAddress,
    toAddress,
    travelers,
    luggage,
    assignedVehicleName,
    comment,
  } = params;

  return `<!DOCTYPE html>
<html lang="hu">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Új fuvar · #${bookingCode}</title></head>
<body style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbe3ef;">
        <tr><td style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#ffffff;">
          <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#bfdbfe;">Pannon Transfer · Sofőri értesítés</div>
          <div style="font-size:28px;font-weight:800;margin-top:10px;">Új fuvar érkezett</div>
          <div style="font-size:14px;margin-top:8px;color:#dbeafe;">Kedves ${driverName}, ezt az utat hozzád rendeltük.</div>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <div style="font-size:20px;font-weight:800;margin-bottom:18px;">#${bookingCode}</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0;border-radius:12px;">
            <tr><td style="padding:16px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;">Felvétel</div>
              <div style="font-size:22px;font-weight:800;color:#1d4ed8;margin-top:6px;">${pickupDate} · ${pickupTime}</div>
              <div style="font-size:14px;font-weight:700;margin-top:10px;">${fromAddress}</div>
            </td></tr>
            <tr><td style="padding:0 16px 16px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;">Érkezés</div>
              <div style="font-size:14px;font-weight:700;margin-top:6px;">${toAddress}</div>
            </td></tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:18px;">
            <tr><td style="padding:9px 0;border-bottom:1px solid #e2e8f0;color:#64748b;">Utas</td><td align="right" style="padding:9px 0;border-bottom:1px solid #e2e8f0;font-weight:700;">${travelerName}</td></tr>
            <tr><td style="padding:9px 0;border-bottom:1px solid #e2e8f0;color:#64748b;">Telefonszám</td><td align="right" style="padding:9px 0;border-bottom:1px solid #e2e8f0;font-weight:700;">${travelerPhone}</td></tr>
            <tr><td style="padding:9px 0;border-bottom:1px solid #e2e8f0;color:#64748b;">Utasok / csomagok</td><td align="right" style="padding:9px 0;border-bottom:1px solid #e2e8f0;font-weight:700;">${travelers} fő · ${luggage} db</td></tr>
            <tr><td style="padding:9px 0;color:#64748b;">Jármű</td><td align="right" style="padding:9px 0;font-weight:700;">${assignedVehicleName || "Nincs megadva"}</td></tr>
          </table>
          ${comment ? `<div style="margin-top:18px;padding:14px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;font-size:13px;line-height:1.6;"><strong>Diszpécseri megjegyzés:</strong><br>${comment}</div>` : ""}
          <div style="margin-top:24px;padding:14px 16px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:10px;color:#166534;font-size:13px;line-height:1.6;">Kérjük, nyisd meg a sofőri felületet, ellenőrizd az adatokat, majd nyomd meg a „Láttam az utat” gombot.</div>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8fafc;color:#64748b;font-size:12px;">Pannon Transfer · Ez az üzenet automatikusan készült.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildDispatcherNotificationEmail(params: {
  bookingCode: string;
  travelerName: string;
  travelerEmail: string;
  travelerPhone: string;
  companyName: string;
  pickupDate: string;
  pickupTime: string;
  fromAddress: string;
  toAddress: string;
  travelers: number;
  luggage: number;
  transferType: string;
}): string {
  const {
    bookingCode,
    travelerName,
    travelerEmail,
    travelerPhone,
    companyName,
    pickupDate,
    pickupTime,
    fromAddress,
    toAddress,
    travelers,
    luggage,
    transferType,
  } = params;

  const transferTypeUpper = transferType.toUpperCase();

  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Új foglalás érkezett · #${bookingCode} · Pannon Transfer</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:Arial,Helvetica,sans-serif;min-width:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FAF8F5;padding:48px 16px;">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">
<tr>
<td style="background-color:#0B1A2A;border:1px solid #0B1A2A;border-radius:12px 12px 0 0;padding:0;height:80px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="height:80px;">
<tr>
<td align="center" valign="middle" style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:36px;height:36px;border:4px solid #C9A962;border-radius:4px;">
<tr>
<td align="center" valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#C9A962;">P</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#C9A962;letter-spacing:4px;text-transform:uppercase;padding-top:6px;">PANNON TRANSFER</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:500;color:#7A7A7A;letter-spacing:6px;text-transform:uppercase;padding-top:3px;">EXECUTIVE TRAVEL</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="height:1px;background-color:#C9A962;font-size:0;line-height:0;"></td>
</tr>
<tr>
<td style="background-color:#FFFFFF;border-left:1px solid #E8E3DA;border-right:1px solid #E8E3DA;padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding-left:48px;padding-right:48px;">
<tr>
<td style="padding-top:32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="width:3px;background-color:#C9A962;border-radius:2px;"></td>
<td style="padding-left:12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#C9A962;letter-spacing:4px;text-transform:uppercase;">ÚJ FOGLALÁS ÉRKEZETT</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:700;color:#1A1A1A;line-height:1.2;">#${bookingCode}</td>
</tr>
<tr>
<td style="padding-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A7A7A;line-height:1.6;">A következő ügyfél új foglalást küldött be, kérjük kezelje prioritásban.</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FFFFFF;border:1px solid #E8E3DA;border-radius:8px;">
<tr>
<td style="padding:28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;color:#C9A962;letter-spacing:2px;text-transform:uppercase;padding-bottom:20px;">ÜGYFÉL ADATAI</td>
</tr>
<tr>
<td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td width="50%" valign="top" style="padding-right:16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:4px;">Név</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#1A1A1A;padding-bottom:16px;">${travelerName}</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:4px;">Cég</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#1A1A1A;">${companyName}</td>
</tr>
</table>
</td>
<td width="50%" valign="top" style="padding-left:16px;border-left:1px solid #F0ECE6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding-left:16px;">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:4px;">Telefon</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#0B1A2A;padding-bottom:16px;">☏ ${travelerPhone}</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:4px;">E-mail</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#0B1A2A;word-break:break-all;">✉ ${travelerEmail}</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:20px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FFFFFF;border:1px solid #E8E3DA;border-radius:8px;">
<tr>
<td style="padding:28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;color:#C9A962;letter-spacing:2px;text-transform:uppercase;padding-bottom:20px;">UTAZÁS RÉSZLETEI</td>
</tr>
<tr>
<td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td width="50%" valign="top" style="padding-right:24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:6px;">📅 DÁTUM</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#1A1A1A;padding-bottom:16px;">${pickupDate}</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:6px;">🕒 IDŐPONT</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:#C9A962;padding-bottom:18px;">${pickupTime}</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:4px;">Szolgáltatás</td>
</tr>
<tr>
<td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;">
<tr>
<td style="background-color:#FAF6EE;border:1px solid #E6D9B8;border-radius:4px;padding:6px 14px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#C9A962;letter-spacing:1.5px;text-transform:uppercase;">${transferTypeUpper}</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
<td width="50%" valign="top" style="padding-left:24px;border-left:1px solid #F0ECE6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding-left:24px;">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:6px;">Indulás</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#1A1A1A;line-height:1.5;padding-bottom:12px;">✦ ${fromAddress}</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#C9A962;padding-bottom:12px;">&nbsp;&nbsp;·</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7A7A7A;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:6px;">Érkezés</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#1A1A1A;line-height:1.5;padding-bottom:18px;">${toAddress}</td>
</tr>
<tr>
<td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td width="50%" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#7A7A7A;">Utasok</td>
<td width="50%" align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;color:#C9A962;">${travelers} fő</td>
</tr>
<tr>
<td style="height:8px;"></td>
</tr>
<tr>
<td width="50%" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#7A7A7A;">Csomagok</td>
<td width="50%" align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;color:#1A1A1A;">${luggage} db</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#C9A962;border-radius:4px;">
<tr>
<td align="center" style="padding:0 24px;height:44px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#0B1A2A;letter-spacing:2px;text-transform:uppercase;line-height:44px;">FOGLALÁS MEGTEKINTÉSE ÉS HOZZÁRENDELÉSE</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FAF6EE;border-left:3px solid #C9A962;border-radius:0 8px 8px 0;">
<tr>
<td style="padding:20px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;color:#C9A962;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:14px;">✔ Diszpécseri ellenőrző lista</td>
</tr>
<tr>
<td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td width="20" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#C9A962;line-height:1.8;">1.</td>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4A4A4A;line-height:1.8;padding-bottom:4px;">Ellenőrizzük az időpontot és útvonalat</td>
</tr>
<tr>
<td width="20" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#C9A962;line-height:1.8;">2.</td>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4A4A4A;line-height:1.8;padding-bottom:4px;">Rendeljünk hozzá megfelelő sofőrt és járművet</td>
</tr>
<tr>
<td width="20" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#C9A962;line-height:1.8;">3.</td>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4A4A4A;line-height:1.8;padding-bottom:4px;">Állítsuk be a státuszt megerősítettre</td>
</tr>
<tr>
<td width="20" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#C9A962;line-height:1.8;">4.</td>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4A4A4A;line-height:1.8;">Küldjünk visszaigazolást az ügyfélnek</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding-top:32px;padding-bottom:40px;"></td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="height:1px;background-color:#C9A962;font-size:0;line-height:0;"></td>
</tr>
<tr>
<td style="background-color:#0B1A2A;border:1px solid #0B1A2A;border-radius:0 0 12px 12px;padding:40px 48px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:24px;height:24px;border:2px solid #C9A962;border-radius:3px;">
<tr>
<td align="center" valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#C9A962;">P</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#C9A962;letter-spacing:3px;text-transform:uppercase;padding-top:12px;">PANNON TRANSFER</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#7A7A7A;line-height:1.6;padding-top:10px;">✉ minimalwebsoft@gmail.com &nbsp;·&nbsp; ☏ +36 30 665 4135</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#7A7A7A;line-height:1.6;padding-top:12px;">© 2026 Pannon Transfer Executive Travel. Minden jog fenntartva.</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export function buildBookingModificationEmail(params: {
  bookingCode: string;
  travelerName: string;
  changes: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
}): string {
  const display = (value: unknown) =>
    value === null || value === undefined || value === "" ? "—" : String(value);
  const rows = params.changes.map((change) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:700;">${change.field}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;">${display(change.oldValue)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#166534;font-weight:700;">${display(change.newValue)}</td>
    </tr>`).join("");

  return `<!doctype html><html lang="hu"><body style="margin:0;padding:30px 16px;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%"><tr><td align="center"><table role="presentation" width="100%" style="max-width:620px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #dbe3ef;">
      <tr><td style="padding:26px 30px;background:#003e7e;color:#fff;"><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#bfdbfe;">Pannon Transfer</div><h1 style="margin:10px 0 0;font-size:24px;">Foglalás módosítva</h1></td></tr>
      <tr><td style="padding:28px 30px;"><p style="font-size:15px;line-height:1.6;">A diszpécser módosította a foglalás adatait.</p><p style="font-weight:700;">#${params.bookingCode} · ${params.travelerName}</p>
        <table role="presentation" width="100%" style="border-collapse:collapse;margin-top:20px;"><tr><th align="left" style="padding:10px 0;border-bottom:2px solid #cbd5e1;">Mező</th><th align="left" style="padding:10px 0;border-bottom:2px solid #cbd5e1;">Korábbi</th><th align="left" style="padding:10px 0;border-bottom:2px solid #cbd5e1;">Új</th></tr>${rows}</table>
        <p style="margin-top:24px;padding:14px 16px;background:#eff6ff;border-radius:10px;font-size:13px;line-height:1.6;">A legfrissebb állapotot a foglalási felületen tekintheti meg.</p>
      </td></tr><tr><td style="padding:18px 30px;background:#f8fafc;color:#64748b;font-size:12px;">Ez az üzenet automatikusan készült a Pannon Transfer rendszeréből.</td></tr>
    </table></td></tr></table></body></html>`;
}

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

function loadDotEnv(filePath) {
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute)) return {};
  const content = fs.readFileSync(absolute, "utf-8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
loadDotEnv(".env.local");

const URI = process.env.MONGODB_URI;
const DB = "pannontransferfoglalasikozpont";

function calculateBookingPrice(data) {
  const transferType = data.transferType || "standard";
  const fromType = data.fromType || (data.fromAddress && /airport|budapest airport|liszt/i.test(data.fromAddress) ? "airport" : "other");
  const toType = data.toType || (data.toAddress && /airport|budapest airport|liszt/i.test(data.toAddress) ? "airport" : "other");
  const exec = transferType === "executive";

  let category = data.category;
  if (!category) {
    if (exec) category = "vip";
    else if (fromType === "airport" || toType === "airport") category = "airport";
    else category = "city";
  }

  const basePrices = {
    airport: { standard: 38000, executive: 68000 },
    city: { standard: 22000, executive: 34000 },
    "long-distance": { standard: 72000, executive: 108000 },
    vip: { standard: 0, executive: 0 },
    partner: { standard: 42000, executive: 72000 },
  };

  let base = (basePrices[category] && basePrices[category][transferType]) || basePrices.airport[transferType];
  if (category === "vip") {
    const anyAirport = fromType === "airport" || toType === "airport";
    base = anyAirport ? 85000 : 55000;
    if (exec) base = Math.round(base * 1.5);
  }

  const txt = ((data.fromAddress || "") + " " + (data.toAddress || "")).toLowerCase();
  const isLongDistance =
    /miskolc|debrecen|szeged|pécs|győr|székesfehérvár|budapest airport|liszt ferenc/i.test(txt);

  if (category === "airport" && isLongDistance) {
    base = exec ? 105000 : 62000;
  }

  const travelers = data.travelers || 1;
  const luggage = data.luggage || 0;

  if (travelers >= 5) base = Math.round(base * 1.12);
  if (travelers >= 8) base = Math.round(base * 1.08);

  const extraLuggage = Math.max(0, luggage - Math.min(travelers * 3, 15));
  base += extraLuggage * 3500;

  return Math.round(base / 1000) * 1000;
}

async function main() {
  const client = new MongoClient(URI);
  await client.connect();
  console.log(`Connected to DB: ${DB}`);
  const col = client.db(DB).collection("bookings");

  const bookings = await col.find({}).toArray();
  console.log(`Bookings total: ${bookings.length}`);

  let updated = 0;
  for (const b of bookings) {
    const price = calculateBookingPrice(b);
    const needsUpdate = !b.price || b.price === 0;
    if (needsUpdate) {
      const res = await col.updateOne(
        { _id: b._id },
        { $set: { price, updatedAt: Date.now() } }
      );
      console.log(`  ✅ ${b.bookingCode} — ár beállítva: ${price.toLocaleString("hu-HU")} Ft (${res.modifiedCount} módosítva)`);
      updated++;
    } else {
      console.log(`  ⏭️  ${b.bookingCode} — már van ár: ${b.price.toLocaleString("hu-HU")} Ft`);
    }
  }

  console.log(`\n✅ Ár számítás kész: ${updated} frissített foglalás.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

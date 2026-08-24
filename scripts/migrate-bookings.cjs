const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

function loadDotEnv(filePath) {
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute)) return {};
  const content = fs.readFileSync(absolute, "utf-8");
  const vars = {};
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
    vars[key] = value;
    if (!process.env[key]) process.env[key] = value;
  }
  return vars;
}

loadDotEnv(".env.local");

const URI = process.env.MONGODB_URI;
const OLD_DB = "pannontransferpartnercegek";
const NEW_DB = "pannontransferfoglalasikozpont";

async function main() {
  console.log(`URI present: ${!!URI}, DB target: ${NEW_DB}`);
  const client = new MongoClient(URI);
  await client.connect();
  console.log("Connected to MongoDB");

  const oldDb = client.db(OLD_DB);
  const newDb = client.db(NEW_DB);

  const oldBookings = oldDb.collection("bookings");
  const newBookings = newDb.collection("bookings");
  const oldAudit = oldDb.collection("audit_logs");
  const newAudit = newDb.collection("audit_logs");

  const bookingsCount = await oldBookings.countDocuments();
  console.log(`[OLD] ${OLD_DB}.bookings count: ${bookingsCount}`);

  const auditCount = await oldAudit.countDocuments();
  console.log(`[OLD] ${OLD_DB}.audit_logs count: ${auditCount}`);

  let migratedBookings = 0;
  let skippedBookings = 0;

  if (bookingsCount > 0) {
    const cursor = oldBookings.find();
    for await (const doc of cursor) {
      const code = doc.bookingCode;
      const exists = await newBookings.findOne({ bookingCode: code });
      if (exists) {
        skippedBookings++;
        continue;
      }
      const { _id, ...rest } = doc;
      const res = await newBookings.insertOne({ ...rest });
      console.log(`  ✅ Migrated booking ${code} -> ${res.insertedId}`);
      migratedBookings++;
    }
  }

  let migratedAudit = 0;
  if (auditCount > 0) {
    const cursor = oldAudit.find();
    const docs = await cursor.toArray();
    if (docs.length > 0) {
      const clean = docs.map((d) => {
        const { _id, ...rest } = d;
        return rest;
      });
      try {
        const res = await newAudit.insertMany(clean, { ordered: false });
        migratedAudit = Object.keys(res.insertedIds).length;
      } catch (err) {
        migratedAudit = (err.result && err.result.nInserted) || 0;
        console.log(`  Audit insert partial: ${migratedAudit}`);
      }
    }
  }

  const newBookingsCount = await newBookings.countDocuments();
  console.log("\n✅ MIGRATION COMPLETE");
  console.log(`   Bookings migrated: ${migratedBookings} (skipped ${skippedBookings})`);
  console.log(`   Audit_logs inserted: ${migratedAudit}`);
  console.log(`   [NEW] ${NEW_DB}.bookings total: ${newBookingsCount}`);

  await client.close();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

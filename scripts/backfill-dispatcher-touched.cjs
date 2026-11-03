// Utólagos javítás: azok a "Beérkezett" (pending) foglalások, amelyeken a diszpécser már változtatott
// (árat írt be, időpontot/címet/sofőrt állított, ár-jóváhagyást kért), "Módosított" (sárga) státuszt kapnak —
// ugyanúgy, ahogy mostantól a mentés is teszi.
//
// Alapból csak kiírja, mit változtatna. Írni csak --apply kapcsolóval ír.
//   node scripts/backfill-dispatcher-touched.cjs                       (próba, minden staff)
//   node scripts/backfill-dispatcher-touched.cjs --roles=dispatcher    (csak diszpécser szerepkör)
//   node scripts/backfill-dispatcher-touched.cjs --apply [--roles=...]
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

function loadDotEnv(filePath) {
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute)) return;
  for (const rawLine of fs.readFileSync(absolute, "utf-8").split("\n")) {
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

const APPLY = process.argv.includes("--apply");
const rolesArg = process.argv.find((a) => a.startsWith("--roles="));
const ROLES = rolesArg ? rolesArg.slice("--roles=".length).split(",") : ["dispatcher", "admin"];

// Igaz, ha a naplóbejegyzés valódi diszpécseri változtatás (nem létrehozás, nem üres mentés).
function isRealEdit(entry) {
  const action = String(entry.action || "");
  if (action === "price.approval_requested" || action === "price.approval_approved") return true;
  if (action === "assigned") return !/^Hozzárendelve:\s*-\s*$/.test(String(entry.details || "").trim());
  if (action !== "modified") return false;
  const details = typeof entry.details === "string" ? entry.details : "";
  try {
    const parsed = JSON.parse(details);
    return Array.isArray(parsed.changes) ? parsed.changes.length > 0 : true;
  } catch {
    // Régi, szöveges bejegyzések (pl. "Kiküldve a sofőrnek") is beavatkozást jelentenek.
    return details.trim().length > 0;
  }
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI hiányzik (.env.local)");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(process.env.MONGODB_DB);
    const staff = await db
      .collection("staff_users")
      .find({ role: { $in: ROLES } }, { projection: { email: 1, name: 1 } })
      .toArray();
    const staffIds = new Set();
    for (const s of staff) {
      if (s.email) staffIds.add(String(s.email).toLowerCase());
      if (s.name) staffIds.add(String(s.name).toLowerCase());
    }

    const pending = await db
      .collection("bookings")
      .find({ status: "pending" }, { projection: { bookingCode: 1, auditTrail: 1, pickupDate: 1, portal: 1 } })
      .toArray();

    const targets = [];
    for (const b of pending) {
      const edits = (b.auditTrail || []).filter(
        (e) => staffIds.has(String(e.actor || "").toLowerCase()) && isRealEdit(e)
      );
      if (edits.length > 0) {
        targets.push(b);
        const who = [...new Set(edits.map((e) => e.actor))].join(", ");
        console.log(`${b.bookingCode}  ${b.portal || "-"}  ${b.pickupDate || ""}  ← ${edits.length} módosítás (${who})`);
      }
    }

    console.log(`\nSzerepkörök: ${ROLES.join(", ")} · Beérkezett foglalás: ${pending.length} · sárgára váltana: ${targets.length}`);
    if (!APPLY) {
      console.log("Próbafutás — semmi nem változott. Íráshoz: --apply");
      return;
    }
    if (targets.length === 0) return;
    const res = await db.collection("bookings").updateMany(
      { _id: { $in: targets.map((b) => b._id) }, status: "pending" },
      { $set: { status: "modified" } }
    );
    console.log(`Kész: ${res.modifiedCount} foglalás "Módosított" (sárga) lett.`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

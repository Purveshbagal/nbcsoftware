/**
 * Copies the data that only exists in the local mongod into the Atlas DB that
 * MONGODB_URI points at: products, payments (receipts + uploaded survey papers),
 * registrations, the id counters, and any user that Atlas does not have yet.
 *
 * Strictly additive. It never overwrites a document that is already on Atlas,
 * and counters only ever move forward, so receipt/survey/doctor numbers cannot
 * be reissued.
 *
 * Dry run (prints what it would do, writes nothing):
 *   node scripts/migrate-local-to-atlas.mjs
 * Apply:
 *   node scripts/migrate-local-to-atlas.mjs --apply
 */
import { MongoClient } from "mongodb";
import { config } from "dotenv";

config({ path: ".env", quiet: true });

const APPLY = process.argv.includes("--apply");
const LOCAL_URI = process.env.LOCAL_MONGODB_URI || "mongodb://localhost:27017/nbc-pedia";
const ONLINE_URI = process.env.MONGODB_URI;

if (!ONLINE_URI) {
  console.error("Missing MONGODB_URI in .env");
  process.exit(1);
}
if (ONLINE_URI.includes("localhost") || ONLINE_URI.includes("127.0.0.1")) {
  console.error("MONGODB_URI points at a local mongod — nothing to migrate to. Switch .env back to Atlas first.");
  process.exit(1);
}

const localClient = new MongoClient(LOCAL_URI, { serverSelectionTimeoutMS: 15000 });
const onlineClient = new MongoClient(ONLINE_URI, { serverSelectionTimeoutMS: 20000 });

await localClient.connect();
await onlineClient.connect();

const local = localClient.db("nbc-pedia");
const online = onlineClient.db("nbc-pedia");

console.log(`MODE: ${APPLY ? "APPLY (writing to Atlas)" : "DRY RUN (no writes)"}`);

/** Inserts the local docs whose _id is not on Atlas yet. Existing docs are left alone. */
async function copyNewDocs(collection, label) {
  const source = await local.collection(collection).find({}).toArray();
  const existing = new Set(
    (await online.collection(collection).find({}, { projection: { _id: 1 } }).toArray()).map((d) =>
      String(d._id)
    )
  );
  const pending = source.filter((d) => !existing.has(String(d._id)));

  console.log(
    `\n[${label}] local=${source.length} alreadyOnline=${source.length - pending.length} willInsert=${pending.length}`
  );
  for (const doc of pending) {
    console.log(`   + ${String(doc._id)}  ${doc.name ?? doc.doctorName ?? doc.receiptNumber ?? ""}`);
  }
  if (APPLY && pending.length) {
    const { insertedCount } = await online.collection(collection).insertMany(pending, { ordered: false });
    console.log(`   => inserted ${insertedCount}`);
  }
}

await copyNewDocs("products", "products");
await copyNewDocs("payments", "payments (receipts + survey papers)");
await copyNewDocs("registrations", "registrations");

// Counters drive receiptNumber / surveyFormNo / doctorId. Raising them to the
// local high-water mark is what stops the next approval from reissuing a number
// that a migrated receipt already uses.
console.log(`\n[counters] seq only moves forward`);
for (const counter of await local.collection("counters").find({}).toArray()) {
  const current = (await online.collection("counters").findOne({ _id: counter._id }))?.seq ?? 0;
  const next = Math.max(current, counter.seq ?? 0);
  console.log(
    `   ${String(counter._id).padEnd(14)} online=${String(current).padStart(3)} local=${String(counter.seq).padStart(3)} -> ${next}${
      next === current ? " (unchanged)" : ""
    }`
  );
  if (APPLY) {
    await online
      .collection("counters")
      .updateOne({ _id: counter._id }, { $max: { seq: next }, $setOnInsert: { __v: 0 } }, { upsert: true });
  }
}

// Atlas has its own admin/purvesh with their own password hashes. Overwriting
// them would change the passwords people already log in with, so only usernames
// that Atlas is missing get added.
const localUsers = await local.collection("users").find({}).toArray();
const onlineUsernames = new Set(
  (await online.collection("users").find({}, { projection: { username: 1 } }).toArray()).map((u) => u.username)
);
const newUsers = localUsers.filter((u) => !onlineUsernames.has(u.username));

console.log(`\n[users] users already on Atlas keep their existing password`);
for (const user of localUsers) {
  console.log(
    onlineUsernames.has(user.username)
      ? `   = ${user.username.padEnd(10)} already online — skipped`
      : `   + ${user.username.padEnd(10)} role=${user.role} — added with its local password`
  );
}
if (APPLY && newUsers.length) {
  const { insertedCount } = await online.collection("users").insertMany(newUsers, { ordered: false });
  console.log(`   => inserted ${insertedCount}`);
}

console.log(`\n=== ONLINE AFTER ===`);
for (const name of ["counters", "payments", "products", "registrations", "users"]) {
  console.log(`   ${name.padEnd(14)} ${String(await online.collection(name).countDocuments()).padStart(4)}`);
}

// A migrated payment is only usable if its productId still resolves, which is
// why products are copied with their original _id.
console.log(`\n=== REFERENCE CHECK (payments -> products / registrations) ===`);
for (const payment of await online.collection("payments").find({}).toArray()) {
  const product = payment.productId
    ? await online.collection("products").findOne({ _id: payment.productId })
    : null;
  const registration = await online.collection("registrations").findOne({ doctorId: payment.doctorId });
  console.log(
    `   receipt ${payment.receiptNumber ?? "-"} | product ${product ? "OK  " : "MISS"} ${payment.productName} | doctor ${payment.doctorId} ${
      registration ? "OK" : "no registration doc"
    } | survey ${payment.surveyFormNo ?? "-"} ${payment.surveyUpload?.data ? "(pdf attached)" : "(no pdf)"}`
  );
}

await localClient.close();
await onlineClient.close();

import mongoose from "mongoose";
import { config } from "dotenv";

config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("Missing MONGODB_URI in .env.local");
  process.exit(1);
}

if (uri.includes("<db_password>")) {
  console.error("MONGODB_URI still contains the <db_password> placeholder. Paste your real password in .env.local.");
  process.exit(1);
}

console.log(`Connecting to ${uri.replace(/\/\/([^:]+):[^@]+@/, "//$1:****@")} ...`);

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const { host, name } = mongoose.connection;
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`Connected. host=${host} db=${name}`);
  console.log(`Collections: ${collections.length ? collections.map((c) => c.name).join(", ") : "(none yet)"}`);
  await mongoose.disconnect();
} catch (err) {
  console.error(`Connection failed: ${err.message}`);
  process.exit(1);
}

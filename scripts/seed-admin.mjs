import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, default: "Administrator" },
    role: { type: String, enum: ["admin"], default: "admin" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function main() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in .env.local");
  }

  await mongoose.connect(MONGODB_URI);

  const username = "admin";
  const plainPassword = "123456";
  const hashed = await bcrypt.hash(plainPassword, 10);

  const existing = await User.findOne({ username });
  if (existing) {
    existing.password = hashed;
    await existing.save();
    console.log(`Updated existing admin user "${username}" password.`);
  } else {
    await User.create({ username, password: hashed, name: "Administrator" });
    console.log(`Created admin user "${username}".`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

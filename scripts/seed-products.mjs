import mongoose from "mongoose";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const MONGODB_URI = process.env.MONGODB_URI;

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    composition: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["syrup", "tablet", "speciality"],
      required: true,
    },
    pack: { type: String, trim: true },
    specialClaim: { type: String, trim: true },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

const products = [
  {
    name: "Pediagesic-P Suspension",
    composition: "Each 5ml contains Mefenamic Acid 50mg + Paracetamol 125mg",
    category: "syrup",
    pack: "60ml",
  },
  {
    name: "Pediamont LC Kid Syrup",
    composition: "Each 5ml contains Levocetirizine 2.5mg & Montelukast 4mg",
    category: "syrup",
    pack: "30ml & 60ml",
  },
  {
    name: "Tinycold-AF Syrup",
    composition: "Each 5ml contains Phenylephrine 5mg + Chlorpheniramine 2mg",
    category: "syrup",
    pack: "60ml",
  },
  {
    name: "Tinycold-DS Suspension",
    composition:
      "Each 5ml contains Phenylephrine 5mg + Chlorpheniramine 2mg + Paracetamol 250mg",
    category: "syrup",
    pack: "60ml",
  },
  {
    name: "Tinycold Suspension",
    composition:
      "Each 5ml contains Phenylephrine Hydrochloride 2.5mg + Chlorpheniramine Maleate 1mg + Paracetamol 125mg",
    category: "syrup",
    pack: "60ml",
  },
  {
    name: "Totsberry LS Junior Syrup",
    composition:
      "Each 5ml contains Ambroxol 15mg, Guaiphenesin 50mg & Levosalbutamol 0.5mg",
    category: "syrup",
    pack: "60ml",
  },
  {
    name: "Totsberry PD Syrup",
    composition:
      "Each 5ml contains Ambroxol 15mg, Guaiphenesin 50mg & Levosalbutamol 0.5mg",
    category: "syrup",
    pack: "60ml",
  },
  {
    name: "Molrin Suspension",
    composition: "Each 5ml contains Paracetamol 250mg (Mango flavor)",
    category: "syrup",
    pack: "60ml",
  },
  {
    name: "Brupedia Suspension",
    composition:
      "Each 5ml contains Ibuprofen 100mg & Paracetamol 62.5mg (Orange flavor)",
    category: "syrup",
    pack: "60ml & 100ml",
  },
  {
    name: "Totsberry LS Syrup",
    composition:
      "Each 5ml contains Ambroxol 30mg, Guaiphenesin 50mg & Levosalbutamol 1mg (Mango flavor)",
    category: "syrup",
    pack: "100ml",
  },
  {
    name: "Cyprotall",
    composition:
      "Syrup: Each 5ml contains Cyproheptadine 2mg, Tricholine Citrate 275mg & Sorbitol. Drops: Each 1ml contains Cyproheptadine 1.5mg & Tricholine Citrate 55mg",
    category: "syrup",
    pack: "100ml, 200ml (syrup); 15ml (drops)",
  },
  {
    name: "Pediamont LC Kid Tablet",
    composition:
      "Each Dispersible Tablet contains Levocetirizine 2.5mg & Montelukast 4mg",
    category: "tablet",
    pack: "10 tablets per strip",
  },
  {
    name: "Nazocure Junior Nasal Spray",
    composition: "0.05% w/v of Xylometazoline",
    category: "speciality",
    pack: "10ml",
  },
  {
    name: "Nazocure Saline Nasal Spray",
    composition: "0.65% w/v of Sodium Chloride",
    category: "speciality",
    pack: "20ml",
  },
  {
    name: "Bactomust Ointment",
    composition: "Mupirocin 2% w/w",
    category: "speciality",
    pack: "5gm",
  },
];

async function main() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in .env.local");
  }

  await mongoose.connect(MONGODB_URI);

  for (const product of products) {
    await Product.findOneAndUpdate({ name: product.name }, product, {
      upsert: true,
      setDefaultsOnInsert: true,
    });
  }

  console.log(`Seeded ${products.length} products.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

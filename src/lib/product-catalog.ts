import ProductModel from "@/models/Product";

type CatalogProduct = {
  name: string;
  composition: string;
  category: "syrup" | "tablet" | "speciality";
  pack: string;
};

/** The product range published on https://nbcpedia.com/products. */
export const PRODUCT_CATALOG: CatalogProduct[] = [
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
    composition: "Each 5ml contains Paracetamol 250mg (Mango flavour)",
    category: "syrup",
    pack: "60ml",
  },
  {
    name: "Brupedia Suspension",
    composition:
      "Each 5ml contains Ibuprofen 100mg & Paracetamol 62.5mg (Orange flavour)",
    category: "syrup",
    pack: "60ml & 100ml",
  },
  {
    name: "Totsberry LS Syrup",
    composition:
      "Each 5ml contains Ambroxol 30mg, Guaiphenesin 50mg & Levosalbutamol 1mg (Mango flavour)",
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
    composition:
      "Each 1ml solution contains 0.05% w/v of Xylometazoline as Nasal Spray",
    category: "speciality",
    pack: "10ml",
  },
  {
    name: "Nazocure Saline Nasal Spray",
    composition:
      "Each 1ml saline solution contains 0.65% w/v of Sodium Chloride as Nasal Spray",
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

let ensured: Promise<void> | null = null;

/**
 * Inserts any catalogue product missing from the database (matched by name).
 * Existing products are left untouched so admin edits survive. Runs once per
 * server process; a failure clears the memo so the next request retries.
 */
export function ensureProductCatalog() {
  ensured ??= ProductModel.bulkWrite(
    PRODUCT_CATALOG.map((product) => ({
      updateOne: {
        filter: { name: product.name },
        update: { $setOnInsert: product },
        upsert: true,
      },
    }))
  )
    .then(() => undefined)
    .catch((error) => {
      ensured = null;
      throw error;
    });

  return ensured;
}

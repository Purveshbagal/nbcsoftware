import type { Product } from "@/models/Product";
import type { ProductRecord } from "@/types/product";

type LeanProduct = Product & { _id: { toString(): string } };

export function serializeProduct(doc: LeanProduct): ProductRecord {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    composition: doc.composition,
    category: doc.category as ProductRecord["category"],
    pack: doc.pack ?? undefined,
    specialClaim: doc.specialClaim ?? undefined,
  };
}

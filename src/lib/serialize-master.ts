import type { MasterItem } from "@/models/MasterItem";
import type { MasterItemRecord } from "@/types/sfa";

type LeanMasterItem = MasterItem & { _id: { toString(): string } };

export function serializeMasterItem(doc: LeanMasterItem): MasterItemRecord {
  return {
    _id: doc._id.toString(),
    type: doc.type,
    name: doc.name,
    code: doc.code ?? "",
    description: doc.description ?? "",
    value: doc.value ?? null,
    parent: doc.parent ?? "",
    sortOrder: doc.sortOrder ?? 0,
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
  };
}

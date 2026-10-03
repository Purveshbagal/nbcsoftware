import type { User } from "@/models/User";
import type { UserRecord } from "@/types/user";

type LeanUser = User & { _id: { toString(): string } };

export function serializeUser(doc: LeanUser): UserRecord {
  return {
    _id: doc._id.toString(),
    username: doc.username,
    name: doc.name ?? "",
    role: (doc.role ?? "field") as UserRecord["role"],
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
  };
}

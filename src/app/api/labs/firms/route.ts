import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import FirmModel from "@/models/Firm";

const LIST_FIELDS =
  "firmCode name firmType firmCategory contactPerson contactNo city address zone assignedEmployees";

const WRITABLE = [
  "name",
  "firmType",
  "firmCategory",
  "contactPerson",
  "contactNo",
  "email",
  "city",
  "pincode",
  "address",
  "gstin",
  "drugLicenseNumber",
] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Firms — chemists, hospitals, stockists — the employee covers: assigned to
 * them or in their zone. `?q=` searches by name, contact or city.
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const search = new URL(request.url).searchParams.get("q")?.trim();
  const scope: Record<string, unknown>[] = [{ assignedEmployees: employee.name }];
  if (employee.zone) scope.push({ zone: employee.zone });

  const query: Record<string, unknown> = { isActive: { $ne: false }, $or: scope };
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    query.$and = [{ $or: [{ name: pattern }, { contactPerson: pattern }, { city: pattern }] }];
  }

  const items = await FirmModel.find(query).select(LIST_FIELDS).sort({ name: 1 }).limit(500).lean();
  return NextResponse.json({ items });
}

/** A new chemist, hospital or stockist met in the field. */
export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const doc: Record<string, string> = {};
  for (const field of WRITABLE) doc[field] = String(body[field] ?? "").trim();
  if (!doc.name) {
    return NextResponse.json({ error: "Firm name is required" }, { status: 400 });
  }

  const item = await FirmModel.create({
    ...doc,
    zone: employee.zone,
    division: employee.division,
    assignedEmployees: [employee.name],
    createdBy: { username: employee.username, name: employee.name },
  });

  return NextResponse.json({ item }, { status: 201 });
}

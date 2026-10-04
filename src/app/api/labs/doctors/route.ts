import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import DoctorModel from "@/models/Doctor";

const LIST_FIELDS =
  "doctorCode prefix name hospitalName speciality qualification category contactNo city clinicAddress zone assignedEmployees";

const WRITABLE = [
  "prefix",
  "name",
  "hospitalName",
  "speciality",
  "qualification",
  "category",
  "contactNo",
  "email",
  "city",
  "pincode",
  "clinicAddress",
  "gender",
] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Doctors the employee can call on: the ones assigned to them plus everyone
 * in their zone. `?q=` searches by name, hospital or city.
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
    query.$and = [{ $or: [{ name: pattern }, { hospitalName: pattern }, { city: pattern }] }];
  }

  const items = await DoctorModel.find(query).select(LIST_FIELDS).sort({ name: 1 }).limit(500).lean();
  return NextResponse.json({ items });
}

/** A new doctor met in the field. It is assigned to whoever added it. */
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
    return NextResponse.json({ error: "Doctor name is required" }, { status: 400 });
  }
  if (!["male", "female", "other"].includes(doc.gender)) doc.gender = "";

  const item = await DoctorModel.create({
    ...doc,
    prefix: doc.prefix || "Dr",
    zone: employee.zone,
    division: employee.division,
    assignedEmployees: [employee.name],
    createdBy: { username: employee.username, name: employee.name },
  });

  return NextResponse.json({ item }, { status: 201 });
}

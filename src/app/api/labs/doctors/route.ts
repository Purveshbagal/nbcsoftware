import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import DoctorModel from "@/models/Doctor";
import { generateDoctorUinId } from "@/utils/doctorUinGenerator";

const LIST_FIELDS =
  "doctorCode uinId prefix name hospitalName hospitalAddress speciality qualification category contactNo email city pincode clinicAddress gender location bankDetails zone assignedEmployees approvalStatus";

const WRITABLE = [
  "prefix",
  "name",
  "hospitalName",
  "hospitalAddress",
  "speciality",
  "qualification",
  "category",
  "contactNo",
  "email",
  "city",
  "pincode",
  "clinicAddress",
  "gender",
  "bankDetails",
  "location",
  "documents",
] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Doctors the employee can call on: the ones assigned to them plus everyone
 * in their zone. `?q=` searches by name, hospital or city.
 * Only shows approved doctors (or doctors without approval status for backward compatibility).
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const search = new URL(request.url).searchParams.get("q")?.trim();
  const scope: Record<string, unknown>[] = [{ assignedEmployees: employee.name }];
  if (employee.zone) scope.push({ zone: employee.zone });

  const query: Record<string, unknown> = {
    isActive: { $ne: false },
    $or: scope,
    // Only show approved doctors or doctors without approval status (for backward compatibility)
    approvalStatus: { $in: ["approved", "", null] }
  };
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    // Search by name, hospital, city, or UIN ID
    query.$and = [{ $or: [{ name: pattern }, { hospitalName: pattern }, { city: pattern }, { uinId: pattern }] }];
  }

  const items = await DoctorModel.find(query).select(LIST_FIELDS).sort({ name: 1 }).limit(500).lean();
  return NextResponse.json({ items });
}

// UIN ID generation is now handled by centralized utility: @/utils/doctorUinGenerator

/** A new doctor met in the field. It is assigned to whoever added it. */
export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const source = body.source || "racer"; // racer or survey

  const doc: Record<string, unknown> = {};
  for (const field of WRITABLE) {
    if (field === "bankDetails" || field === "location") {
      doc[field] = body[field] || {};
    } else if (field === "documents") {
      doc[field] = body[field] || [];
    } else {
      doc[field] = String(body[field] ?? "").trim();
    }
  }

  if (!doc.name) {
    return NextResponse.json({ error: "Doctor name is required" }, { status: 400 });
  }
  if (!["male", "female", "other"].includes(doc.gender as string)) doc.gender = "";

  // For Racer app: Generate UIN ID and set pending approval status
  let uinId;
  let approvalStatus = "";
  if (source === "racer") {
    uinId = await generateDoctorUinId({ source: "racer" });
    approvalStatus = "pending";
  }

  const item = await DoctorModel.create({
    ...doc,
    prefix: (doc.prefix as string) || "Dr",
    zone: employee.zone,
    division: employee.division,
    assignedEmployees: [employee.name],
    createdBy: { username: employee.username, name: employee.name },
    source,
    uinId,
    approvalStatus,
  });

  return NextResponse.json({ item }, { status: 201 });
}

import { NextResponse } from "next/server";

import { collectionRoutes, requireAdmin } from "@/lib/sfa-crud";
import { employeeCrud } from "@/lib/sfa-entities";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import EmployeeModel from "@/models/Employee";
import { generateEmployeeId } from "@/utils/employeeIdGenerator";

const { GET: genericGET } = collectionRoutes(() => EmployeeModel, employeeCrud);

export const GET = genericGET;

// Custom POST handler to auto-generate employee ID
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate required field
  if (!body.name || String(body.name).trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  await connectToDatabase();

  // Auto-generate employee ID if not provided or empty
  let employeeId = String(body.code || "").trim();
  if (!employeeId) {
    employeeId = await generateEmployeeId();
  }

  // Prepare employee data
  const employeeData: Record<string, unknown> = {
    code: employeeId,
    name: String(body.name).trim(),
    email: String(body.email || "").trim(),
    contactNo: String(body.contactNo || "").trim(),
    workType: String(body.workType || "").trim(),
    assignTo: String(body.assignTo || "").trim(),
    city: String(body.city || "").trim(),
    state: String(body.state || "").trim(),
    address: String(body.address || "").trim(),
    division: String(body.division || "").trim(),
    zone: String(body.zone || "").trim(),
    designation: String(body.designation || "").trim(),
    reportingTo: String(body.reportingTo || "").trim(),
    dateOfBirth: String(body.dateOfBirth || "").trim(),
    dateOfJoin: String(body.dateOfJoin || "").trim(),
    dateOfResignation: String(body.dateOfResignation || "").trim(),
    inactiveDate: String(body.inactiveDate || "").trim(),
    inactiveReason: String(body.inactiveReason || "").trim(),
    isActive: Boolean(body.isActive),
    createdBy: { username: auth.session!.username, name: auth.session!.name },
  };

  const created = await EmployeeModel.create(employeeData);

  return NextResponse.json({ item: created }, { status: 201 });
}

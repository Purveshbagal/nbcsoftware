import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { collectionRoutes, requireAdmin } from "@/lib/sfa-crud";
import { employeeCrud } from "@/lib/sfa-entities";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import EmployeeModel from "@/models/Employee";
import { generateEmployeeId } from "@/utils/employeeIdGenerator";
import { addEmployeeToTeamChat, createWelcomeMessage } from "@/lib/chat-helpers";

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

  // Validate required fields
  if (!body.name || String(body.name).trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.contactNo || String(body.contactNo).trim() === "") {
    return NextResponse.json({ error: "mobile number is required" }, { status: 400 });
  }
  if (!body.designation || String(body.designation).trim() === "") {
    return NextResponse.json({ error: "designation is required" }, { status: 400 });
  }

  const appPassword = String(body.appPassword || "").trim();
  if (!appPassword) {
    return NextResponse.json({ error: "password is required" }, { status: 400 });
  }
  if (appPassword.length < 6) {
    return NextResponse.json({ error: "password must be at least 6 characters" }, { status: 400 });
  }

  await connectToDatabase();

  // Auto-generate employee ID
  const employeeId = await generateEmployeeId();

  // Create app username from employee code (e.g., NBC01)
  const appUsername = employeeId.toLowerCase();

  // Hash the password
  const appPasswordHash = await bcrypt.hash(appPassword, 10);

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
    isActive: body.isActive !== false,
    createdBy: { username: auth.session!.username, name: auth.session!.name },
    // Mobile app credentials
    appUsername,
    appPasswordHash,
    appAccessEnabled: true,
  };

  const created = await EmployeeModel.create(employeeData);

  // Add employee to team chat and send welcome message
  try {
    await addEmployeeToTeamChat(created._id);
    await createWelcomeMessage(created.name);
  } catch (chatError) {
    console.error("Failed to add employee to team chat:", chatError);
    // Don't fail the employee creation if chat setup fails
  }

  return NextResponse.json({
    item: created,
    credentials: {
      employeeId,
      appUsername,
      password: appPassword, // Return password only once on creation
    }
  }, { status: 201 });
}

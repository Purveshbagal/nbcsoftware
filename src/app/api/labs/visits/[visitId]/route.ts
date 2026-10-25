import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import VisitModel from "@/models/Visit";
import EmployeeModel from "@/models/Employee";

/**
 * Update visit details (remarks, photos, etc.)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ visitId: string }> }
) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const { visitId } = await params;

  const body = (await readJsonBody(request)) as
    | {
        remarks?: string;
        extraInfo?: string;
        photos?: string[];
        presentationShown?: boolean;
        presentationId?: string;
      }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const visit = await VisitModel.findOne({ _id: visitId, employeeName: employee.name });

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  // Update fields
  if (body.remarks !== undefined) visit.remarks = body.remarks;
  if (body.extraInfo !== undefined) visit.extraInfo = body.extraInfo;
  if (body.photos !== undefined) visit.photos = body.photos;
  if (body.presentationShown !== undefined) visit.presentationShown = body.presentationShown;
  if (body.presentationId !== undefined) visit.presentationId = body.presentationId;

  await visit.save();

  return NextResponse.json({ visit });
}

/**
 * Get visit details by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ visitId: string }> }
) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const { visitId } = await params;

  const visit = await VisitModel.findOne({ _id: visitId, employeeName: employee.name }).lean();

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  return NextResponse.json({ visit });
}

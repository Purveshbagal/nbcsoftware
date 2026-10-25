import { NextResponse } from "next/server";

import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import EmployeeModel from "@/models/Employee";
import VisitModel from "@/models/Visit";

/**
 * Check in to a planned visit (user arrives at location)
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
        lat?: number;
        lng?: number;
        accuracy?: number;
      }
    | null;

  const visit = await VisitModel.findOne({ _id: visitId, employeeName: employee.name });

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  if (visit.status !== "planned") {
    return NextResponse.json(
      { error: "Visit is not in planned status" },
      { status: 400 }
    );
  }

  const now = new Date();

  // Update visit to "open" status
  visit.status = "open";
  visit.checkInAt = now;
  visit.visitDate = istDateKey(now); // Set actual visit date

  // Update location if provided
  if (body?.lat !== undefined && body?.lng !== undefined) {
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const accuracy = Number(body.accuracy);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      visit.geo = {
        lat,
        lng,
        accuracy: Number.isFinite(accuracy) ? accuracy : undefined,
      };

      // Update employee location
      await EmployeeModel.updateOne(
        { _id: employee.employeeId },
        { lastSeenAt: now, lastLocation: { lat, lng, accuracy, at: now } }
      );
    }
  }

  await visit.save();

  return NextResponse.json({ visit });
}

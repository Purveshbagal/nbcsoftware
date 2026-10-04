import { NextResponse } from "next/server";

import { referenceNumber } from "@/lib/labs-crud";
import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import EmployeeModel from "@/models/Employee";
import VisitModel from "@/models/Visit";

const VISIT_STATUSES = ["closed", "skipped", "planned"];

function stringList(value: unknown) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return [];
}

/** The employee's own visits, newest first. `?date=YYYY-MM-DD` narrows to a day. */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const query: Record<string, unknown> = { employeeName: auth.employee.name };
  const date = url.searchParams.get("date");
  if (date) query.visitDate = date;
  const type = url.searchParams.get("type");
  if (type === "doctor" || type === "firm") query.visitType = type;

  const items = await VisitModel.find(query).sort({ visitDate: -1, createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ items });
}

/**
 * Log a doctor or firm (chemist / hospital / stockist) visit from the field,
 * stamped with where the phone was when it was submitted.
 */
export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const visitType = body.visitType === "firm" ? "firm" : "doctor";
  const subject = String(visitType === "doctor" ? body.doctor ?? "" : body.firm ?? "").trim();
  if (!subject) {
    return NextResponse.json(
      { error: visitType === "doctor" ? "Choose the doctor you visited" : "Choose the firm you visited" },
      { status: 400 }
    );
  }

  const status = VISIT_STATUSES.includes(String(body.status)) ? String(body.status) : "closed";
  if (status === "skipped" && !String(body.skippedReason ?? "").trim()) {
    return NextResponse.json({ error: "Give a reason for skipping this call" }, { status: 400 });
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const accuracy = Number(body.accuracy);
  const geo =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? { lat, lng, accuracy: Number.isFinite(accuracy) ? accuracy : undefined }
      : undefined;

  const pob = Number(body.pobValue);
  const checkInAt = new Date(String(body.checkInAt ?? ""));
  const now = new Date();

  const item = await VisitModel.create({
    visitCode: referenceNumber("VS"),
    visitType,
    doctor: visitType === "doctor" ? subject : "",
    firm: visitType === "firm" ? subject : "",
    clinicAddress: String(body.clinicAddress ?? "").trim(),
    city: String(body.city ?? "").trim(),
    zone: employee.zone,
    division: employee.division,
    employeeName: employee.name,
    employeeId: employee.employeeId,
    visitDate: istDateKey(now),
    callObjective: String(body.callObjective ?? "").trim(),
    postCallInfo: String(body.postCallInfo ?? "").trim(),
    remarks: String(body.remarks ?? "").trim(),
    products: stringList(body.products),
    samples: stringList(body.samples),
    gifts: stringList(body.gifts),
    pobValue: Number.isFinite(pob) && pob > 0 ? pob : undefined,
    skippedReason: String(body.skippedReason ?? "").trim(),
    status,
    geo,
    checkInAt: Number.isNaN(checkInAt.getTime()) ? now : checkInAt,
    checkOutAt: now,
    source: "app",
    createdBy: { username: employee.username, name: employee.name },
  });

  if (geo) {
    await EmployeeModel.updateOne(
      { _id: employee.employeeId },
      { lastSeenAt: now, lastLocation: { ...geo, at: now } }
    );
  }

  return NextResponse.json({ item }, { status: 201 });
}

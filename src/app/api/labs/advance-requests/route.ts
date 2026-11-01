import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import AdvanceRequestModel from "@/models/AdvanceRequest";
import AdvancedPaymentModel from "@/models/AdvancedPayment";

/**
 * GET /api/labs/advance-requests
 * Get employee's advance requests
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  const requests = await AdvanceRequestModel.find({ employeeId: auth.employee.employeeId })
    .sort({ requestDate: -1 })
    .lean();

  return NextResponse.json({
    requests: requests.map((req) => ({
      _id: req._id?.toString(),
      requestDate: req.requestDate,
      advanceAmount: req.advanceAmount,
      reason: req.reason,
      hasInstallment: req.hasInstallment,
      installmentPerMonth: req.installmentPerMonth,
      numberOfMonths: req.numberOfMonths,
      status: req.status,
      reviewedAt: req.reviewedAt,
      rejectionReason: req.rejectionReason,
    })),
  });
}

/**
 * POST /api/labs/advance-requests
 * Submit advance request from mobile
 */
export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { advanceAmount, reason, hasInstallment, installmentPerMonth, numberOfMonths } = body;

  if (!advanceAmount || Number(advanceAmount) <= 0) {
    return NextResponse.json({ error: "Valid advance amount is required" }, { status: 400 });
  }

  if (hasInstallment && (!installmentPerMonth || !numberOfMonths)) {
    return NextResponse.json(
      { error: "Installment details are required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const advanceRequest = await AdvanceRequestModel.create({
    employeeId: auth.employee.employeeId,
    employeeName: auth.employee.name,
    zone: auth.employee.zone,
    division: auth.employee.division,
    requestDate: new Date(),
    advanceAmount: Number(advanceAmount),
    reason,
    hasInstallment: hasInstallment || false,
    installmentPerMonth: hasInstallment ? Number(installmentPerMonth) : 0,
    numberOfMonths: hasInstallment ? Number(numberOfMonths) : 0,
  });

  return NextResponse.json(
    {
      request: {
        _id: advanceRequest._id?.toString(),
        status: advanceRequest.status,
      },
    },
    { status: 201 }
  );
}

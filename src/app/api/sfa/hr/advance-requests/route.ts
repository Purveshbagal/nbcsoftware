import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/sfa-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import AdvanceRequestModel from "@/models/AdvanceRequest";

/**
 * GET /api/sfa/hr/advance-requests
 * Get all advance requests
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const query: any = {};
  if (status && status !== "all") {
    query.status = status;
  }

  const requests = await AdvanceRequestModel.find(query)
    .sort({ requestDate: -1, createdAt: -1 })
    .lean();

  return NextResponse.json({
    requests: requests.map((req) => ({
      _id: req._id?.toString(),
      employeeId: req.employeeId?.toString(),
      employeeName: req.employeeName,
      zone: req.zone,
      division: req.division,
      requestDate: req.requestDate,
      advanceAmount: req.advanceAmount,
      reason: req.reason,
      hasInstallment: req.hasInstallment,
      installmentPerMonth: req.installmentPerMonth,
      numberOfMonths: req.numberOfMonths,
      status: req.status,
      reviewedBy: req.reviewedBy,
      reviewedAt: req.reviewedAt,
      rejectionReason: req.rejectionReason,
      createdAt: req.createdAt,
    })),
  });
}

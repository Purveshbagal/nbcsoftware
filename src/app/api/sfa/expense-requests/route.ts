import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/sfa-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import ExpenseRequestModel from "@/models/ExpenseRequest";

/**
 * GET /api/sfa/expense-requests
 * Get all expense requests
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const query: any = {};
  if (status) query.status = status;

  const requests = await ExpenseRequestModel.find(query)
    .sort({ requestDate: -1, createdAt: -1 })
    .lean();

  return NextResponse.json({
    requests: requests.map((r) => ({
      _id: r._id?.toString(),
      employeeId: r.employeeId?.toString(),
      employeeName: r.employeeName,
      zone: r.zone,
      division: r.division,
      requestDate: r.requestDate,
      expenseType: r.expenseType,
      amount: r.amount,
      description: r.description,
      remarks: r.remarks,
      attachmentUrl: r.attachmentUrl,
      status: r.status,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt,
    })),
  });
}

/**
 * POST /api/sfa/expense-requests
 * Create a new expense request (from mobile app)
 */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { employeeId, employeeName, zone, division, requestDate, expenseType, amount, description, attachmentUrl } = body;

  if (!employeeId || !employeeName || !requestDate || !expenseType || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectToDatabase();

  const expenseRequest = await ExpenseRequestModel.create({
    employeeId,
    employeeName,
    zone,
    division,
    requestDate: new Date(String(requestDate)),
    expenseType,
    amount: Number(amount),
    description,
    attachmentUrl,
  });

  return NextResponse.json(
    {
      request: {
        _id: expenseRequest._id?.toString(),
        status: expenseRequest.status,
      },
    },
    { status: 201 }
  );
}

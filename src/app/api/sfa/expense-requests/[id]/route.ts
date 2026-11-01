import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/sfa-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import ExpenseRequestModel from "@/models/ExpenseRequest";
import ExpenseModel from "@/models/Expense";

/**
 * PATCH /api/sfa/expense-requests/[id]
 * Accept or reject an expense request
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { status, rejectionReason } = body;

  if (!status || !["accepted", "rejected"].includes(String(status))) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (status === "rejected" && !rejectionReason) {
    return NextResponse.json(
      { error: "Rejection reason is required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const expenseRequest = await ExpenseRequestModel.findByIdAndUpdate(
    id,
    {
      status,
      rejectionReason: status === "rejected" ? rejectionReason : undefined,
      reviewedBy: {
        username: auth.session.username,
        name: auth.session.name,
      },
      reviewedAt: new Date(),
    },
    { new: true }
  );

  if (!expenseRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // If accepted, add to employee's expense for that date
  if (status === "accepted") {
    const expenseDate = new Date(expenseRequest.requestDate);
    expenseDate.setHours(0, 0, 0, 0);

    const expense = await ExpenseModel.findOne({
      employeeId: expenseRequest.employeeId,
      expenseDate,
    });

    if (expense) {
      // Add to existing expense
      expense.requestedExpenses = (expense.requestedExpenses || 0) + expenseRequest.amount;
      expense.totalAmount =
        (expense.travelAllowance || 0) +
        (expense.workPlanAllowance || 0) +
        expense.requestedExpenses;
      await expense.save();
    }
  }

  return NextResponse.json({
    request: {
      _id: expenseRequest._id?.toString(),
      status: expenseRequest.status,
    },
  });
}

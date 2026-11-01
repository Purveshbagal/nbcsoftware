import { Metadata } from "next";

import ExpensePaymentClient from "./client";
import { connectToDatabase } from "@/lib/mongodb";
import ExpenseModel from "@/models/Expense";

export const metadata: Metadata = {
  title: "Expense Payment",
};

export default async function ExpensePaymentPage() {
  await connectToDatabase();

  // Get all expenses (both pending and paid)
  const expenses = await ExpenseModel.find({
    $or: [
      { workPlan: { $in: ["headquarter", "in-city"] } },
      { workPlan: "outstation", arrivalStatus: "arrived" },
    ],
  })
    .sort({ expenseDate: -1 })
    .lean();

  const serializedExpenses = expenses.map((exp) => ({
    _id: exp._id?.toString() || "",
    employeeId: exp.employeeId?.toString() || "",
    employeeName: exp.employeeName || "",
    zone: exp.zone || "",
    division: exp.division || "",
    designation: exp.designation || "",
    expenseDate: exp.expenseDate?.toISOString() || "",
    workPlan: exp.workPlan || "",
    fromTaluka: exp.fromTaluka || "",
    toTaluka: exp.toTaluka || "",
    distanceKm: exp.distanceKm || 0,
    travelMode: exp.travelMode || "",
    travelAllowance: exp.travelAllowance || 0,
    workPlanAllowance: exp.workPlanAllowance || 0,
    requestedExpenses: exp.requestedExpenses || 0,
    totalAmount: exp.totalAmount || 0,
    paymentStatus: exp.paymentStatus || "pending",
    paidAmount: exp.paidAmount || 0,
    paidAt: exp.paidAt?.toISOString() || null,
    paidBy: exp.paidBy || null,
  }));

  return <ExpensePaymentClient expenses={serializedExpenses} />;
}

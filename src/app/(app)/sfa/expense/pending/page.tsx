import { Metadata } from "next";

import PendingExpenseClient from "./client";
import { connectToDatabase } from "@/lib/mongodb";
import ExpenseModel from "@/models/Expense";

export const metadata: Metadata = {
  title: "Pending Expenses",
};

export default async function PendingExpensePage() {
  await connectToDatabase();

  // Only show expenses that are:
  // 1. Arrived (for outstation) OR auto-arrived (for headquarter/in-city)
  // 2. Not yet paid
  const expenses = await ExpenseModel.find({
    $or: [
      { workPlan: { $in: ["headquarter", "in-city"] } }, // Auto-arrived
      { workPlan: "outstation", arrivalStatus: "arrived" }, // Manually arrived
    ],
    paymentStatus: "pending",
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
  }));

  return <PendingExpenseClient expenses={serializedExpenses} />;
}

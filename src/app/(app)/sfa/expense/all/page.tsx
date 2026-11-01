import { Metadata } from "next";

import AllExpenseClient from "./client";
import { connectToDatabase } from "@/lib/mongodb";
import ExpenseModel from "@/models/Expense";

export const metadata: Metadata = {
  title: "All Expenses",
};

export default async function AllExpensePage() {
  await connectToDatabase();

  const expenses = await ExpenseModel.find({})
    .sort({ expenseDate: -1, createdAt: -1 })
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
    fromDistrict: exp.fromDistrict || "",
    toTaluka: exp.toTaluka || "",
    toDistrict: exp.toDistrict || "",
    distanceKm: exp.distanceKm || 0,
    travelMode: exp.travelMode || "",
    arrivalStatus: exp.arrivalStatus || "not-arrived",
    arrivedAt: exp.arrivedAt?.toISOString() || null,
    arrivalLocation: exp.arrivalLocation || null,
    travelTimeMinutes: exp.travelTimeMinutes || 0,
    travelAllowance: exp.travelAllowance || 0,
    workPlanAllowance: exp.workPlanAllowance || 0,
    requestedExpenses: exp.requestedExpenses || 0,
    totalAmount: exp.totalAmount || 0,
    paymentStatus: exp.paymentStatus || "pending",
    punchedInAt: exp.punchedInAt?.toISOString() || null,
  }));

  return <AllExpenseClient expenses={serializedExpenses} />;
}

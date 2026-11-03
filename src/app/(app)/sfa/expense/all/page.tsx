import { Metadata } from "next";

import AllExpenseClient from "./client";
import { connectToDatabase } from "@/lib/mongodb";
import ExpenseModel from "@/models/Expense";

export const metadata: Metadata = {
  title: "All Expenses",
};

// Rows come straight from the database, so any field can be missing or stored
// in an unexpected shape. One bad row must not take the whole page down.
function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toLocation(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const loc = value as Record<string, unknown>;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (loc.lat == null || loc.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return {
    lat,
    lng,
    address: toText(loc.address),
    area: toText(loc.area),
    village: toText(loc.village),
    district: toText(loc.district),
  };
}

export default async function AllExpensePage() {
  try {
    await connectToDatabase();

    const expenses = await ExpenseModel.find({})
      .sort({ expenseDate: -1, createdAt: -1 })
      .lean();

    const serializedExpenses = expenses.flatMap((exp) => {
      // The client formats this date, so a row without a usable one is skipped.
      const expenseDate = toIso(exp.expenseDate) ?? toIso(exp.createdAt);
      if (!expenseDate) return [];

      return [
        {
          _id: String(exp._id ?? ""),
          employeeId: String(exp.employeeId ?? ""),
          employeeName: toText(exp.employeeName),
          zone: toText(exp.zone),
          division: toText(exp.division),
          designation: toText(exp.designation),
          expenseDate,
          workPlan: toText(exp.workPlan),
          fromTaluka: toText(exp.fromTaluka),
          fromDistrict: toText(exp.fromDistrict),
          toTaluka: toText(exp.toTaluka),
          toDistrict: toText(exp.toDistrict),
          distanceKm: toNumber(exp.distanceKm),
          travelMode: toText(exp.travelMode),
          arrivalStatus: toText(exp.arrivalStatus) || "not-arrived",
          arrivedAt: toIso(exp.arrivedAt),
          arrivalLocation: toLocation(exp.arrivalLocation),
          travelTimeMinutes: toNumber(exp.travelTimeMinutes),
          travelAllowance: toNumber(exp.travelAllowance),
          workPlanAllowance: toNumber(exp.workPlanAllowance),
          requestedExpenses: toNumber(exp.requestedExpenses),
          totalAmount: toNumber(exp.totalAmount),
          paymentStatus: toText(exp.paymentStatus) || "pending",
          punchedInAt: toIso(exp.punchedInAt),
        },
      ];
    });

    return <AllExpenseClient expenses={serializedExpenses} />;
  } catch (error) {
    // Production hides the message from the browser; this keeps it in the logs.
    console.error("[sfa/expense/all] failed to render", error);
    throw error;
  }
}

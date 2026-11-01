import { Metadata } from "next";

import ExpenseRequestsClient from "./client";
import { connectToDatabase } from "@/lib/mongodb";
import ExpenseRequestModel from "@/models/ExpenseRequest";

export const metadata: Metadata = {
  title: "Expense Requests",
};

export default async function ExpenseRequestsPage() {
  await connectToDatabase();

  const requests = await ExpenseRequestModel.find({})
    .sort({ requestDate: -1, createdAt: -1 })
    .lean();

  const serializedRequests = requests.map((req) => ({
    _id: req._id?.toString() || "",
    employeeId: req.employeeId?.toString() || "",
    employeeName: req.employeeName || "",
    zone: req.zone || "",
    division: req.division || "",
    requestDate: req.requestDate?.toISOString() || "",
    expenseType: req.expenseType || "",
    amount: req.amount || 0,
    description: req.description || "",
    remarks: req.remarks || "",
    attachmentUrl: req.attachmentUrl || "",
    status: req.status || "pending",
    reviewedBy: req.reviewedBy || null,
    reviewedAt: req.reviewedAt?.toISOString() || null,
    rejectionReason: req.rejectionReason || "",
    createdAt: req.createdAt?.toISOString() || "",
  }));

  return <ExpenseRequestsClient requests={serializedRequests} />;
}

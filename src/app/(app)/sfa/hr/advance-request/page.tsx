import { Metadata } from "next";

import AdvanceRequestClient from "./client";
import { connectToDatabase } from "@/lib/mongodb";
import AdvanceRequestModel from "@/models/AdvanceRequest";

export const metadata: Metadata = {
  title: "Advance Requests",
};

export default async function AdvanceRequestPage() {
  await connectToDatabase();

  const requests = await AdvanceRequestModel.find({})
    .sort({ requestDate: -1 })
    .lean();

  const serializedRequests = requests.map((req) => ({
    _id: req._id?.toString() || "",
    employeeId: req.employeeId?.toString() || "",
    employeeName: req.employeeName || "",
    zone: req.zone || "",
    division: req.division || "",
    requestDate: req.requestDate?.toISOString() || "",
    advanceAmount: req.advanceAmount || 0,
    reason: req.reason || "",
    hasInstallment: req.hasInstallment || false,
    installmentPerMonth: req.installmentPerMonth || 0,
    numberOfMonths: req.numberOfMonths || 0,
    status: req.status || "pending",
    reviewedBy: req.reviewedBy || null,
    reviewedAt: req.reviewedAt?.toISOString() || null,
    rejectionReason: req.rejectionReason || "",
    createdAt: req.createdAt?.toISOString() || "",
  }));

  return <AdvanceRequestClient requests={serializedRequests} />;
}

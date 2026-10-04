import type { Registration } from "@/models/Registration";
import type { RegistrationRecord } from "@/types/registration";

type LeanRegistration = Registration & { _id: { toString(): string } };

export function serializeRegistration(doc: LeanRegistration): RegistrationRecord {
  return {
    _id: doc._id.toString(),
    doctorId: doc.doctorId,
    doctorName: doc.doctorName,
    doctorAddress: doc.doctorAddress ?? undefined,
    doctorQualification: doc.doctorQualification ?? undefined,
    registrationNumber: doc.registrationNumber,
    mobileNumber: doc.mobileNumber ?? undefined,
    hospitalName: doc.hospitalName ?? undefined,
    hospitalAddress: doc.hospitalAddress ?? undefined,
    doctorPanNumber: doc.doctorPanNumber ?? undefined,
    bankDetails: {
      bankName: doc.bankDetails?.bankName ?? "",
      accountNumber: doc.bankDetails?.accountNumber ?? "",
      ifscCode: doc.bankDetails?.ifscCode ?? "",
      branchName: doc.bankDetails?.branchName ?? "",
    },
    status: (doc.status ?? "pending") as RegistrationRecord["status"],
    requestedBy: doc.requestedBy ?? undefined,
    reviewedBy: doc.reviewedBy ?? undefined,
    reviewedAt: doc.reviewedAt ?? null,
    createdAt: doc.createdAt,
  };
}

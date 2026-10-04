export type RegistrationRecord = {
  _id: string;
  doctorId: string;
  doctorName: string;
  doctorAddress?: string;
  doctorQualification?: string;
  registrationNumber: string;
  mobileNumber?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  doctorPanNumber?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
  };
  status: "pending" | "approved" | "rejected";
  requestedBy?: { username?: string | null; name?: string | null };
  reviewedBy?: { username?: string | null; name?: string | null };
  reviewedAt?: Date | string | null;
  createdAt?: Date | string;
};

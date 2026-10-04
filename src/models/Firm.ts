import mongoose, { Schema, type InferSchemaType } from "mongoose";

const firmSchema = new Schema(
  {
    firmCode: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    firmType: { type: String, trim: true },
    firmCategory: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    contactNo: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },

    city: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    zone: { type: String, trim: true },
    division: { type: String, trim: true },
    additionalDivisions: { type: [String], default: [] },
    address: { type: String, trim: true },
    pincode: { type: String, trim: true },

    assignedEmployees: { type: [String], default: [] },
    firstLevelManager: { type: String, trim: true },
    secondLevelManager: { type: String, trim: true },
    thirdLevelManager: { type: String, trim: true },

    dateOfBirth: { type: String, trim: true },
    approxBusiness: { type: String, trim: true },
    transportType: { type: String, trim: true },
    distributorCode: { type: String, trim: true },
    stockistCode: { type: String, trim: true },
    customerCode: { type: String, trim: true },

    // KYC
    gstin: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    drugLicenseNumber: { type: String, trim: true },
    foodLicenseNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    branchName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifsc: { type: String, trim: true },

    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

firmSchema.index({ name: 1 });

export type Firm = InferSchemaType<typeof firmSchema>;

export default mongoose.models.Firm || mongoose.model("Firm", firmSchema);

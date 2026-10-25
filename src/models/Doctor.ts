import mongoose, { Schema, type InferSchemaType } from "mongoose";

const doctorSchema = new Schema(
  {
    doctorCode: { type: String, trim: true },
    uinId: { type: String, trim: true, unique: true, sparse: true }, // MH001, MH002, etc.
    prefix: { type: String, trim: true, default: "Dr" },
    name: { type: String, required: true, trim: true },
    hospitalName: { type: String, trim: true },
    hospitalAddress: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    contactNo: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    dateOfBirth: { type: String, trim: true },
    anniversary: { type: String, trim: true },
    maritalStatus: { type: String, trim: true },
    qualification: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },

    state: { type: String, trim: true },
    district: { type: String, trim: true },
    city: { type: String, trim: true },
    pincode: { type: String, trim: true },
    clinicAddress: { type: String, trim: true },

    // Location for Racer app
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },

    // Bank details
    bankDetails: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      branchName: { type: String, trim: true },
    },

    // Document uploads (stored as base64 or file paths)
    documents: { type: [String], default: [] },

    division: { type: String, trim: true },
    zone: { type: String, trim: true },
    speciality: { type: String, trim: true },
    category: { type: String, enum: ["Important", "Super Important", "A", ""], default: "" },
    doctorType: { type: String, trim: true },
    approxBusiness: { type: String, trim: true },

    assignedEmployees: { type: [String], default: [] },
    firms: { type: [String], default: [] },

    // Approval workflow for Racer app doctors
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", ""],
      default: ""
    },
    approvedBy: { username: String, name: String },
    approvedAt: { type: Date },
    source: { type: String, enum: ["web", "racer", "survey", ""], default: "" }, // Track where doctor was added

    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

doctorSchema.index({ name: 1 });
doctorSchema.index({ doctorCode: 1 });
doctorSchema.index({ uinId: 1 });

export type Doctor = InferSchemaType<typeof doctorSchema>;

export default mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);

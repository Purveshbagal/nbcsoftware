import mongoose, { Schema, type InferSchemaType } from "mongoose";

const registrationSchema = new Schema(
  {
    doctorId: { type: String, required: true, unique: true },
    doctorName: { type: String, required: true, trim: true },
    doctorAddress: { type: String, trim: true },
    doctorQualification: { type: String, trim: true },
    registrationNumber: { type: String, required: true, trim: true },
    mobileNumber: { type: String, trim: true },
    hospitalName: { type: String, trim: true },
    hospitalAddress: { type: String, trim: true },
    doctorPanNumber: { type: String, trim: true },
    bankDetails: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      branchName: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requestedBy: {
      username: { type: String, required: true },
      name: { type: String, required: true },
    },
    reviewedBy: {
      username: { type: String },
      name: { type: String },
    },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export type Registration = InferSchemaType<typeof registrationSchema>;

export default mongoose.models.Registration ||
  mongoose.model("Registration", registrationSchema);

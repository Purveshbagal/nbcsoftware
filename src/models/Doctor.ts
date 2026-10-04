import mongoose, { Schema, type InferSchemaType } from "mongoose";

const doctorSchema = new Schema(
  {
    doctorCode: { type: String, trim: true },
    prefix: { type: String, trim: true, default: "Dr" },
    name: { type: String, required: true, trim: true },
    hospitalName: { type: String, trim: true },
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

    division: { type: String, trim: true },
    zone: { type: String, trim: true },
    speciality: { type: String, trim: true },
    category: { type: String, trim: true },
    doctorType: { type: String, trim: true },
    approxBusiness: { type: String, trim: true },

    assignedEmployees: { type: [String], default: [] },
    firms: { type: [String], default: [] },

    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

doctorSchema.index({ name: 1 });
doctorSchema.index({ doctorCode: 1 });

export type Doctor = InferSchemaType<typeof doctorSchema>;

export default mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);

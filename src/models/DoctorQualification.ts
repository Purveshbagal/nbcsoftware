import mongoose, { Schema, type InferSchemaType } from "mongoose";

const doctorQualificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

doctorQualificationSchema.index({ name: 1 });

export type DoctorQualification = InferSchemaType<typeof doctorQualificationSchema>;

export default mongoose.models.DoctorQualification ||
  mongoose.model("DoctorQualification", doctorQualificationSchema);

import mongoose, { Schema, type InferSchemaType } from "mongoose";

const doctorSpecialitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

doctorSpecialitySchema.index({ name: 1 });

export type DoctorSpeciality = InferSchemaType<typeof doctorSpecialitySchema>;

export default mongoose.models.DoctorSpeciality ||
  mongoose.model("DoctorSpeciality", doctorSpecialitySchema);

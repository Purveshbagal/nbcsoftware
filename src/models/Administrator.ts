import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Back-office users of the field-force workspace. Sign-in credentials still
 * live on the User model; this records who they are and what they cover.
 */
const administratorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    contactNo: { type: String, trim: true },
    city: { type: String, trim: true },
    division: { type: String, trim: true },
    zone: { type: String, trim: true },
    adminType: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

export type Administrator = InferSchemaType<typeof administratorSchema>;

export default mongoose.models.Administrator ||
  mongoose.model("Administrator", administratorSchema);

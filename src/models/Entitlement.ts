import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** How much leave of each type an employee or designation is entitled to. */
const entitlementSchema = new Schema(
  {
    employeeName: { type: String, trim: true },
    designation: { type: String, trim: true },
    leaveType: { type: String, required: true, trim: true },
    year: { type: String, trim: true },
    entitledDays: { type: Number, default: 0 },
    carryForward: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

export type Entitlement = InferSchemaType<typeof entitlementSchema>;

export default mongoose.models.Entitlement ||
  mongoose.model("Entitlement", entitlementSchema);

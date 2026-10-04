import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Per-month submission and approval deadlines, and whether the month is
 * locked. `scope` keeps the expense and stock calendars in one collection.
 */
const monthMaintenanceSchema = new Schema(
  {
    scope: { type: String, enum: ["expense", "stock"], required: true },
    month: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    submitDeadline: { type: String, trim: true },
    approvalDeadline: { type: String, trim: true },
    isLocked: { type: Boolean, default: false },
    hiddenForEmployee: { type: Boolean, default: false },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

monthMaintenanceSchema.index({ scope: 1, year: 1, month: 1 }, { unique: true });

export type MonthMaintenance = InferSchemaType<typeof monthMaintenanceSchema>;

export default mongoose.models.MonthMaintenance ||
  mongoose.model("MonthMaintenance", monthMaintenanceSchema);

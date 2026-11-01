import mongoose, { Schema, type InferSchemaType } from "mongoose";

const paidLeaveBalanceSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeCode: { type: String, required: true },
    employeeName: { type: String, required: true },
    year: { type: Number, required: true }, // 2024, 2025, etc.
    totalAllowed: { type: Number, default: 12 }, // 12 days per year
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 12 },
  },
  { timestamps: true }
);

paidLeaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

export type PaidLeaveBalance = InferSchemaType<typeof paidLeaveBalanceSchema>;

export default mongoose.models.PaidLeaveBalance || mongoose.model("PaidLeaveBalance", paidLeaveBalanceSchema);

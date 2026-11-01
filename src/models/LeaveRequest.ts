import mongoose, { Schema, type InferSchemaType } from "mongoose";

const leaveRequestSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeCode: { type: String, required: true },
    employeeName: { type: String, required: true },
    leaveType: { type: String, enum: ["leave", "paid_leave"], required: true },
    fromDate: { type: String, required: true }, // YYYY-MM-DD
    toDate: { type: String, required: true }, // YYYY-MM-DD
    totalDays: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { username: { type: String }, name: { type: String } },
    reviewedAt: { type: Date },
    reviewRemarks: { type: String },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ employeeId: 1, status: 1 });
leaveRequestSchema.index({ status: 1 });
leaveRequestSchema.index({ fromDate: 1 });

export type LeaveRequest = InferSchemaType<typeof leaveRequestSchema>;

export default mongoose.models.LeaveRequest || mongoose.model("LeaveRequest", leaveRequestSchema);

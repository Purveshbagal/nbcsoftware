import mongoose, { Schema, type InferSchemaType } from "mongoose";

const leaveSchema = new Schema(
  {
    employeeName: { type: String, required: true, trim: true },
    zone: { type: String, trim: true },
    leaveType: { type: String, trim: true },
    reason: { type: String, trim: true },
    fromDate: { type: String, required: true, trim: true },
    toDate: { type: String, required: true, trim: true },
    days: { type: Number, default: 1 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: String, trim: true },
    reviewedAt: { type: Date },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

leaveSchema.index({ fromDate: -1 });

export type Leave = InferSchemaType<typeof leaveSchema>;

export default mongoose.models.Leave || mongoose.model("Leave", leaveSchema);

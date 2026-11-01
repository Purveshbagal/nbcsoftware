import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Advance Request
 * Employee requests advance salary from mobile app
 */
const advanceRequestSchema = new Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeName: { type: String, required: true, trim: true },
    zone: { type: String, trim: true },
    division: { type: String, trim: true },

    // Request details
    requestDate: { type: Date, required: true },
    advanceAmount: { type: Number, required: true },
    reason: { type: String, trim: true },

    // Installment details
    hasInstallment: { type: Boolean, default: false },
    installmentPerMonth: { type: Number, default: 0 },
    numberOfMonths: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      username: { type: String, trim: true },
      name: { type: String, trim: true },
    },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

// Indexes
advanceRequestSchema.index({ employeeId: 1, requestDate: -1 });
advanceRequestSchema.index({ status: 1 });

export type AdvanceRequest = InferSchemaType<typeof advanceRequestSchema>;

const AdvanceRequestModel =
  mongoose.models.AdvanceRequest || mongoose.model("AdvanceRequest", advanceRequestSchema);

export default AdvanceRequestModel;

import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Expense Request
 * Employee requests for additional expenses (non-travel)
 * Example: Food, hotel, taxi fare, etc.
 */
const expenseRequestSchema = new Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeName: { type: String, required: true, trim: true },
    zone: { type: String, trim: true },
    division: { type: String, trim: true },

    // Request details
    requestDate: { type: Date, required: true },
    expenseType: { type: String, required: true, trim: true }, // Food, Hotel, Taxi, Other
    amount: { type: Number, required: true },
    description: { type: String, trim: true },
    remarks: { type: String, trim: true },

    // Attachment
    attachmentUrl: { type: String, trim: true }, // Bill/receipt image

    // Status
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
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
expenseRequestSchema.index({ employeeId: 1, requestDate: -1 });
expenseRequestSchema.index({ status: 1 });
expenseRequestSchema.index({ employeeName: 1 });

export type ExpenseRequest = InferSchemaType<typeof expenseRequestSchema>;

const ExpenseRequestModel =
  mongoose.models.ExpenseRequest || mongoose.model("ExpenseRequest", expenseRequestSchema);

export default ExpenseRequestModel;

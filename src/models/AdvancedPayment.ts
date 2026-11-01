import mongoose, { Schema, type InferSchemaType } from "mongoose";

const installmentSchema = new Schema({
  month: { type: String, required: true }, // YYYY-MM
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "deducted", "passed", "skipped"], default: "pending" },
  deductedOn: { type: String }, // YYYY-MM-DD
  addedToNextMonth: { type: Boolean, default: false },
}, { _id: true });

const advancedPaymentSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeCode: { type: String, required: true },
    employeeName: { type: String, required: true },
    advanceAmount: { type: Number, required: true },
    paymentType: { type: String, enum: ["one_time", "installment"], required: true },
    installmentAmount: { type: Number },
    installmentFromMonth: { type: String }, // YYYY-MM
    deductFromMonth: { type: String }, // For one_time payment
    installments: [installmentSchema],
    totalDeducted: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    status: { type: String, enum: ["active", "completed", "closed"], default: "active" },
    givenDate: { type: String, required: true }, // YYYY-MM-DD
    givenBy: { username: { type: String }, name: { type: String } },
    closedDate: { type: String },
    closedBy: { username: { type: String }, name: { type: String } },
  },
  { timestamps: true }
);

advancedPaymentSchema.index({ employeeId: 1 });
advancedPaymentSchema.index({ status: 1 });
advancedPaymentSchema.index({ givenDate: 1 });

export type AdvancedPayment = InferSchemaType<typeof advancedPaymentSchema>;

export default mongoose.models.AdvancedPayment || mongoose.model("AdvancedPayment", advancedPaymentSchema);

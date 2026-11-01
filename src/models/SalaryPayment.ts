import mongoose, { Schema, type InferSchemaType } from "mongoose";

const salaryPaymentSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeCode: { type: String, required: true },
    employeeName: { type: String, required: true },
    month: { type: String, required: true }, // YYYY-MM
    salaryAmount: { type: Number, required: true },
    presentDays: { type: Number, required: true },
    absentDays: { type: Number, required: true },
    paidLeaveDays: { type: Number, default: 0 },
    totalWorkingDays: { type: Number, required: true },
    absentDeduction: { type: Number, default: 0 },
    advanceDeduction: { type: Number, default: 0 },
    netPayable: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    paymentDate: { type: String, required: true }, // YYYY-MM-DD
    paymentMode: { type: String, default: "cash" },
    remarks: { type: String },
    paidBy: { username: { type: String }, name: { type: String } },
  },
  { timestamps: true }
);

salaryPaymentSchema.index({ employeeId: 1, month: 1 });
salaryPaymentSchema.index({ month: 1 });
salaryPaymentSchema.index({ paymentDate: 1 });

export type SalaryPayment = InferSchemaType<typeof salaryPaymentSchema>;

export default mongoose.models.SalaryPayment || mongoose.model("SalaryPayment", salaryPaymentSchema);

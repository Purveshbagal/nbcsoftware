import mongoose, { Schema, type InferSchemaType } from "mongoose";

const employeeSalarySchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeCode: { type: String, required: true },
    employeeName: { type: String, required: true },
    salaryAmount: { type: Number, required: true, default: 0 },
    effectiveFrom: { type: String }, // Date in YYYY-MM-DD format
    updatedBy: { username: { type: String }, name: { type: String } },
  },
  { timestamps: true }
);

employeeSalarySchema.index({ employeeId: 1 }, { unique: true });
employeeSalarySchema.index({ employeeCode: 1 });

export type EmployeeSalary = InferSchemaType<typeof employeeSalarySchema>;

export default mongoose.models.EmployeeSalary || mongoose.model("EmployeeSalary", employeeSalarySchema);

import mongoose, { Schema, type InferSchemaType } from "mongoose";

const employeeAttendanceSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeCode: { type: String, required: true },
    employeeName: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    month: { type: String, required: true }, // YYYY-MM for filtering
    status: { type: String, enum: ["present", "absent", "paid_leave"], required: true },
    punchInTime: { type: Date },
    punchOutTime: { type: Date },
    hoursWorked: { type: Number, default: 0 },
    absentReason: { type: String },
    leaveRequestId: { type: Schema.Types.ObjectId, ref: "LeaveRequest" },
  },
  { timestamps: true }
);

employeeAttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
employeeAttendanceSchema.index({ month: 1 });
employeeAttendanceSchema.index({ employeeCode: 1 });

export type EmployeeAttendance = InferSchemaType<typeof employeeAttendanceSchema>;

export default mongoose.models.EmployeeAttendance || mongoose.model("EmployeeAttendance", employeeAttendanceSchema);

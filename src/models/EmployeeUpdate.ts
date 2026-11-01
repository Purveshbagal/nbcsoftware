import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Employee daily work updates from mobile app
 * Employees can post unlimited updates throughout the day
 */
const employeeUpdateSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeName: { type: String, required: true, trim: true },
    employeeUsername: { type: String, trim: true },

    updateText: { type: String, required: true, trim: true },

    // Auto-captured metadata
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    deviceInfo: { type: String, trim: true },

    // Date for filtering
    updateDate: { type: String, required: true }, // YYYY-MM-DD format for easy filtering
  },
  { timestamps: true } // createdAt will have exact time of update
);

// Indexes for efficient queries
employeeUpdateSchema.index({ employeeId: 1, createdAt: -1 });
employeeUpdateSchema.index({ updateDate: -1, createdAt: -1 });
employeeUpdateSchema.index({ createdAt: -1 });

export type EmployeeUpdate = InferSchemaType<typeof employeeUpdateSchema>;

export default mongoose.models.EmployeeUpdate || mongoose.model("EmployeeUpdate", employeeUpdateSchema);

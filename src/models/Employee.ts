import mongoose, { Schema, type InferSchemaType } from "mongoose";

const employeeSchema = new Schema(
  {
    code: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    contactNo: { type: String, trim: true },
    workType: { type: String, trim: true },
    assignTo: { type: String, trim: true },

    city: { type: String, trim: true },
    state: { type: String, trim: true },
    address: { type: String, trim: true },
    division: { type: String, trim: true },
    zone: { type: String, trim: true },
    designation: { type: String, trim: true },
    /** Name of the immediate senior — the "See Hierarchy" view walks this field. */
    reportingTo: { type: String, trim: true },

    dateOfBirth: { type: String, trim: true },
    dateOfJoin: { type: String, trim: true },
    dateOfResignation: { type: String, trim: true },
    inactiveDate: { type: String, trim: true },
    inactiveReason: { type: String, trim: true },

    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

employeeSchema.index({ name: 1 });

export type Employee = InferSchemaType<typeof employeeSchema>;

export default mongoose.models.Employee || mongoose.model("Employee", employeeSchema);

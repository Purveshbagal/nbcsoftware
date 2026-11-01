import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Daily Employee Expense (Travel)
 * Automatically created when employee punches in with work plan
 */
const expenseSchema = new Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeName: { type: String, required: true, trim: true },
    zone: { type: String, trim: true },
    division: { type: String, trim: true },
    designation: { type: String, trim: true },

    // Date
    expenseDate: { type: Date, required: true },

    // Work Plan (selected during punch in)
    workPlan: {
      type: String,
      enum: ["headquarter", "in-city", "outstation"],
      required: true,
    },

    // Route (only for outstation)
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "ExpenseRoute" },
    fromTaluka: { type: String, trim: true },
    fromDistrict: { type: String, trim: true },
    toTaluka: { type: String, trim: true },
    toDistrict: { type: String, trim: true },
    distanceKm: { type: Number },

    // Travel Mode (selected by employee)
    travelMode: {
      type: String,
      enum: ["bike", "car", "public-transport"],
    },

    // Manual fare (only for public transport)
    manualFare: { type: Number },

    // Arrival tracking (only for outstation)
    arrivalStatus: {
      type: String,
      enum: ["not-arrived", "arrived"],
      default: "not-arrived",
    },
    arrivedAt: { type: Date },
    arrivalLocation: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String, trim: true },
      area: { type: String, trim: true },
      village: { type: String, trim: true },
      district: { type: String, trim: true },
    },
    travelTimeMinutes: { type: Number }, // From punch in to arrival

    // Calculated amounts
    travelAllowance: { type: Number, default: 0 }, // Based on mode + distance
    workPlanAllowance: { type: Number, default: 0 }, // Headquarter/InCity/Outstation fixed
    requestedExpenses: { type: Number, default: 0 }, // Sum of accepted expense requests
    totalAmount: { type: Number, default: 0 }, // Sum of all allowances

    // Payment tracking
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    paidAmount: { type: Number, default: 0 },
    paidAt: { type: Date },
    paidBy: {
      username: { type: String, trim: true },
      name: { type: String, trim: true },
    },

    // Punch in reference
    attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Attendance" },
    punchedInAt: { type: Date },

    // Metadata
    remarks: { type: String, trim: true },
    createdBy: { username: { type: String }, name: { type: String } },
  },
  { timestamps: true }
);

// Indexes
expenseSchema.index({ employeeId: 1, expenseDate: -1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ workPlan: 1 });
expenseSchema.index({ arrivalStatus: 1 });
expenseSchema.index({ paymentStatus: 1 });
expenseSchema.index({ employeeName: 1 });

export type Expense = InferSchemaType<typeof expenseSchema>;

export default mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

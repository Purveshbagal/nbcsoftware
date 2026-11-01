import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Expense Allowance Settings
 * Stores per km rates for different travel modes and fixed allowances for work types
 */
const expenseAllowanceSchema = new Schema(
  {
    // Mode Section - Per km rates
    bikePerKm: { type: Number, default: 0 },
    carPerKm: { type: Number, default: 0 },
    publicTransportPerKm: { type: Number, default: 0 }, // Manual amount option available

    // Other Allowances Section - Fixed daily amounts
    headquarterAllowance: { type: Number, default: 0 },
    inCityAllowance: { type: Number, default: 0 },
    outstationAllowance: { type: Number, default: 0 },

    // Metadata
    updatedBy: {
      username: { type: String, trim: true },
      name: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

export type ExpenseAllowance = InferSchemaType<typeof expenseAllowanceSchema>;

const ExpenseAllowanceModel =
  mongoose.models.ExpenseAllowance ||
  mongoose.model("ExpenseAllowance", expenseAllowanceSchema);

export default ExpenseAllowanceModel;

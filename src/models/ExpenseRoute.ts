import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Expense Route
 * Predefined routes with from-to talukas and distances
 */
const expenseRouteSchema = new Schema(
  {
    fromTaluka: { type: String, required: true, trim: true },
    fromDistrict: { type: String, required: true, trim: true }, // For display
    toTaluka: { type: String, required: true, trim: true },
    toDistrict: { type: String, required: true, trim: true }, // For display
    distanceKm: { type: Number, required: true },

    // Metadata
    createdBy: {
      username: { type: String, trim: true },
      name: { type: String, trim: true },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for quick lookups
expenseRouteSchema.index({ fromTaluka: 1, toTaluka: 1 });
expenseRouteSchema.index({ isActive: 1 });

export type ExpenseRoute = InferSchemaType<typeof expenseRouteSchema>;

const ExpenseRouteModel =
  mongoose.models.ExpenseRoute || mongoose.model("ExpenseRoute", expenseRouteSchema);

export default ExpenseRouteModel;

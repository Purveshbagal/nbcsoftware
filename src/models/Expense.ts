import mongoose, { Schema, type InferSchemaType } from "mongoose";

const expenseSchema = new Schema(
  {
    employeeName: { type: String, required: true, trim: true },
    zone: { type: String, trim: true },
    division: { type: String, trim: true },
    expenseDate: { type: String, required: true, trim: true },

    head: { type: String, trim: true },
    modeOfTravel: { type: String, trim: true },
    fromCity: { type: String, trim: true },
    toCity: { type: String, trim: true },
    distanceKm: { type: Number },
    fare: { type: Number },
    otherAmount: { type: Number },
    remarks: { type: String, trim: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: String, trim: true },
    reviewedAt: { type: Date },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ status: 1 });

export type Expense = InferSchemaType<typeof expenseSchema>;

export default mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

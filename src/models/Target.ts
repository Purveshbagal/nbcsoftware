import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * One row per target tab. `targetType` picks the tab and `subject` holds
 * whatever that tab targets — an HQ, a product, a doctor, a firm or a group.
 */
const targetSchema = new Schema(
  {
    targetType: {
      type: String,
      enum: ["employee", "hq", "product", "doctor", "firm", "product-group", "yearly"],
      required: true,
    },
    subject: { type: String, trim: true },
    employeeName: { type: String, trim: true },
    frequency: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      default: "monthly",
    },
    month: { type: String, trim: true },
    quarter: { type: String, trim: true },
    year: { type: String, trim: true },

    pobValue: { type: Number },
    secondarySales: { type: Number },
    doctorVisits: { type: Number },
    chemistVisits: { type: Number },
    newDoctorAddition: { type: Number },
    newChemistAddition: { type: Number },
    primarySalesValue: { type: Number },
    primarySalesQty: { type: Number },

    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

targetSchema.index({ targetType: 1, year: 1, month: 1 });

export type Target = InferSchemaType<typeof targetSchema>;

export default mongoose.models.Target || mongoose.model("Target", targetSchema);

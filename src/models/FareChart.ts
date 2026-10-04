import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** A standard fare chart route, and the SFC approval queue it feeds. */
const fareChartSchema = new Schema(
  {
    routeName: { type: String, required: true, trim: true },
    citiesInRoute: { type: String, trim: true },
    zone: { type: String, trim: true },
    division: { type: String, trim: true },
    routeFor: { type: String, trim: true },
    designation: { type: String, trim: true },
    mode: { type: String, trim: true },
    distanceKm: { type: Number },
    fare: { type: Number },
    isApproved: { type: Boolean, default: false },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

export type FareChart = InferSchemaType<typeof fareChartSchema>;

export default mongoose.models.FareChart || mongoose.model("FareChart", fareChartSchema);

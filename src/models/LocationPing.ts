import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * A single GPS fix sent by the NBC Labs mobile app while the employee is on
 * duty. The admin map draws a day's pings as the route the employee took.
 */
const locationPingSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    /** India-time calendar day, so a day's trail is one indexed lookup. */
    date: { type: String, required: true },
    at: { type: Date, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number },
    speed: { type: Number },
    battery: { type: Number },
  },
  { timestamps: false }
);

locationPingSchema.index({ employeeId: 1, date: 1, at: 1 });
// Trails older than 180 days are dropped automatically.
locationPingSchema.index({ at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export type LocationPing = InferSchemaType<typeof locationPingSchema>;

export default mongoose.models.LocationPing ||
  mongoose.model("LocationPing", locationPingSchema);

import mongoose, { Schema, type InferSchemaType } from "mongoose";

const holidaySchema = new Schema(
  {
    calendarType: {
      type: String,
      enum: ["holiday", "work", "restricted"],
      default: "holiday",
    },
    zone: { type: String, trim: true },
    /** Only the work calendar is per-employee; holidays apply to a whole zone. */
    employeeName: { type: String, trim: true },
    date: { type: String, required: true, trim: true },
    occasion: { type: String, trim: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

holidaySchema.index({ calendarType: 1, date: 1 });

export type Holiday = InferSchemaType<typeof holidaySchema>;

export default mongoose.models.Holiday || mongoose.model("Holiday", holidaySchema);

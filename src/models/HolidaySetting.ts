import mongoose, { Schema, Document } from "mongoose";

export interface IHolidaySetting extends Document {
  sundayIsWorkingDay: boolean;
  holidays: Array<{
    name: string;
    date: string; // YYYY-MM-DD
    enabled: boolean;
    autoFetch: boolean; // Auto-fetch from Google Calendar
  }>;
  lastFetchedAt?: Date;
  updatedBy?: {
    username: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const holidaySettingSchema = new Schema<IHolidaySetting>(
  {
    sundayIsWorkingDay: {
      type: Boolean,
      default: false,
    },
    holidays: [
      {
        name: { type: String, required: true },
        date: { type: String, required: true }, // YYYY-MM-DD
        enabled: { type: Boolean, default: true },
        autoFetch: { type: Boolean, default: true }, // Auto-fetch from Google
      },
    ],
    lastFetchedAt: { type: Date },
    updatedBy: {
      username: { type: String },
      name: { type: String },
    },
  },
  { timestamps: true }
);

const HolidaySettingModel =
  mongoose.models.HolidaySetting ||
  mongoose.model<IHolidaySetting>("HolidaySetting", holidaySettingSchema);

export default HolidaySettingModel;

import mongoose, { Schema, type InferSchemaType } from "mongoose";

const punchSchema = new Schema(
  {
    at: { type: Date },
    lat: { type: Number },
    lng: { type: Number },
    accuracy: { type: Number },
    note: { type: String, trim: true },
  },
  { _id: false }
);

/**
 * One row per employee per day, written by the NBC Labs mobile app when the
 * employee punches in and out. `date` is the India-time calendar day.
 */
const attendanceSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeName: { type: String, trim: true },
    zone: { type: String, trim: true },
    division: { type: String, trim: true },
    date: { type: String, required: true, trim: true },

    workAgenda: { type: String, trim: true },
    punchIn: { type: punchSchema },
    punchOut: { type: punchSchema },
    /** Filled on punch-out. */
    workingMinutes: { type: Number, default: 0 },
    /** Ground covered between punch-in and punch-out, from the location trail. */
    distanceKm: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["present", "half-day", "absent"],
      default: "present",
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });

export type Attendance = InferSchemaType<typeof attendanceSchema>;

export default mongoose.models.Attendance ||
  mongoose.model("Attendance", attendanceSchema);

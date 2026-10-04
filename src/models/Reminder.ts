import mongoose, { Schema, type InferSchemaType } from "mongoose";

const reminderSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    assignedTo: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: ["open", "done"], default: "open" },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

reminderSchema.index({ date: 1 });

export type Reminder = InferSchemaType<typeof reminderSchema>;

export default mongoose.models.Reminder || mongoose.model("Reminder", reminderSchema);

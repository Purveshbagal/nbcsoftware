import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Workspace-level configuration: branding, general behaviour, terminology and
 * approval routing. One document per key, grouped by `group`.
 */
const settingSchema = new Schema(
  {
    group: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true },
    value: { type: String, default: "" },
    updatedBy: { username: String, name: String },
  },
  { timestamps: true }
);

settingSchema.index({ group: 1, key: 1 }, { unique: true });

export type Setting = InferSchemaType<typeof settingSchema>;

export default mongoose.models.Setting || mongoose.model("Setting", settingSchema);

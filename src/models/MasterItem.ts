import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * One collection behind every list in Settings → Application Master.
 * `type` is the master's slug from MASTER_TYPES, so adding a master needs no
 * new model, route or page — see src/lib/workspaces.ts.
 */
const masterItemSchema = new Schema(
  {
    type: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String, trim: true },
    /** Monthly cap, fare, radius, tax percentage — whatever the master measures. */
    value: { type: Number },
    /** Free-form parent key, e.g. the zone a city belongs to. */
    parent: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: {
      username: { type: String },
      name: { type: String },
    },
  },
  { timestamps: true }
);

// Two rows of the same master may not share a name; different masters may.
masterItemSchema.index({ type: 1, name: 1 }, { unique: true });

export type MasterItem = InferSchemaType<typeof masterItemSchema>;

export default mongoose.models.MasterItem ||
  mongoose.model("MasterItem", masterItemSchema);

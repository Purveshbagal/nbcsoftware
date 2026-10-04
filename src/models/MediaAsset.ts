import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * E-detailing material. The binary itself lives wherever `url` points; this
 * records what it is and who may show it.
 */
const mediaAssetSchema = new Schema(
  {
    kind: { type: String, enum: ["presentation", "media"], default: "media" },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    url: { type: String, trim: true },
    fileType: { type: String, trim: true },
    division: { type: String, trim: true },
    campaign: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

export type MediaAsset = InferSchemaType<typeof mediaAssetSchema>;

export default mongoose.models.MediaAsset ||
  mongoose.model("MediaAsset", mediaAssetSchema);

import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * The field-force product catalogue. Separate from the registration
 * workspace's Product model, which describes a different catalogue.
 */
const sfaProductSchema = new Schema(
  {
    code: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    composition: { type: String, trim: true },
    pack: { type: String, trim: true },
    division: { type: String, trim: true },
    productGroup: { type: String, trim: true },
    indication: { type: String, trim: true },
    uom: { type: String, trim: true },
    mrp: { type: Number },
    ptr: { type: Number },
    pts: { type: Number },
    /** QR / barcode payload printed on the pack. */
    qrCode: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

sfaProductSchema.index({ name: 1 });

export type SfaProduct = InferSchemaType<typeof sfaProductSchema>;

export default mongoose.models.SfaProduct ||
  mongoose.model("SfaProduct", sfaProductSchema);

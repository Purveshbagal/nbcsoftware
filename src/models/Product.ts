import mongoose, { Schema, type InferSchemaType } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    composition: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["syrup", "tablet", "speciality"],
      required: true,
    },
    pack: { type: String, trim: true },
    specialClaim: { type: String, trim: true },
  },
  { timestamps: true }
);

export type Product = InferSchemaType<typeof productSchema>;

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);

import mongoose, { Schema, type InferSchemaType } from "mongoose";

const orderLineSchema = new Schema(
  {
    product: { type: String, trim: true },
    quantity: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNo: { type: String, trim: true },
    orderDate: { type: String, required: true, trim: true },
    firm: { type: String, trim: true },
    doctor: { type: String, trim: true },
    employeeName: { type: String, trim: true },
    zone: { type: String, trim: true },
    division: { type: String, trim: true },
    lines: { type: [orderLineSchema], default: [] },
    remarks: { type: String, trim: true },
    status: {
      type: String,
      enum: ["draft", "placed", "approved", "dispatched", "cancelled"],
      default: "placed",
    },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

orderSchema.index({ orderDate: -1 });

export type Order = InferSchemaType<typeof orderSchema>;

export default mongoose.models.Order || mongoose.model("Order", orderSchema);

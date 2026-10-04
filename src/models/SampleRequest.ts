import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** A field request for product samples or promotional gifts. */
const sampleRequestSchema = new Schema(
  {
    requestNo: { type: String, trim: true },
    requestDate: { type: String, required: true, trim: true },
    employeeName: { type: String, trim: true },
    zone: { type: String, trim: true },
    division: { type: String, trim: true },
    itemType: { type: String, enum: ["sample", "gift"], default: "sample" },
    item: { type: String, trim: true },
    quantity: { type: Number, default: 0 },
    remarks: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "denied", "dispatched"],
      default: "pending",
    },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

sampleRequestSchema.index({ requestDate: -1 });

export type SampleRequest = InferSchemaType<typeof sampleRequestSchema>;

export default mongoose.models.SampleRequest ||
  mongoose.model("SampleRequest", sampleRequestSchema);

import mongoose, { Schema, type InferSchemaType } from "mongoose";

const paymentSchema = new Schema(
  {
    doctorId: { type: String, required: true, trim: true },
    doctorName: { type: String, required: true, trim: true },
    productId: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    productComposition: { type: String, trim: true },
    amount: { type: Number, required: true },
    purpose: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requestedBy: {
      username: { type: String, required: true },
      name: { type: String, required: true },
    },
    reviewedBy: {
      username: { type: String },
      name: { type: String },
    },
    reviewedAt: { type: Date },
    surveyFormNo: { type: String },
    surveyDownloadedAt: { type: Date },
    surveyUpload: {
      data: { type: Buffer },
      mimeType: { type: String },
      uploadedAt: { type: Date },
    },
    receiptNumber: { type: String },
    transactionRefNumber: { type: String },
    tdsAmount: { type: Number },
    netAmount: { type: Number },
    paidAt: { type: Date },
    paidBy: {
      username: { type: String },
      name: { type: String },
    },
    /** Set when the field rep records handing the cash over to the doctor. */
    handedOverAt: { type: Date },
    handedOverBy: {
      username: { type: String },
      name: { type: String },
    },
  },
  { timestamps: true }
);

export type Payment = InferSchemaType<typeof paymentSchema>;

export default mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);

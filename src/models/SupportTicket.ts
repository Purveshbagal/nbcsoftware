import mongoose, { Schema, type InferSchemaType } from "mongoose";

const supportTicketSchema = new Schema(
  {
    ticketNo: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    raisedBy: { type: String, trim: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    response: { type: String, trim: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

export type SupportTicket = InferSchemaType<typeof supportTicketSchema>;

export default mongoose.models.SupportTicket ||
  mongoose.model("SupportTicket", supportTicketSchema);

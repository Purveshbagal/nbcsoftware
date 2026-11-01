import mongoose, { Schema, type InferSchemaType } from "mongoose";

const chatMessageSchema = new Schema(
  {
    // Conversation reference
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },

    // Sender can be either employee or admin
    senderType: { type: String, enum: ["employee", "admin", "system"], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId },
    senderName: { type: String, trim: true },
    senderProfilePic: { type: String, trim: true },

    // Message content
    messageType: { type: String, enum: ["text", "image"], required: true },
    text: { type: String, trim: true },
    imageUrl: { type: String, trim: true },

    // System message metadata
    isSystemMessage: { type: Boolean, default: false, index: true },
    systemMessageType: {
      type: String,
      enum: ["welcome", "birthday", "employee_added", "good_morning", "good_night"],
      trim: true,
    },
    systemMessageDate: { type: String, trim: true },
    systemMessageKey: { type: String, trim: true },

    // Metadata
    isRead: { type: Boolean, default: false },
    readBy: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

chatMessageSchema.index({ createdAt: -1 });
chatMessageSchema.index({ senderType: 1, senderId: 1 });
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });

export type ChatMessage = InferSchemaType<typeof chatMessageSchema>;

export default mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);

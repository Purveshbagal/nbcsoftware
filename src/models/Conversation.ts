import mongoose, { Document, Model, Schema } from "mongoose";

export interface IConversation extends Document {
  type: "team" | "direct";
  participants: mongoose.Types.ObjectId[]; // Employee IDs
  name?: string; // For team chat
  lastMessage?: {
    text: string;
    senderId?: mongoose.Types.ObjectId;
    senderName: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ["team", "direct"],
      required: true,
      index: true,
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "Employee",
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: "",
    },
    lastMessage: {
      text: String,
      senderId: Schema.Types.ObjectId,
      senderName: String,
      createdAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for finding direct conversations between two users
ConversationSchema.index({ type: 1, participants: 1 });

const ConversationModel: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default ConversationModel;

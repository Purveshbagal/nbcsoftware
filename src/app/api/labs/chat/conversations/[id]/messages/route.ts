import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireEmployee } from "@/lib/labs-auth";
import ChatMessageModel from "@/models/ChatMessage";
import ConversationModel from "@/models/Conversation";
import EmployeeModel from "@/models/Employee";
import { updateConversationLastMessage } from "@/lib/chat-helpers";
import mongoose from "mongoose";

// GET /api/labs/chat/conversations/[id]/messages - Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    await connectToDatabase();

    const { id: conversationId } = await params;

    // Verify employee is part of this conversation
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === auth.employee._id.toString()
    );

    if (!isParticipant) {
      return NextResponse.json({ error: "Not authorized to view this conversation" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const before = searchParams.get("before");

    const query: any = { conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      messages: messages.reverse(),
    });
  } catch (error: any) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/labs/chat/conversations/[id]/messages - Send a message to a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    await connectToDatabase();

    const { id: conversationId } = await params;

    // Verify employee is part of this conversation
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === auth.employee._id.toString()
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Not authorized to send messages to this conversation" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { messageType, text, imageUrl } = body;

    if (!messageType || !["text", "image"].includes(messageType)) {
      return NextResponse.json({ error: "Invalid message type" }, { status: 400 });
    }

    if (messageType === "text" && !text?.trim()) {
      return NextResponse.json({ error: "Text message cannot be empty" }, { status: 400 });
    }

    if (messageType === "image" && !imageUrl?.trim()) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    // Get employee details
    const employee = await EmployeeModel.findById(auth.employee._id)
      .select("name profilePicture")
      .lean();

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const message = await ChatMessageModel.create({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      senderType: "employee",
      senderId: auth.employee._id,
      senderName: employee.name,
      senderProfilePic: employee.profilePicture || "",
      messageType,
      text: messageType === "text" ? text.trim() : "",
      imageUrl: messageType === "image" ? imageUrl.trim() : "",
      isSystemMessage: false,
    });

    // Update conversation's last message
    await updateConversationLastMessage(conversationId, {
      text: messageType === "text" ? text.trim() : "📷 Image",
      senderId: auth.employee._id,
      senderName: employee.name,
      createdAt: message.createdAt,
    });

    return NextResponse.json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error: any) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

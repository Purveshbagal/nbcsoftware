import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireEmployee } from "@/lib/labs-auth";
import ChatMessageModel from "@/models/ChatMessage";
import EmployeeModel from "@/models/Employee";
import { getOrCreateTeamChat } from "@/lib/chat-helpers";

// GET /api/labs/chat/messages - Get all chat messages
// This route now returns team chat messages
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    await connectToDatabase();

    // Get or create team chat
    const teamChat = await getOrCreateTeamChat();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const before = searchParams.get("before"); // ISO timestamp for pagination

    const query: any = { conversationId: teamChat._id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      messages: messages.reverse(), // Return in chronological order
    });
  } catch (error: any) {
    console.error("Failed to fetch chat messages:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 });
  }
}

// POST /api/labs/chat/messages - Send a new message
// This route now sends to team chat
export async function POST(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    await connectToDatabase();

    // Get or create team chat
    const teamChat = await getOrCreateTeamChat();

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
      conversationId: teamChat._id,
      senderType: "employee",
      senderId: auth.employee._id,
      senderName: employee.name,
      senderProfilePic: employee.profilePicture || "",
      messageType,
      text: messageType === "text" ? text.trim() : "",
      imageUrl: messageType === "image" ? imageUrl.trim() : "",
      isSystemMessage: false,
    });

    // Update last message in conversation
    teamChat.lastMessage = {
      text: messageType === "text" ? text.trim() : "📷 Image",
      senderId: auth.employee._id,
      senderName: employee.name,
      createdAt: message.createdAt,
    };
    await teamChat.save();

    return NextResponse.json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error: any) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}

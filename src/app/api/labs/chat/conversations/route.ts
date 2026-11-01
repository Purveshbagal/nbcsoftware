import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireEmployee } from "@/lib/labs-auth";
import ConversationModel from "@/models/Conversation";
import EmployeeModel from "@/models/Employee";
import { getOrCreateTeamChat, getOrCreateDirectConversation } from "@/lib/chat-helpers";

// GET /api/labs/chat/conversations - Get all conversations for an employee
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    await connectToDatabase();

    // Get all conversations where employee is a participant
    const conversations = await ConversationModel.find({
      participants: auth.employee._id,
    })
      .sort({ "lastMessage.createdAt": -1 })
      .lean();

    // For each conversation, populate participant details
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        if (conv.type === "team") {
          return {
            ...conv,
            displayName: "Team Chat",
            displayImage: null,
            isTeamChat: true,
          };
        } else {
          // Direct conversation - get the other participant's details
          const otherParticipantId = conv.participants.find(
            (p) => p.toString() !== auth.employee._id.toString()
          );

          const otherEmployee = await EmployeeModel.findById(otherParticipantId)
            .select("name profilePicture")
            .lean();

          return {
            ...conv,
            displayName: otherEmployee?.name || "Unknown",
            displayImage: otherEmployee?.profilePicture || null,
            isTeamChat: false,
          };
        }
      })
    );

    return NextResponse.json({
      conversations: conversationsWithDetails,
    });
  } catch (error: any) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/labs/chat/conversations - Create or get a conversation
export async function POST(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    await connectToDatabase();

    const body = await request.json();
    const { type, otherEmployeeId } = body;

    let conversation;

    if (type === "team") {
      conversation = await getOrCreateTeamChat();
    } else if (type === "direct" && otherEmployeeId) {
      conversation = await getOrCreateDirectConversation(
        auth.employee._id,
        otherEmployeeId
      );
    } else {
      return NextResponse.json(
        { error: "Invalid conversation type or missing employee ID" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      conversation,
    });
  } catch (error: any) {
    console.error("Failed to create conversation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create conversation" },
      { status: 500 }
    );
  }
}

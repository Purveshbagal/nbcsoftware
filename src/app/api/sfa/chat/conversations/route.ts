import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-auth";
import ConversationModel from "@/models/Conversation";
import EmployeeModel from "@/models/Employee";
import { getOrCreateTeamChat } from "@/lib/chat-helpers";

// GET /api/sfa/chat/conversations - Get all conversations for admin
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    await connectToDatabase();

    // Get team chat
    const teamChat = await getOrCreateTeamChat();

    // Admins can start a direct chat with any employee, including inactive employees.
    const employees = await EmployeeModel.find({})
      .select("_id name profilePicture designation")
      .sort({ name: 1 })
      .lean();

    // Get all direct conversations (if any exist)
    const directConversations = await ConversationModel.find({
      type: "direct",
    })
      .sort({ "lastMessage.createdAt": -1 })
      .lean();

    // Format team chat
    const teamChatFormatted = {
      ...teamChat.toObject(),
      displayName: "Team Chat",
      displayImage: null,
      isTeamChat: true,
    };

    // Format direct conversations with employee details
    const directChatsFormatted = await Promise.all(
      directConversations.map(async (conv) => {
        // Get both participants
        const participants = await EmployeeModel.find({
          _id: { $in: conv.participants },
        })
          .select("_id name profilePicture")
          .lean();

        // For admin, show the employee (not admin)
        const employee = participants[0]; // Assuming first is employee

        return {
          ...conv,
          displayName: employee?.name || "Unknown",
          displayImage: employee?.profilePicture || null,
          isTeamChat: false,
          otherParticipantId: employee?._id,
        };
      })
    );

    return NextResponse.json({
      teamChat: teamChatFormatted,
      directChats: directChatsFormatted,
      employees, // All employees for starting new chats
    });
  } catch (error: any) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/sfa/chat/conversations - Create or get a conversation (admin)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    await connectToDatabase();

    const body = await request.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    let conversation = await ConversationModel.findOne({
      type: "direct",
      participants: { $size: 1, $all: [employeeId] },
    });

    if (!conversation) {
      // Create new direct conversation with just the employee
      // (Admin messages don't need admin as participant)
      conversation = await ConversationModel.create({
        type: "direct",
        participants: [employeeId],
      });
    }

    // Get employee details
    const employee = await EmployeeModel.findById(employeeId)
      .select("name profilePicture")
      .lean();

    return NextResponse.json({
      conversation: {
        ...conversation.toObject(),
        displayName: employee?.name || "Unknown",
        displayImage: employee?.profilePicture || null,
        isTeamChat: false,
      },
    });
  } catch (error: any) {
    console.error("Failed to create conversation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create conversation" },
      { status: 500 }
    );
  }
}

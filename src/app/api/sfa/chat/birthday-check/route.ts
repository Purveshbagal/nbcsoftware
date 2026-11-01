import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/sfa-auth";
import { connectToDatabase } from "@/lib/mongodb";
import {
  checkAndSendBirthdayWishes,
  createDailyTeamMessage,
} from "@/lib/chat-helpers";

// GET /api/sfa/chat/birthday-check - Trigger scheduled team chat messages
export async function GET(request: NextRequest) {
  try {
    const expectedToken = process.env.CRON_SECRET;
    if (!expectedToken) {
      console.error("CRON_SECRET is not configured");
      return NextResponse.json(
        { error: "Cron authentication is not configured" },
        { status: 503 }
      );
    }

    if (request.headers.get("authorization") !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const job = new URL(request.url).searchParams.get("job") || "birthday";
    if (job !== "morning" && job !== "night" && job !== "birthday") {
      return NextResponse.json({ error: "Invalid scheduled job" }, { status: 400 });
    }

    await connectToDatabase();

    const birthdayMessages =
      job === "morning" || job === "birthday"
        ? await checkAndSendBirthdayWishes()
        : [];
    const greeting =
      job === "morning"
        ? await createDailyTeamMessage("good_morning")
        : job === "night"
          ? await createDailyTeamMessage("good_night")
          : null;

    return NextResponse.json({
      success: true,
      birthdayWishesSent: birthdayMessages.length,
      greetingSent: Boolean(greeting),
      messages: [...birthdayMessages, ...(greeting ? [greeting] : [])].map((message) => ({
        id: message._id,
        text: message.text,
        createdAt: message.createdAt,
      })),
    });
  } catch (error: unknown) {
    console.error("Failed to send scheduled team chat messages:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send scheduled messages" },
      { status: 500 }
    );
  }
}

// POST /api/sfa/chat/birthday-check - Manually trigger birthday wishes (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    await connectToDatabase();
    const messages = await checkAndSendBirthdayWishes();

    return NextResponse.json({
      success: true,
      birthdayWishesSent: messages.length,
      messages: messages.map((message) => ({
        id: message._id,
        text: message.text,
        createdAt: message.createdAt,
      })),
    });
  } catch (error: unknown) {
    console.error("Failed to check birthdays:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check birthdays" },
      { status: 500 }
    );
  }
}

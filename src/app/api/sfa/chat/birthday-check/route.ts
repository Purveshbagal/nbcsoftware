import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { requireAdmin } from "@/lib/sfa-auth";
import { connectToDatabase } from "@/lib/mongodb";
import {
  checkAndSendBirthdayWishes,
  createDailyTeamMessage,
} from "@/lib/chat-helpers";

const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_OIDC_AUDIENCE = "https://work.nbcpedia.com/sfa-chat-scheduler";
const GITHUB_OIDC_KEYS = createRemoteJWKSet(
  new URL("https://token.actions.githubusercontent.com/.well-known/jwks")
);

async function isAuthorizedScheduledRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  try {
    const { payload } = await jwtVerify(
      authorization.slice("Bearer ".length),
      GITHUB_OIDC_KEYS,
      {
        issuer: GITHUB_OIDC_ISSUER,
        audience: GITHUB_OIDC_AUDIENCE,
      }
    );

    return (
      payload.repository === "Purveshbagal/nbcsoftware" &&
      payload.repository_owner === "Purveshbagal" &&
      payload.ref === "refs/heads/main" &&
      payload.event_name === "schedule" &&
      payload.workflow_ref ===
        "Purveshbagal/nbcsoftware/.github/workflows/team-chat-schedule.yml@refs/heads/main"
    );
  } catch {
    return false;
  }
}

// GET /api/sfa/chat/birthday-check - Trigger scheduled team chat messages
export async function GET(request: NextRequest) {
  try {
    if (!(await isAuthorizedScheduledRequest(request))) {
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

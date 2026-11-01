import { NextResponse } from "next/server";

import { getSessionFromRequest, SessionPayload } from "@/lib/auth";

/**
 * Helper for SFA API routes that require authentication.
 * Returns the session or an error response.
 */
export async function requireUser(
  request: Request
): Promise<{ session: SessionPayload; error?: never } | { error: NextResponse; session?: never }> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { session };
}

/**
 * Helper for SFA API routes that require admin role.
 * Returns the session or an error response.
 */
export async function requireAdmin(
  request: Request
): Promise<{ session: SessionPayload; error?: never } | { error: NextResponse; session?: never }> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (session.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session };
}

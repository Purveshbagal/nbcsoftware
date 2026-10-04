/**
 * Parse a JSON request body without throwing. A malformed or empty body is a
 * client mistake, so it should come back as a 400 rather than a 500.
 */
export async function readJsonBody(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

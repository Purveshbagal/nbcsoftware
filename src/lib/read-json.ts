/**
 * Parse a JSON request body without throwing. A malformed or empty body is a
 * client mistake, so it should come back as a 400 rather than a 500.
 */
export async function readJsonBody<T = Record<string, any>>(
  request: Request
): Promise<T | null> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as T;
  } catch {
    return null;
  }
}

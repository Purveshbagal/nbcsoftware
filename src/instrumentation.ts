export async function register() {
  // Only the long-running production Node server runs the daily scheduler, so
  // `next dev` and the build never post to the team chat.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { startChatScheduler } = await import("@/lib/chat-scheduler");
    startChatScheduler();
  }
}

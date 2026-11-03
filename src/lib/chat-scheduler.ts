import { connectToDatabase } from "@/lib/mongodb";
import { checkAndSendBirthdayWishes, createDailyTeamMessage } from "@/lib/chat-helpers";

/**
 * Sends the daily "Good morning" / "Good night" team chat messages at fixed
 * India times. The clock is the server's (NTP-synced) clock read in
 * Asia/Kolkata, so the time never depends on the server's own timezone.
 *
 * A message is sent in the first tick at or after its time. If the server was
 * down at that moment it is still sent when it comes back, but only within the
 * slot's catchUpMinutes, so a late restart never posts "Good morning" in the
 * afternoon. `createDailyTeamMessage` is idempotent per day and type, counting
 * only messages created since the slot's start time.
 */

const TIME_ZONE = "Asia/Kolkata";
const TICK_MS = 15_000;

const SLOTS = [
  { type: "good_morning", hour: 9, catchUpMinutes: 180 }, // until 12:00
  { type: "good_night", hour: 20, catchUpMinutes: 240 }, // until midnight
] as const;

function indiaNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const v = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    dateKey: `${v.year}-${v.month}-${v.day}`,
    minutesOfDay: Number(v.hour) * 60 + Number(v.minute),
  };
}

const done = new Set<string>();
let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    const { dateKey, minutesOfDay } = indiaNow();
    for (const slot of SLOTS) {
      const key = `${dateKey}:${slot.type}`;
      const since = minutesOfDay - slot.hour * 60;
      if (done.has(key) || since < 0 || since >= slot.catchUpMinutes) continue;

      await connectToDatabase();
      if (slot.type === "good_morning") await checkAndSendBirthdayWishes(dateKey);
      const slotStart = new Date(`${dateKey}T${String(slot.hour).padStart(2, "0")}:00:00+05:30`);
      await createDailyTeamMessage(slot.type, dateKey, slotStart);
      done.add(key);
      console.log(`[chat-scheduler] ${slot.type} handled for ${dateKey}`);
    }
    // Keep the memo small: only today's keys matter.
    for (const key of done) if (!key.startsWith(dateKey)) done.delete(key);
  } catch (error) {
    console.error("[chat-scheduler] tick failed", error);
  } finally {
    running = false;
  }
}

export function startChatScheduler() {
  const g = globalThis as { __chatSchedulerStarted?: boolean };
  if (g.__chatSchedulerStarted) return;
  g.__chatSchedulerStarted = true;
  setInterval(tick, TICK_MS).unref?.();
  void tick();
}

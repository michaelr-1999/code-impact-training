import Anthropic from "@anthropic-ai/sdk";
import prisma from "../lib/prisma";

function getTodayRange(tzOffsetMinutes: number): { startOfDay: Date; endOfDay: Date } {
  // Shift "now" into the user's local time so getUTC* gives the local date fields
  const localNow = new Date(Date.now() - tzOffsetMinutes * 60 * 1000);
  const y = localNow.getUTCFullYear();
  const mo = localNow.getUTCMonth();
  const d = localNow.getUTCDate();
  // Midnight local = UTC midnight + tzOffsetMinutes (offset is positive west of UTC)
  const startOfDay = new Date(Date.UTC(y, mo, d) + tzOffsetMinutes * 60 * 1000);
  const endOfDay = new Date(Date.UTC(y, mo, d, 23, 59, 59, 999) + tzOffsetMinutes * 60 * 1000);
  return { startOfDay, endOfDay };
}

function formatTimestamp(d: Date | string, tzOffsetMinutes: number): string {
  const local = new Date(new Date(d).getTime() - tzOffsetMinutes * 60 * 1000);
  const h = local.getUTCHours();
  const m = local.getUTCMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDateLabel(d: Date | string, tzOffsetMinutes: number): string {
  const local = new Date(new Date(d).getTime() - tzOffsetMinutes * 60 * 1000);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[local.getUTCMonth()]} ${local.getUTCDate()}`;
}

function formatLocalDate(tzOffsetMinutes: number): string {
  const local = new Date(Date.now() - tzOffsetMinutes * 60 * 1000);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${days[local.getUTCDay()]}, ${months[local.getUTCMonth()]} ${local.getUTCDate()}, ${local.getUTCFullYear()}`;
}

export async function getDashboardToday(userId: string, tzOffsetMinutes = 0) {
  const { startOfDay, endOfDay } = getTodayRange(tzOffsetMinutes);

  const [events, tasks, reminders] = await Promise.all([
    prisma.event.findMany({
      where: { userId, startTime: { lte: endOfDay }, endTime: { gte: startOfDay } },
      orderBy: { startTime: "asc" },
    }),

    prisma.task.findMany({
      where: {
        userId,
        completedAt: null,
        OR: [
          { dueDate: { gte: startOfDay, lte: endOfDay } },
          { dueDate: { lt: startOfDay } },
        ],
      },
      orderBy: { dueDate: "asc" },
    }),

    prisma.reminder.findMany({
      where: {
        userId,
        isDone: false,
        OR: [
          { scheduledTime: { gte: startOfDay, lte: endOfDay } },
          { scheduledTime: { lt: startOfDay } },
        ],
      },
      include: { category: true },
      orderBy: { scheduledTime: "asc" },
    }),
  ]);

  return { events, tasks, reminders };
}

export async function getAiSummary(userId: string, tzOffsetMinutes = 0): Promise<string> {
  const { events, tasks, reminders } = await getDashboardToday(userId, tzOffsetMinutes);

  const today = formatLocalDate(tzOffsetMinutes);

  const eventsText =
    events.length === 0
      ? "No events today."
      : events
          .map((e) => `- ${e.title} (${formatTimestamp(e.startTime, tzOffsetMinutes)} – ${formatTimestamp(e.endTime, tzOffsetMinutes)})`)
          .join("\n");

  const tasksText =
    tasks.length === 0
      ? "No tasks due today."
      : tasks
          .map((t) => `- ${t.title}${t.dueDate ? ` (due ${formatDateLabel(t.dueDate, tzOffsetMinutes)})` : ""}`)
          .join("\n");

  const remindersText =
    reminders.length === 0
      ? "No reminders today."
      : reminders
          .map(
            (r) =>
              `- ${r.title}${r.scheduledTime ? ` at ${formatTimestamp(r.scheduledTime, tzOffsetMinutes)}` : ""}${(r as { category?: { name: string } | null }).category ? ` [${(r as { category: { name: string } }).category.name}]` : ""}`
          )
          .join("\n");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: [
      {
        type: "text",
        text: "You are a personal productivity assistant. Generate a concise, friendly narrative summary of the user's day based on their events, tasks, and reminders. Use markdown with short sections. Be encouraging, practical, and keep the total response under 300 words.",
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Today is ${today}.\n\nEvents:\n${eventsText}\n\nTasks due today or overdue:\n${tasksText}\n\nReminders:\n${remindersText}`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response from Claude");
  return block.text;
}

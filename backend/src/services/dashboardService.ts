import Anthropic from "@anthropic-ai/sdk";
import prisma from "../lib/prisma";

function getTodayRange(): { startOfDay: Date; endOfDay: Date } {
  // "Today" is computed in UTC so the result is consistent regardless of server timezone.
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  return { startOfDay, endOfDay };
}

export async function getDashboardToday(userId: string) {
  const { startOfDay, endOfDay } = getTodayRange();

  const [events, tasks, reminders] = await Promise.all([
    prisma.event.findMany({
      where: { userId, startTime: { gte: startOfDay, lte: endOfDay } },
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
      where: { userId, scheduledTime: { gte: startOfDay, lte: endOfDay }, isDone: false },
      include: { category: true },
      orderBy: { scheduledTime: "asc" },
    }),
  ]);

  return { events, tasks, reminders };
}

function formatTimestamp(d: Date | string): string {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function getAiSummary(userId: string): Promise<string> {
  const { events, tasks, reminders } = await getDashboardToday(userId);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const eventsText =
    events.length === 0
      ? "No events today."
      : events
          .map((e) => `- ${e.title} (${formatTimestamp(e.startTime)} – ${formatTimestamp(e.endTime)})`)
          .join("\n");

  const tasksText =
    tasks.length === 0
      ? "No tasks due today."
      : tasks
          .map((t) => `- ${t.title}${t.dueDate ? ` (due ${formatDateLabel(t.dueDate)})` : ""}`)
          .join("\n");

  const remindersText =
    reminders.length === 0
      ? "No reminders today."
      : reminders
          .map(
            (r) =>
              `- ${r.title}${r.scheduledTime ? ` at ${formatTimestamp(r.scheduledTime)}` : ""}${(r as { category?: { name: string } | null }).category ? ` [${(r as { category: { name: string } }).category.name}]` : ""}`
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

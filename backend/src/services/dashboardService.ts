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
        OR: [
          { dueDate: { gte: startOfDay, lte: endOfDay } },
          { dueDate: { lt: startOfDay }, completedAt: null },
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

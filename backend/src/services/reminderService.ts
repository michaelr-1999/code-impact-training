import prisma from "../lib/prisma";

export async function createReminder(userId: string, data: { title: string; scheduledTime?: Date }) {
  return prisma.reminder.create({
    data: { userId, title: data.title, scheduledTime: data.scheduledTime },
  });
}

export async function getReminders(userId: string, start?: Date, end?: Date) {
  return prisma.reminder.findMany({
    where: {
      userId,
      ...(start && end ? { scheduledTime: { gte: start, lte: end } } : {}),
    },
    orderBy: { scheduledTime: "asc" },
  });
}

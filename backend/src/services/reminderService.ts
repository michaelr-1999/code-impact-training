import prisma from "../lib/prisma";

const categoryInclude = { include: { category: true } } as const;

export async function getReminders(userId: string, start?: Date, end?: Date) {
  return prisma.reminder.findMany({
    where: {
      userId,
      ...(start && end ? { scheduledTime: { gte: start, lte: end } } : {}),
    },
    ...categoryInclude,
    orderBy: { scheduledTime: "asc" },
  });
}

export async function createReminder(
  userId: string,
  data: { title: string; scheduledTime?: Date; isDone?: boolean; categoryId?: string; repeatInterval?: number; repeatUnit?: string; seriesId?: string }
) {
  return prisma.reminder.create({
    data: {
      userId,
      title: data.title,
      scheduledTime: data.scheduledTime,
      isDone: data.isDone ?? false,
      categoryId: data.categoryId,
      repeatInterval: data.repeatInterval,
      repeatUnit: data.repeatUnit,
      seriesId: data.seriesId,
    },
    ...categoryInclude,
  });
}

export async function getSeriesLastReminder(seriesId: string, userId: string) {
  return prisma.reminder.findFirst({
    where: { seriesId, userId },
    orderBy: { scheduledTime: "desc" },
  });
}

export async function updateReminder(
  id: string,
  userId: string,
  data: {
    title?: string;
    scheduledTime?: Date | null;
    isDone?: boolean;
    categoryId?: string | null;
    repeatInterval?: number | null;
    repeatUnit?: string | null;
  }
) {
  const reminder = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!reminder) return null;
  return prisma.reminder.update({ where: { id }, data, ...categoryInclude });
}

export async function deleteReminder(id: string, userId: string) {
  const reminder = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!reminder) return null;
  await prisma.reminder.delete({ where: { id } });
  return true;
}

export async function deleteReminderSeries(seriesId: string, userId: string) {
  return prisma.reminder.deleteMany({ where: { seriesId, userId } });
}

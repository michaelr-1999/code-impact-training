import prisma from "../lib/prisma";

export async function getTasks(userId: string, start?: Date, end?: Date, includeDone = false) {
  return prisma.task.findMany({
    where: {
      userId,
      ...(includeDone ? {} : { completedAt: null }),
      ...(start && end ? { dueDate: { gte: start, lte: end } } : {}),
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function createTask(
  userId: string,
  data: { title: string; description?: string; dueDate?: Date; repeatInterval?: number; repeatUnit?: string; seriesId?: string }
) {
  return prisma.task.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      repeatInterval: data.repeatInterval,
      repeatUnit: data.repeatUnit,
      seriesId: data.seriesId,
    },
  });
}

export async function getSeriesLastTask(seriesId: string, userId: string) {
  return prisma.task.findFirst({
    where: { seriesId, userId },
    orderBy: { dueDate: "desc" },
  });
}

export async function updateTask(
  id: string,
  userId: string,
  data: {
    title?: string;
    description?: string | null;
    dueDate?: Date | null;
    completedAt?: Date | null;
    repeatInterval?: number | null;
    repeatUnit?: string | null;
  }
) {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) return null;
  return prisma.task.update({ where: { id }, data });
}

export async function deleteTask(id: string, userId: string) {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) return null;
  await prisma.task.delete({ where: { id } });
  return true;
}

export function isOverdue(dueDate: Date): boolean {
  return dueDate < new Date();
}

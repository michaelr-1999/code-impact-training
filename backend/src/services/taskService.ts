import prisma from "../lib/prisma";

export async function getTasks(userId: string, start?: Date, end?: Date) {
  return prisma.task.findMany({
    where: {
      userId,
      ...(start && end ? { dueDate: { gte: start, lte: end } } : {}),
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function createTask(userId: string, data: { title: string; dueDate?: Date }) {
  return prisma.task.create({
    data: { userId, title: data.title, dueDate: data.dueDate },
  });
}

export function isOverdue(dueDate: Date): boolean {
  return dueDate < new Date();
}

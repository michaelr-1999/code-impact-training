import prisma from "../lib/prisma";

export async function getEvents(userId: string) {
  return prisma.event.findMany({
    where: { userId },
    orderBy: { startTime: "asc" },
  });
}

export async function deleteEvent(id: string, userId: string) {
  return prisma.event.delete({ where: { id, userId } });
}

export async function updateEvent(id: string, userId: string, data: {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
}) {
  return prisma.event.update({
    where: { id, userId },
    data,
  });
}

export async function createEvent(userId: string, data: {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
}) {
  return prisma.event.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });
}

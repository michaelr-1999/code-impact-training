import prisma from "../lib/prisma";

export async function getEvents(userId: string, start?: Date, end?: Date) {
  return prisma.event.findMany({
    where: {
      userId,
      ...(start && end
        ? { AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }] }
        : {}),
    },
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
  repeatInterval?: number | null;
  repeatUnit?: string | null;
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
  repeatInterval?: number;
  repeatUnit?: string;
  seriesId?: string;
}) {
  return prisma.event.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      repeatInterval: data.repeatInterval,
      repeatUnit: data.repeatUnit,
      seriesId: data.seriesId,
    },
  });
}

export async function getSeriesLastEvent(seriesId: string, userId: string) {
  return prisma.event.findFirst({
    where: { seriesId, userId },
    orderBy: { startTime: "desc" },
  });
}

export async function deleteEventSeries(seriesId: string, userId: string) {
  return prisma.event.deleteMany({ where: { seriesId, userId } });
}

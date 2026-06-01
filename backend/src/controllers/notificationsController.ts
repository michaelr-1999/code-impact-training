import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function getUpcomingNotificationsController(req: Request, res: Response) {
  const userId = req.user.id;
  const now = new Date();

  const upcomingStart = new Date(now.getTime() + 4 * 60 * 1000);
  const upcomingEnd = new Date(now.getTime() + 6 * 60 * 1000);

  const startingStart = new Date(now.getTime() - 60 * 1000);
  const startingEnd = new Date(now.getTime() + 60 * 1000);

  const [upcomingEvents, startingEvents, upcomingTasks, startingTasks, upcomingReminders, startingReminders] =
    await Promise.all([
      prisma.event.findMany({
        where: { userId, startTime: { gte: upcomingStart, lte: upcomingEnd } },
        select: { id: true, title: true, startTime: true },
      }),
      prisma.event.findMany({
        where: { userId, startTime: { gte: startingStart, lte: startingEnd } },
        select: { id: true, title: true, startTime: true },
      }),
      prisma.task.findMany({
        where: { userId, dueDate: { gte: upcomingStart, lte: upcomingEnd }, completedAt: null },
        select: { id: true, title: true, dueDate: true },
      }),
      prisma.task.findMany({
        where: { userId, dueDate: { gte: startingStart, lte: startingEnd }, completedAt: null },
        select: { id: true, title: true, dueDate: true },
      }),
      prisma.reminder.findMany({
        where: { userId, scheduledTime: { gte: upcomingStart, lte: upcomingEnd }, isDone: false },
        select: { id: true, title: true, scheduledTime: true },
      }),
      prisma.reminder.findMany({
        where: { userId, scheduledTime: { gte: startingStart, lte: startingEnd }, isDone: false },
        select: { id: true, title: true, scheduledTime: true },
      }),
    ]);

  res.json({
    upcoming: [
      ...upcomingEvents.map((e) => ({ id: e.id, title: e.title, type: "event" as const })),
      ...upcomingTasks.map((t) => ({ id: t.id, title: t.title, type: "task" as const })),
      ...upcomingReminders.map((r) => ({ id: r.id, title: r.title, type: "reminder" as const })),
    ],
    starting: [
      ...startingEvents.map((e) => ({ id: e.id, title: e.title, type: "event" as const })),
      ...startingTasks.map((t) => ({ id: t.id, title: t.title, type: "task" as const })),
      ...startingReminders.map((r) => ({ id: r.id, title: r.title, type: "reminder" as const })),
    ],
  });
}

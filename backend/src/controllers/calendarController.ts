import { Request, Response } from "express";
import { getEvents } from "../services/eventService";
import { getTasks } from "../services/taskService";
import { getReminders } from "../services/reminderService";
import { AppError } from "../lib/errors";

export async function getCalendarController(req: Request, res: Response) {
  const start = req.query.start ? new Date(req.query.start as string) : undefined;
  const end = req.query.end ? new Date(req.query.end as string) : undefined;
  try {
    const [events, tasks, reminders] = await Promise.all([
      getEvents(req.user.id, start, end),
      getTasks(req.user.id, start, end),
      getReminders(req.user.id, start, end),
    ]);
    res.status(200).json({ success: true, data: { events, tasks, reminders } });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

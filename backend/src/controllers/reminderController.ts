import { Request, Response } from "express";
import { getReminders, createReminder } from "../services/reminderService";
import { AppError } from "../lib/errors";

export async function getRemindersController(req: Request, res: Response) {
  const start = req.query.start ? new Date(req.query.start as string) : undefined;
  const end = req.query.end ? new Date(req.query.end as string) : undefined;
  try {
    const reminders = await getReminders(req.user.id, start, end);
    res.status(200).json({ success: true, data: reminders });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

export async function createReminderController(req: Request, res: Response) {
  const { title, scheduledTime } = req.body;
  if (!title || typeof title !== "string") {
    res.status(400).json({ success: false, error: "title is required" });
    return;
  }
  try {
    const reminder = await createReminder(req.user.id, {
      title: title.trim(),
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
    });
    res.status(201).json({ success: true, data: reminder });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

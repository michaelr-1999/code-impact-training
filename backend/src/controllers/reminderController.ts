import { Request, Response } from "express";
import { getReminders, createReminder, updateReminder, deleteReminder } from "../services/reminderService";
import { AppError } from "../lib/errors";

function errResponse(res: Response, err: unknown) {
  const status = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(status).json({ success: false, error: message });
}

export async function getRemindersController(req: Request, res: Response) {
  const start = req.query.start ? new Date(req.query.start as string) : undefined;
  const end = req.query.end ? new Date(req.query.end as string) : undefined;
  try {
    const reminders = await getReminders(req.user.id, start, end);
    res.status(200).json({ success: true, data: reminders });
  } catch (err) { errResponse(res, err); }
}

export async function createReminderController(req: Request, res: Response) {
  const { title, scheduledTime, isDone, categoryId } = req.body;
  if (!title || typeof title !== "string") {
    res.status(400).json({ success: false, error: "title is required" });
    return;
  }
  try {
    const reminder = await createReminder(req.user.id, {
      title: title.trim(),
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      isDone: isDone === true,
      categoryId: categoryId ? String(categoryId) : undefined,
    });
    res.status(201).json({ success: true, data: reminder });
  } catch (err) { errResponse(res, err); }
}

export async function updateReminderController(req: Request, res: Response) {
  const { id } = req.params;
  const { title, scheduledTime, isDone, categoryId } = req.body;
  const data: Parameters<typeof updateReminder>[2] = {};
  if (title !== undefined) data.title = String(title).trim();
  if (scheduledTime !== undefined) data.scheduledTime = scheduledTime ? new Date(scheduledTime) : null;
  if (isDone !== undefined) data.isDone = Boolean(isDone);
  if (categoryId !== undefined) data.categoryId = categoryId ? String(categoryId) : null;
  try {
    const reminder = await updateReminder(id, req.user.id, data);
    if (!reminder) { res.status(404).json({ success: false, error: "Reminder not found" }); return; }
    res.status(200).json({ success: true, data: reminder });
  } catch (err) { errResponse(res, err); }
}

export async function doneReminderController(req: Request, res: Response) {
  try {
    const reminder = await updateReminder(req.params.id, req.user.id, { isDone: true });
    if (!reminder) { res.status(404).json({ success: false, error: "Reminder not found" }); return; }
    res.status(200).json({ success: true, data: reminder });
  } catch (err) { errResponse(res, err); }
}

export async function undoneReminderController(req: Request, res: Response) {
  try {
    const reminder = await updateReminder(req.params.id, req.user.id, { isDone: false });
    if (!reminder) { res.status(404).json({ success: false, error: "Reminder not found" }); return; }
    res.status(200).json({ success: true, data: reminder });
  } catch (err) { errResponse(res, err); }
}

export async function deleteReminderController(req: Request, res: Response) {
  try {
    const result = await deleteReminder(req.params.id, req.user.id);
    if (!result) { res.status(404).json({ success: false, error: "Reminder not found" }); return; }
    res.status(204).send();
  } catch (err) { errResponse(res, err); }
}

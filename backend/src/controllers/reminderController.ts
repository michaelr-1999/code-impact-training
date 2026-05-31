import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { getReminders, createReminder, updateReminder, deleteReminder, getSeriesLastReminder, deleteReminderSeries } from "../services/reminderService";
import { AppError } from "../lib/errors";

function errResponse(res: Response, err: unknown) {
  const status = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(status).json({ success: false, error: message });
}

function getLocalDay(date: Date, tzOffsetMinutes: number): number {
  return new Date(date.getTime() - tzOffsetMinutes * 60 * 1000).getUTCDay();
}

function addInterval(date: Date, interval: number, unit: string): Date {
  const d = new Date(date);
  switch (unit) {
    case "day":   d.setDate(d.getDate() + interval); break;
    case "week":  d.setDate(d.getDate() + interval * 7); break;
    case "month": d.setMonth(d.getMonth() + interval); break;
    case "year":  d.setFullYear(d.getFullYear() + interval); break;
  }
  return d;
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
  const { title, scheduledTime, isDone, categoryId, repeatInterval, repeatUnit, repeatCount, seriesId: bodySeriesId } = req.body;
  if (!title || typeof title !== "string") {
    res.status(400).json({ success: false, error: "title is required" });
    return;
  }
  const count = Math.min(Math.max(1, Math.floor(Number(repeatCount) || 1)), 365);
  const interval = Math.max(1, Number(repeatInterval) || 1);
  const unit = repeatUnit ? String(repeatUnit) : "day";
  const rawDays: unknown = req.body.repeatDays;
  const repeatDays: number[] = Array.isArray(rawDays)
    ? rawDays.filter((d): d is number => typeof d === "number" && d >= 0 && d <= 6)
    : [];
  const rawTz: unknown = req.body.timezoneOffset;
  const tzOffset: number = typeof rawTz === "number" ? rawTz : 0;
  try {
    let resolvedSeriesId: string | undefined;
    let baseTime: Date | undefined;
    let startIndex = 0;

    if (bodySeriesId && typeof bodySeriesId === "string") {
      resolvedSeriesId = bodySeriesId;
      const last = await getSeriesLastReminder(resolvedSeriesId, req.user.id);
      baseTime = last?.scheduledTime ?? undefined;
      startIndex = 1;
    } else {
      baseTime = scheduledTime ? new Date(scheduledTime) : undefined;
      if (repeatDays.length > 0 || (repeatUnit && count > 1)) resolvedSeriesId = randomUUID();
    }

    const items = [];
    if (repeatDays.length > 0 && baseTime) {
      const cursor = new Date(baseTime);
      if (startIndex === 1) cursor.setDate(cursor.getDate() + 1);
      const limitMs = cursor.getTime() + (count * 7 + 7) * 24 * 60 * 60 * 1000;
      let generated = 0;
      while (generated < count && cursor.getTime() <= limitMs) {
        if (repeatDays.includes(getLocalDay(cursor, tzOffset))) {
          items.push(await createReminder(req.user.id, {
            title: title.trim(),
            scheduledTime: new Date(cursor),
            isDone: isDone === true,
            categoryId: categoryId ? String(categoryId) : undefined,
            repeatInterval: 1,
            repeatUnit: "week",
            seriesId: resolvedSeriesId,
          }));
          generated++;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      for (let i = startIndex; i < startIndex + count; i++) {
        const time = baseTime && repeatUnit ? addInterval(baseTime, interval * i, unit) : baseTime;
        items.push(await createReminder(req.user.id, {
          title: title.trim(),
          scheduledTime: time,
          isDone: isDone === true,
          categoryId: categoryId ? String(categoryId) : undefined,
          ...(repeatUnit && { repeatInterval: interval, repeatUnit: unit }),
          seriesId: resolvedSeriesId,
        }));
      }
    }
    res.status(201).json({ success: true, data: items });
  } catch (err) { errResponse(res, err); }
}

export async function updateReminderController(req: Request, res: Response) {
  const { id } = req.params;
  const { title, scheduledTime, isDone, categoryId, repeatInterval, repeatUnit } = req.body;
  const data: Parameters<typeof updateReminder>[2] = {};
  if (title !== undefined) data.title = String(title).trim();
  if (scheduledTime !== undefined) data.scheduledTime = scheduledTime ? new Date(scheduledTime) : null;
  if (isDone !== undefined) data.isDone = Boolean(isDone);
  if (categoryId !== undefined) data.categoryId = categoryId ? String(categoryId) : null;
  if (repeatInterval !== undefined) data.repeatInterval = repeatInterval !== null ? Number(repeatInterval) : null;
  if (repeatUnit !== undefined) data.repeatUnit = repeatUnit ? String(repeatUnit) : null;
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

export async function deleteReminderSeriesController(req: Request, res: Response) {
  try {
    await deleteReminderSeries(req.params.seriesId, req.user.id);
    res.status(204).send();
  } catch (err) { errResponse(res, err); }
}

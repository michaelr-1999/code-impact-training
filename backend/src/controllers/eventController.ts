import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { createEvent, updateEvent, deleteEvent, getEvents, getSeriesLastEvent } from "../services/eventService";
import { AppError } from "../lib/errors";

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

export async function getEventsController(req: Request, res: Response) {
  const start = req.query.start ? new Date(req.query.start as string) : undefined;
  const end = req.query.end ? new Date(req.query.end as string) : undefined;
  try {
    const events = await getEvents(req.user.id, start, end);
    res.status(200).json({ success: true, data: events });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

export async function deleteEventController(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await deleteEvent(id, req.user.id);
    res.status(200).json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Record to delete does not exist")) {
      res.status(404).json({ success: false, error: "Event not found" });
      return;
    }
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

export async function updateEventController(req: Request, res: Response) {
  const { id } = req.params;
  const { title, description, start, end, repeatInterval, repeatUnit } = req.body;

  if (!title || typeof title !== "string") {
    res.status(400).json({ success: false, error: "title is required" });
    return;
  }
  if (!start || !end) {
    res.status(400).json({ success: false, error: "start and end are required" });
    return;
  }

  const startTime = new Date(start);
  const endTime = new Date(end);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    res.status(400).json({ success: false, error: "invalid date format" });
    return;
  }
  if (endTime <= startTime) {
    res.status(400).json({ success: false, error: "end must be after start" });
    return;
  }

  try {
    const event = await updateEvent(id, req.user.id, {
      title: title.trim(),
      description: description?.trim(),
      startTime,
      endTime,
      repeatInterval: repeatInterval !== undefined ? (repeatInterval !== null ? Number(repeatInterval) : null) : undefined,
      repeatUnit: repeatUnit !== undefined ? (repeatUnit ? String(repeatUnit) : null) : undefined,
    });
    res.status(200).json({ success: true, data: event });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Record to update not found")) {
      res.status(404).json({ success: false, error: "Event not found" });
      return;
    }
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

export async function createEventController(req: Request, res: Response) {
  const { title, description, start, end, repeatInterval, repeatUnit, repeatCount, seriesId: bodySeriesId } = req.body;

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
    let baseStart: Date;
    let duration: number;
    let resolvedTitle: string;
    let resolvedDescription: string | undefined;
    let startIndex = 0;

    if (bodySeriesId && typeof bodySeriesId === "string") {
      resolvedSeriesId = bodySeriesId;
      const last = await getSeriesLastEvent(resolvedSeriesId, req.user.id);
      if (!last) {
        res.status(404).json({ success: false, error: "Series not found" });
        return;
      }
      baseStart = last.startTime;
      duration = last.endTime.getTime() - last.startTime.getTime();
      resolvedTitle = last.title;
      resolvedDescription = last.description ?? undefined;
      startIndex = 1;
    } else {
      if (!title || typeof title !== "string") {
        res.status(400).json({ success: false, error: "title is required" });
        return;
      }
      if (!start || !end) {
        res.status(400).json({ success: false, error: "start and end are required" });
        return;
      }
      baseStart = new Date(start);
      const baseEnd = new Date(end);
      if (isNaN(baseStart.getTime()) || isNaN(baseEnd.getTime())) {
        res.status(400).json({ success: false, error: "invalid date format" });
        return;
      }
      if (baseEnd <= baseStart) {
        res.status(400).json({ success: false, error: "end must be after start" });
        return;
      }
      duration = baseEnd.getTime() - baseStart.getTime();
      resolvedTitle = title.trim();
      resolvedDescription = description?.trim();
      if (repeatDays.length > 0 || (repeatUnit && count > 1)) resolvedSeriesId = randomUUID();
    }

    const items = [];
    if (repeatDays.length > 0) {
      const cursor = new Date(baseStart);
      if (startIndex === 1) cursor.setDate(cursor.getDate() + 1);
      const limitMs = cursor.getTime() + (count * 7 + 7) * 24 * 60 * 60 * 1000;
      let generated = 0;
      while (generated < count && cursor.getTime() <= limitMs) {
        if (repeatDays.includes(getLocalDay(cursor, tzOffset))) {
          const startTime = new Date(cursor);
          startTime.setHours(baseStart.getHours(), baseStart.getMinutes(), 0, 0);
          const endTime = new Date(startTime.getTime() + duration);
          items.push(await createEvent(req.user.id, {
            title: resolvedTitle,
            description: resolvedDescription,
            startTime,
            endTime,
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
        const startTime = repeatUnit ? addInterval(baseStart, interval * i, unit) : baseStart;
        const endTime = new Date(startTime.getTime() + duration);
        items.push(await createEvent(req.user.id, {
          title: resolvedTitle,
          description: resolvedDescription,
          startTime,
          endTime,
          ...(repeatUnit && { repeatInterval: interval, repeatUnit: unit }),
          seriesId: resolvedSeriesId,
        }));
      }
    }
    res.status(201).json({ success: true, data: items });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

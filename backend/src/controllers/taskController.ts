import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { getTasks, createTask, updateTask, deleteTask, getSeriesLastTask, deleteTaskSeries } from "../services/taskService";
import { AppError } from "../lib/errors";

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

export async function getTasksController(req: Request, res: Response) {
  const start = req.query.start ? new Date(req.query.start as string) : undefined;
  const end = req.query.end ? new Date(req.query.end as string) : undefined;
  const includeDone = req.query.includeDone === "true";
  try {
    const tasks = await getTasks(req.user.id, start, end, includeDone);
    res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

export async function createTaskController(req: Request, res: Response) {
  const { title, description, dueDate, repeatInterval, repeatUnit, repeatCount, seriesId: bodySeriesId } = req.body;
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
  try {
    let resolvedSeriesId: string | undefined;
    let baseDate: Date | undefined;
    let startIndex = 0;

    if (bodySeriesId && typeof bodySeriesId === "string") {
      resolvedSeriesId = bodySeriesId;
      const last = await getSeriesLastTask(resolvedSeriesId, req.user.id);
      baseDate = last?.dueDate ?? undefined;
      startIndex = 1;
    } else {
      baseDate = dueDate ? new Date(dueDate) : undefined;
      if (repeatDays.length > 0 || (repeatUnit && count > 1)) resolvedSeriesId = randomUUID();
    }

    const items = [];
    if (repeatDays.length > 0 && baseDate) {
      const cursor = new Date(baseDate);
      if (startIndex === 1) cursor.setDate(cursor.getDate() + 1);
      const limitMs = cursor.getTime() + (count * 7 + 7) * 24 * 60 * 60 * 1000;
      let generated = 0;
      while (generated < count && cursor.getTime() <= limitMs) {
        if (repeatDays.includes(cursor.getDay())) {
          items.push(await createTask(req.user.id, {
            title: title.trim(),
            description: description ? String(description).trim() : undefined,
            dueDate: new Date(cursor),
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
        const due = baseDate && repeatUnit ? addInterval(baseDate, interval * i, unit) : baseDate;
        items.push(await createTask(req.user.id, {
          title: title.trim(),
          description: description ? String(description).trim() : undefined,
          dueDate: due,
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

export async function updateTaskController(req: Request, res: Response) {
  const { id } = req.params;
  const { title, description, dueDate, completedAt, repeatInterval, repeatUnit } = req.body;
  const data: Parameters<typeof updateTask>[2] = {};
  if (title !== undefined) data.title = String(title).trim();
  if (description !== undefined) data.description = description ? String(description).trim() : null;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (completedAt !== undefined) data.completedAt = completedAt ? new Date(completedAt) : null;
  if (repeatInterval !== undefined) data.repeatInterval = repeatInterval !== null ? Number(repeatInterval) : null;
  if (repeatUnit !== undefined) data.repeatUnit = repeatUnit ? String(repeatUnit) : null;
  try {
    const task = await updateTask(id, req.user.id, data);
    if (!task) { res.status(404).json({ success: false, error: "Task not found" }); return; }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

export async function completeTaskController(req: Request, res: Response) {
  try {
    const task = await updateTask(req.params.id, req.user.id, { completedAt: new Date() });
    if (!task) { res.status(404).json({ success: false, error: "Task not found" }); return; }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

export async function incompleteTaskController(req: Request, res: Response) {
  try {
    const task = await updateTask(req.params.id, req.user.id, { completedAt: null });
    if (!task) { res.status(404).json({ success: false, error: "Task not found" }); return; }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

export async function deleteTaskController(req: Request, res: Response) {
  try {
    const result = await deleteTask(req.params.id, req.user.id);
    if (!result) { res.status(404).json({ success: false, error: "Task not found" }); return; }
    res.status(204).send();
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

export async function deleteTaskSeriesController(req: Request, res: Response) {
  try {
    await deleteTaskSeries(req.params.seriesId, req.user.id);
    res.status(204).send();
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

import { Request, Response } from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../services/taskService";
import { AppError } from "../lib/errors";

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
  const { title, description, dueDate } = req.body;
  if (!title || typeof title !== "string") {
    res.status(400).json({ success: false, error: "title is required" });
    return;
  }
  try {
    const task = await createTask(req.user.id, {
      title: title.trim(),
      description: description ? String(description).trim() : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

export async function updateTaskController(req: Request, res: Response) {
  const { id } = req.params;
  const { title, description, dueDate, completedAt } = req.body;
  const data: Parameters<typeof updateTask>[2] = {};
  if (title !== undefined) data.title = String(title).trim();
  if (description !== undefined) data.description = description ? String(description).trim() : null;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (completedAt !== undefined) data.completedAt = completedAt ? new Date(completedAt) : null;
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

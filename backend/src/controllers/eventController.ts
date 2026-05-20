import { Request, Response } from "express";
import { createEvent, updateEvent, deleteEvent, getEvents } from "../services/eventService";
import { AppError } from "../lib/errors";

export async function getEventsController(req: Request, res: Response) {
  try {
    const events = await getEvents(req.user.id);
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
  const { title, description, start, end } = req.body;

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
  const { title, description, start, end } = req.body;

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
    const event = await createEvent(req.user.id, {
      title: title.trim(),
      description: description?.trim(),
      startTime,
      endTime,
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

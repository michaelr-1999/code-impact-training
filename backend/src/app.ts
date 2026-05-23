import express, { Request, Response } from "express";
import { HealthResponse } from "./types";
import tasksRouter from "./routes/tasks";
import authRouter from "./routes/auth";
import eventsRouter from "./routes/events";
import remindersRouter from "./routes/reminders";
import calendarRouter from "./routes/calendar";

const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/events", eventsRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/calendar", calendarRouter);

app.get("/health", (_req: Request, res: Response<HealthResponse>) => {
  res.status(200).json({ status: "ok" });
});

export default app;

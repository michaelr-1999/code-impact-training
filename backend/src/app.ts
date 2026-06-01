import express, { Request, Response } from "express";
import { HealthResponse } from "./types";
import tasksRouter from "./routes/tasks";
import authRouter from "./routes/auth";
import eventsRouter from "./routes/events";
import remindersRouter from "./routes/reminders";
import reminderCategoriesRouter from "./routes/reminderCategories";
import calendarRouter from "./routes/calendar";
import dashboardRouter from "./routes/dashboard";
import usersRouter from "./routes/users";

const app = express();

app.use(express.json({ limit: "5mb" }));

app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/events", eventsRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/reminder-categories", reminderCategoriesRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", usersRouter);

app.get("/health", (_req: Request, res: Response<HealthResponse>) => {
  res.status(200).json({ status: "ok" });
});

export default app;

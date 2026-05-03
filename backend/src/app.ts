import express, { Request, Response } from "express";
import { HealthResponse } from "./types";
import tasksRouter from "./routes/tasks";

const app = express();
console.log("app started");

app.use("/api/v1/tasks", tasksRouter);

app.get("/health", (_req: Request, res: Response<HealthResponse>) => {
  res.status(200).json({ status: "ok" });
});

export default app;

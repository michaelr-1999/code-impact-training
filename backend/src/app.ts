import express, { Request, Response } from "express";
import { HealthResponse } from "./types";

const app = express();

app.get("/health", (_req: Request, res: Response<HealthResponse>) => {
  res.status(200).json({ status: "ok" });
});

export default app;

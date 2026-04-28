import express, { Request, Response } from "express";

interface HealthResponse {
  status: "ok";
}

const app = express();

app.get("/health", (_req: Request, res: Response<HealthResponse>) => {
  res.status(200).json({ status: "ok" });
});

export default app;

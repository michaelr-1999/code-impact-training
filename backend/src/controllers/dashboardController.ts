import { Request, Response } from "express";
import { getDashboardToday, getAiSummary } from "../services/dashboardService";

function parseTzOffset(raw: unknown): number {
  const n = Number(raw);
  return isFinite(n) ? n : 0;
}

export async function getDashboardTodayController(req: Request, res: Response) {
  try {
    const tzOffset = parseTzOffset(req.query.timezoneOffset);
    const data = await getDashboardToday(req.user.id, tzOffset);
    res.status(200).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function postAiSummaryController(req: Request, res: Response) {
  try {
    const tzOffset = parseTzOffset(req.body.timezoneOffset);
    const summary = await getAiSummary(req.user.id, tzOffset);
    res.status(200).json({ success: true, data: { summary } });
  } catch {
    res.status(500).json({ success: false, error: "Failed to generate summary" });
  }
}

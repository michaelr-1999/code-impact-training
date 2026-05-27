import { Request, Response } from "express";
import { getDashboardToday, getAiSummary } from "../services/dashboardService";

export async function getDashboardTodayController(req: Request, res: Response) {
  try {
    const data = await getDashboardToday(req.user.id);
    res.status(200).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function postAiSummaryController(req: Request, res: Response) {
  try {
    const summary = await getAiSummary(req.user.id);
    res.status(200).json({ success: true, data: { summary } });
  } catch {
    res.status(500).json({ success: false, error: "Failed to generate summary" });
  }
}

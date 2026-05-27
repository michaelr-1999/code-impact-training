import { Request, Response } from "express";
import { getDashboardToday } from "../services/dashboardService";

export async function getDashboardTodayController(req: Request, res: Response) {
  try {
    const data = await getDashboardToday(req.user.id);
    res.status(200).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

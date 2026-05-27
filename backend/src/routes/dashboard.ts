import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDashboardTodayController, postAiSummaryController } from "../controllers/dashboardController";

const router = Router();

router.use(requireAuth);
router.get("/today", getDashboardTodayController);
router.post("/ai-summary", postAiSummaryController);

export default router;

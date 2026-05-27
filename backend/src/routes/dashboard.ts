import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDashboardTodayController } from "../controllers/dashboardController";

const router = Router();

router.use(requireAuth);
router.get("/today", getDashboardTodayController);

export default router;

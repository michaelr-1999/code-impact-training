import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getCalendarController } from "../controllers/calendarController";

const router = Router();

router.use(requireAuth);
router.get("/", getCalendarController);

export default router;

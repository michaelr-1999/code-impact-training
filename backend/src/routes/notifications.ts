import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getUpcomingNotificationsController } from "../controllers/notificationsController";

const router = Router();

router.use(requireAuth);
router.get("/upcoming", getUpcomingNotificationsController);

export default router;

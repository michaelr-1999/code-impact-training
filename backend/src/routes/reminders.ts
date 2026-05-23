import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getRemindersController, createReminderController } from "../controllers/reminderController";

const router = Router();

router.use(requireAuth);
router.get("/", getRemindersController);
router.post("/", createReminderController);

export default router;

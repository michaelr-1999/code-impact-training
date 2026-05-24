import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getRemindersController,
  createReminderController,
  updateReminderController,
  doneReminderController,
  undoneReminderController,
  deleteReminderController,
} from "../controllers/reminderController";

const router = Router();

router.use(requireAuth);
router.get("/", getRemindersController);
router.post("/", createReminderController);
router.put("/:id", updateReminderController);
router.patch("/:id/done", doneReminderController);
router.patch("/:id/undone", undoneReminderController);
router.delete("/:id", deleteReminderController);

export default router;

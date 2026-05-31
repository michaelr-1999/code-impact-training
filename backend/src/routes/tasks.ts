import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getTasksController,
  createTaskController,
  updateTaskController,
  completeTaskController,
  incompleteTaskController,
  deleteTaskController,
  deleteTaskSeriesController,
} from "../controllers/taskController";

const router = Router();

router.use(requireAuth);
router.get("/", getTasksController);
router.post("/", createTaskController);
router.put("/:id", updateTaskController);
router.patch("/:id/complete", completeTaskController);
router.patch("/:id/incomplete", incompleteTaskController);
router.delete("/series/:seriesId", deleteTaskSeriesController);
router.delete("/:id", deleteTaskController);

export default router;

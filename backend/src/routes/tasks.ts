import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getTasksController, createTaskController } from "../controllers/taskController";

const router = Router();

router.use(requireAuth);
router.get("/", getTasksController);
router.post("/", createTaskController);

export default router;

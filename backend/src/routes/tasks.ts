import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getTasksController } from "../controllers/taskController";

const router = Router();

router.use(requireAuth);
router.get("/", getTasksController);

export default router;

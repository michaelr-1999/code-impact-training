import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getCategoriesController,
  createCategoryController,
  deleteCategoryController,
} from "../controllers/reminderCategoryController";

const router = Router();

router.use(requireAuth);
router.get("/", getCategoriesController);
router.post("/", createCategoryController);
router.delete("/:id", deleteCategoryController);

export default router;

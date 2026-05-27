import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { updateUserController, updatePasswordController } from "../controllers/userController";

const router = Router();

router.use(requireAuth);
router.put("/me", updateUserController);
router.put("/me/password", updatePasswordController);

export default router;

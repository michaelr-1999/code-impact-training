import { Router } from "express";
import { registerController, loginController, logoutController, getMeController } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/logout", logoutController);
router.get("/me", requireAuth, getMeController);

export default router;

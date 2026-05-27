import { Request, Response } from "express";
import { updateUser, updatePassword } from "../services/userService";
import { AppError } from "../lib/errors";

export async function updateUserController(req: Request, res: Response) {
  const { name, email } = req.body as { name?: string; email?: string };

  if (!name && !email) {
    res.status(400).json({ success: false, error: "At least one of name or email is required" });
    return;
  }

  try {
    const user = await updateUser(req.user.id, { name, email });
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

export async function updatePasswordController(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, error: "currentPassword and newPassword are required" });
    return;
  }

  try {
    await updatePassword(req.user.id, currentPassword, newPassword);
    res.status(200).json({ success: true });
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({ success: false, error: message });
  }
}

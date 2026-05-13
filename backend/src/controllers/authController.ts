import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/authService";

export function getMeController(req: Request, res: Response) {
  res.status(200).json({ success: true, data: req.user });
}

// Logout is stateless: JWTs cannot be invalidated server-side without a denylist.
// The client is responsible for discarding the token on logout.
export function logoutController(_req: Request, res: Response) {
  res.status(200).json({ success: true, message: "Logged out. Discard your token on the client." });
}

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: "email and password are required" });
    return;
  }

  try {
    const result = await loginUser(email, password);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    const status = err.statusCode ?? 500;
    res.status(status).json({ success: false, error: err.message });
  }
}

export async function registerController(req: Request, res: Response) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ success: false, error: "name, email, and password are required" });
    return;
  }

  try {
    const result = await registerUser(name, email, password);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    const status = err.statusCode ?? 500;
    res.status(status).json({ success: false, error: err.message });
  }
}

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

declare module "express-serve-static-core" {
  interface Request {
    user: { id: string; name: string; email: string };
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  let payload: { userId: string };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    res.status(401).json({ success: false, error: "User not found" });
    return;
  }

  req.user = user;
  next();
}

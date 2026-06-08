import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { AppError } from "../lib/errors";

const SALT_ROUNDS = 10;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export async function registerUser(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  const token = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: "7d" });

  return { token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: null } };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  const validPassword = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !validPassword) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: "7d" });

  return { token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } };
}

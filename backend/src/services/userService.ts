import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { AppError } from "../lib/errors";

const SALT_ROUNDS = 10;

export async function updateUser(userId: string, data: { name?: string; email?: string; avatarUrl?: string | null }) {
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== userId) {
      throw new AppError("Email is already in use by another account", 409);
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
}

export async function updatePassword(userId: string, currentPassword: string, newPassword: string) {
  if (newPassword.length < 8) {
    throw new AppError("New password must be at least 8 characters", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError("Current password is incorrect", 401);

  const same = await bcrypt.compare(newPassword, user.password);
  if (same) throw new AppError("New password must be different from your current password", 400);

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}

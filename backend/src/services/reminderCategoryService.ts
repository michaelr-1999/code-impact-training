import prisma from "../lib/prisma";

export async function getCategories(userId: string) {
  return prisma.reminderCategory.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(userId: string, name: string) {
  return prisma.reminderCategory.create({
    data: { userId, name },
  });
}

export async function deleteCategory(id: string, userId: string) {
  const category = await prisma.reminderCategory.findUnique({ where: { id } });
  // Not found, system category (userId=null), or another user's category → null
  if (!category || category.userId !== userId) return null;
  await prisma.reminder.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  await prisma.reminderCategory.delete({ where: { id } });
  return true;
}

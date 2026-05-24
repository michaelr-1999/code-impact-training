import { Request, Response } from "express";
import { getCategories, createCategory, deleteCategory } from "../services/reminderCategoryService";
import { AppError } from "../lib/errors";

function errResponse(res: Response, err: unknown) {
  const status = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(status).json({ success: false, error: message });
}

export async function getCategoriesController(req: Request, res: Response) {
  try {
    const categories = await getCategories(req.user.id);
    res.status(200).json({ success: true, data: categories });
  } catch (err) { errResponse(res, err); }
}

export async function createCategoryController(req: Request, res: Response) {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ success: false, error: "name is required" });
    return;
  }
  try {
    const category = await createCategory(req.user.id, name.trim());
    res.status(201).json({ success: true, data: category });
  } catch (err) { errResponse(res, err); }
}

export async function deleteCategoryController(req: Request, res: Response) {
  try {
    const result = await deleteCategory(req.params.id, req.user.id);
    if (!result) { res.status(404).json({ success: false, error: "Category not found" }); return; }
    res.status(204).send();
  } catch (err) { errResponse(res, err); }
}

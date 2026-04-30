import { Task } from "../types";

export function getTasks(): Task[] {
  return [];
}

export function isOverdue(dueDate: Date): boolean {
  return dueDate < new Date();
}

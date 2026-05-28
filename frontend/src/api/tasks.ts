import { apiFetch } from "../lib/api";

export interface ApiTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  repeatInterval: number | null;
  repeatUnit: string | null;
  seriesId: string | null;
}

export async function getTasks(start: string, end: string): Promise<ApiTask[]> {
  const res = await apiFetch(`/api/tasks?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load tasks");
  return json.data as ApiTask[];
}

export async function getAllTasks(includeDone = false): Promise<ApiTask[]> {
  const params = includeDone ? "?includeDone=true" : "";
  const res = await apiFetch(`/api/tasks${params}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load tasks");
  return json.data as ApiTask[];
}

export async function createTask(data: { title: string; description?: string; dueDate?: string; repeatInterval?: number; repeatUnit?: string; repeatCount?: number; seriesId?: string }): Promise<ApiTask[]> {
  const res = await apiFetch("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to create task");
  return json.data as ApiTask[];
}

export async function updateTask(id: string, data: { title?: string; description?: string | null; dueDate?: string | null; completedAt?: string | null; repeatInterval?: number | null; repeatUnit?: string | null }): Promise<ApiTask> {
  const res = await apiFetch(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to update task");
  return json.data as ApiTask;
}

export async function completeTask(id: string): Promise<ApiTask> {
  const res = await apiFetch(`/api/tasks/${id}/complete`, { method: "PATCH" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to complete task");
  return json.data as ApiTask;
}

export async function incompleteTask(id: string): Promise<ApiTask> {
  const res = await apiFetch(`/api/tasks/${id}/incomplete`, { method: "PATCH" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to mark task incomplete");
  return json.data as ApiTask;
}

export async function deleteTask(id: string): Promise<void> {
  const res = await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "Failed to delete task");
  }
}

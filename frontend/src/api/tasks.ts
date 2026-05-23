import { apiFetch } from "../lib/api";

export interface ApiTask {
  id: string;
  title: string;
  dueDate: string | null;
}

export async function getTasks(start: string, end: string): Promise<ApiTask[]> {
  const res = await apiFetch(`/api/v1/tasks?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load tasks");
  return json.data as ApiTask[];
}

export async function getAllTasks(): Promise<ApiTask[]> {
  const res = await apiFetch("/api/v1/tasks");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load tasks");
  return json.data as ApiTask[];
}

export async function createTask(data: { title: string; dueDate?: string }): Promise<ApiTask> {
  const res = await apiFetch("/api/v1/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to create task");
  return json.data as ApiTask;
}

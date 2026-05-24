import { apiFetch } from "../lib/api";

export interface ApiReminderCategory {
  id: string;
  name: string;
  userId: string | null;
}

export interface ApiReminder {
  id: string;
  title: string;
  scheduledTime: string | null;
  isDone: boolean;
  categoryId: string | null;
  category: ApiReminderCategory | null;
}

export async function getReminders(start?: string, end?: string): Promise<ApiReminder[]> {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const query = params.toString() ? `?${params}` : "";
  const res = await apiFetch(`/api/reminders${query}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load reminders");
  return json.data as ApiReminder[];
}

export async function getAllReminders(): Promise<ApiReminder[]> {
  const res = await apiFetch("/api/reminders");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load reminders");
  return json.data as ApiReminder[];
}

export async function getCategories(): Promise<ApiReminderCategory[]> {
  const res = await apiFetch("/api/reminder-categories");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load categories");
  return json.data as ApiReminderCategory[];
}

export async function createReminder(data: {
  title: string;
  scheduledTime?: string;
  categoryId?: string;
}): Promise<ApiReminder> {
  const res = await apiFetch("/api/reminders", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to create reminder");
  return json.data as ApiReminder;
}

export async function markReminderDone(id: string): Promise<ApiReminder> {
  const res = await apiFetch(`/api/reminders/${id}/done`, { method: "PATCH" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to mark reminder done");
  return json.data as ApiReminder;
}

export async function markReminderUndone(id: string): Promise<ApiReminder> {
  const res = await apiFetch(`/api/reminders/${id}/undone`, { method: "PATCH" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to mark reminder undone");
  return json.data as ApiReminder;
}

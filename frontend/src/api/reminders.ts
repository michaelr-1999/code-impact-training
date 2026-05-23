import { apiFetch } from "../lib/api";

export interface ApiReminder {
  id: string;
  title: string;
  scheduledTime: string | null;
}

export async function getReminders(start: string, end: string): Promise<ApiReminder[]> {
  const res = await apiFetch(`/api/reminders?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
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

export async function createReminder(data: { title: string; scheduledTime?: string }): Promise<ApiReminder> {
  const res = await apiFetch("/api/reminders", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to create reminder");
  return json.data as ApiReminder;
}

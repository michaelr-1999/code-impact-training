import { apiFetch } from "../lib/api";

export interface DashboardEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

export interface DashboardTask {
  id: string;
  title: string;
  dueDate: string | null;
  completedAt: string | null;
}

export interface DashboardReminder {
  id: string;
  title: string;
  scheduledTime: string | null;
}

export interface DashboardData {
  events: DashboardEvent[];
  tasks: DashboardTask[];
  reminders: DashboardReminder[];
}

export async function getDashboardToday(): Promise<DashboardData> {
  const tz = new Date().getTimezoneOffset();
  const res = await apiFetch(`/api/dashboard/today?timezoneOffset=${tz}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load dashboard");
  return json.data as DashboardData;
}

export async function postAiSummary(): Promise<string> {
  const res = await apiFetch("/api/dashboard/ai-summary", {
    method: "POST",
    body: JSON.stringify({ timezoneOffset: new Date().getTimezoneOffset() }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to generate summary");
  return json.data.summary as string;
}

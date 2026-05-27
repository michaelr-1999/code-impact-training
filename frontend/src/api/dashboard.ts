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
  const res = await apiFetch("/api/dashboard/today");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load dashboard");
  return json.data as DashboardData;
}

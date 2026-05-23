import { apiFetch } from "../lib/api";
import type { ApiEvent } from "./events";
import type { ApiTask } from "./tasks";
import type { ApiReminder } from "./reminders";

export interface CalendarData {
  events: ApiEvent[];
  tasks: ApiTask[];
  reminders: ApiReminder[];
}

export async function getCalendarData(start: string, end: string): Promise<CalendarData> {
  const res = await apiFetch(`/api/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load calendar data");
  return json.data as CalendarData;
}

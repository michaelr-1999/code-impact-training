import { apiFetch } from "../lib/api";

export interface ApiEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
}

export async function getEvents(start: string, end: string): Promise<ApiEvent[]> {
  const res = await apiFetch(`/api/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load events");
  return json.data as ApiEvent[];
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await apiFetch(`/api/events/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "Failed to delete event");
  }
}

export async function updateEvent(id: string, data: {
  title: string;
  description: string;
  start: string;
  end: string;
}): Promise<ApiEvent> {
  const res = await apiFetch(`/api/events/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...data,
      start: new Date(data.start).toISOString(),
      end: new Date(data.end).toISOString(),
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to update event");
  return json.data as ApiEvent;
}

export async function createEvent(data: {
  title: string;
  description: string;
  start: string;
  end: string;
}): Promise<ApiEvent> {
  const res = await apiFetch("/api/events", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      start: new Date(data.start).toISOString(),
      end: new Date(data.end).toISOString(),
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to create event");
  return json.data as ApiEvent;
}

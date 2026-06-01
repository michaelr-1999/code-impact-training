import { useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";

type NotificationItem = {
  id: string;
  title: string;
  type: "event" | "task" | "reminder";
};

type NotificationsResponse = {
  upcoming: NotificationItem[];
  starting: NotificationItem[];
};

const POLL_INTERVAL_MS = 60_000;

const UPCOMING_TITLES: Record<NotificationItem["type"], string> = {
  event: "Event starting in 5 minutes",
  task: "Task due in 5 minutes",
  reminder: "Reminder in 5 minutes",
};

const STARTING_TITLES: Record<NotificationItem["type"], string> = {
  event: "Event starting now",
  task: "Task is due now",
  reminder: "Reminder",
};

export function useNotifications(enabled: boolean) {
  const notifiedKeys = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !("Notification" in window)) return;

    async function requestPermission() {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }

    async function checkUpcoming() {
      if (Notification.permission !== "granted") return;
      try {
        const res = await apiFetch("/api/notifications/upcoming");
        if (!res.ok) return;
        const data: NotificationsResponse = await res.json();

        for (const item of data.upcoming) {
          const key = `${item.id}-upcoming`;
          if (notifiedKeys.current.has(key)) continue;
          notifiedKeys.current.add(key);
          new Notification(UPCOMING_TITLES[item.type], { body: item.title, icon: "/favicon.ico" });
        }

        for (const item of data.starting) {
          const key = `${item.id}-starting`;
          if (notifiedKeys.current.has(key)) continue;
          notifiedKeys.current.add(key);
          new Notification(STARTING_TITLES[item.type], { body: item.title, icon: "/favicon.ico" });
        }
      } catch {
        // silently ignore network errors or tab throttling
      }
    }

    requestPermission().then(checkUpcoming);
    const id = setInterval(checkUpcoming, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled]);
}

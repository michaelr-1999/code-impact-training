import { useEffect, useState } from "react";
import { getDashboardToday } from "../api/dashboard";

export interface BadgeCounts {
  tasks: number;
  reminders: number;
}

export function useBadgeCounts(): BadgeCounts {
  const [counts, setCounts] = useState<BadgeCounts>({ tasks: 0, reminders: 0 });

  useEffect(() => {
    getDashboardToday()
      .then(data => {
        setCounts({
          tasks: data.tasks.filter(t => !t.completedAt).length,
          reminders: data.reminders.length,
        });
      })
      .catch(() => {});
  }, []);

  return counts;
}

import { useState } from "react";
import type { ApiReminder } from "../../api/reminders";
import { ReminderItem } from "./ReminderItem";

interface Props {
  name: string;
  reminders: ApiReminder[];
  onToggle: (reminder: ApiReminder) => void;
  onEdit: (reminder: ApiReminder) => void;
  variant?: "overdue";
}

function sortByScheduledTime(reminders: ApiReminder[]): ApiReminder[] {
  return [...reminders].sort((a, b) => {
    if (!a.scheduledTime && !b.scheduledTime) return 0;
    if (!a.scheduledTime) return 1;
    if (!b.scheduledTime) return -1;
    return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
  });
}

export function CategorySection({ name, reminders, onToggle, onEdit, variant }: Props) {
  const [expanded, setExpanded] = useState(true);
  const sorted = sortByScheduledTime(reminders);
  const isOverdue = variant === "overdue";

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border shadow-sm mb-3 ${isOverdue ? "border-red-400 dark:border-red-600" : "border-gray-200 dark:border-gray-700"}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className={`text-sm font-semibold ${isOverdue ? "text-red-600 dark:text-red-400 animate-pulse" : "text-gray-700 dark:text-gray-300"}`}>{name}</span>
        <svg
          className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-700">
          {sorted.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-2">No reminders</p>
          ) : (
            sorted.map((r) => (
              <ReminderItem key={r.id} reminder={r} onToggle={onToggle} onEdit={onEdit} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

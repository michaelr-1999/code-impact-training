import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import type { DashboardReminder } from "../../api/dashboard";

interface Props {
  reminders: DashboardReminder[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function RemindersWidget({ reminders }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reminders</h2>
        <button
          onClick={() => navigate("/reminders")}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-moss dark:hover:text-moss-hover font-medium"
        >
          View all
        </button>
      </div>
      {reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Bell size={20} className="text-gray-300 dark:text-gray-600 mb-1.5" strokeWidth={1.5} />
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Nothing scheduled</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">No reminders today</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {reminders.map((reminder) => (
            <li
              key={reminder.id}
              onClick={() => navigate("/reminders")}
              className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white block">{reminder.title}</span>
                {reminder.scheduledTime && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(reminder.scheduledTime)}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

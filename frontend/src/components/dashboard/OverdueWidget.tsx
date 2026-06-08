import { useNavigate } from "react-router-dom";
import type { DashboardTask, DashboardReminder } from "../../api/dashboard";

interface Props {
  tasks: DashboardTask[];
  reminders: DashboardReminder[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function OverdueWidget({ tasks, reminders }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-400 dark:border-red-600 shadow-sm p-4">
      <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 animate-pulse uppercase tracking-wide mb-3">
        Overdue
      </h2>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={`task-${task.id}`}
            onClick={() => navigate("/tasks")}
            className="flex items-start gap-3 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="shrink-0 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 px-1.5 py-0.5 rounded mt-0.5">
              Task
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900 dark:text-white block">{task.title}</span>
              {task.dueDate && (
                <span className="text-xs text-red-500">Due {formatDate(task.dueDate)}</span>
              )}
            </div>
          </li>
        ))}
        {reminders.map((reminder) => (
          <li
            key={`reminder-${reminder.id}`}
            onClick={() => navigate("/reminders")}
            className="flex items-start gap-3 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded mt-0.5">
              Reminder
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900 dark:text-white block">{reminder.title}</span>
              {reminder.scheduledTime && (
                <span className="text-xs text-red-500">{formatTime(reminder.scheduledTime)}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

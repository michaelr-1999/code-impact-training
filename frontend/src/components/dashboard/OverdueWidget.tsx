import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
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
  const total = tasks.length + reminders.length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-950/40 border-b border-red-100 dark:border-red-900">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shrink-0">
          <AlertTriangle size={14} className="text-white" strokeWidth={2.5} />
        </div>
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
          Overdue
        </h2>
        <span className="ml-auto text-xs font-bold text-white bg-red-500 dark:bg-red-600 min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5">
          {total}
        </span>
      </div>
      <ul className="space-y-1 p-2">
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

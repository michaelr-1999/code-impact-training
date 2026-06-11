import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { DashboardTask } from "../../api/dashboard";

interface Props {
  tasks: DashboardTask[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function isOverdue(dueDate: string): boolean {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(dueDate) < startOfToday;
}

export function TasksWidget({ tasks }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tasks</h2>
        <button
          onClick={() => navigate("/tasks")}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-moss dark:hover:text-moss-hover font-medium"
        >
          View all
        </button>
      </div>
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <CheckCircle2 size={20} className="text-gray-300 dark:text-gray-600 mb-1.5" strokeWidth={1.5} />
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500">All clear</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">No tasks due today</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const overdue = task.dueDate ? isOverdue(task.dueDate) : false;
            return (
              <li
                key={task.id}
                onClick={() => navigate("/tasks")}
                className="flex items-start gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">{task.title}</span>
                  {task.dueDate && (
                    <span className={`text-xs font-medium ${overdue ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
                      {overdue ? "Overdue · " : ""}{formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
                {overdue && (
                  <span className="shrink-0 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-950 px-1.5 py-0.5 rounded">
                    Overdue
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

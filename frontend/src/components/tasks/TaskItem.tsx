import type { ApiTask } from "../../api/tasks";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

interface Props {
  task: ApiTask;
  onToggle: (task: ApiTask) => void;
}

export function TaskItem({ task, onToggle }: Props) {
  const done = !!task.completedAt;
  const overdue = !done && !!task.dueDate && new Date(task.dueDate) < new Date();
  return (
    <div className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
      <input
        type="checkbox"
        checked={done}
        onChange={() => onToggle(task)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
      />
      <div>
        <p className={`text-sm font-medium ${done ? "line-through text-gray-400" : "text-gray-900"}`}>
          {task.title}
        </p>
        {task.dueDate && (
          <p className={`text-xs ${overdue ? "text-red-500 font-medium" : "text-gray-500"}`}>
            {overdue ? "Overdue · " : ""}{formatDate(task.dueDate)}
          </p>
        )}
        {done && task.completedAt && (
          <p className="text-xs text-gray-400">Completed {formatDate(task.completedAt)}</p>
        )}
      </div>
    </div>
  );
}

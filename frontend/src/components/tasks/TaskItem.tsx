import { motion } from "framer-motion";
import type { ApiTask } from "../../api/tasks";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

interface Props {
  task: ApiTask;
  onToggle: (task: ApiTask) => void;
  onEdit: (task: ApiTask) => void;
}

export function TaskItem({ task, onToggle, onEdit }: Props) {
  const done = !!task.completedAt;
  const overdue = !done && !!task.dueDate && new Date(task.dueDate) < new Date();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={`flex items-start gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-l-[3px] rounded-lg px-4 py-3 hover:shadow-md transition-shadow duration-150 ${
        done ? "border-l-gray-300 dark:border-l-gray-600 opacity-60" : overdue ? "border-l-red-500 dark:border-l-red-400" : "border-l-green-500 dark:border-l-green-400"
      }`}
    >
      <input
        type="checkbox"
        checked={done}
        onChange={() => onToggle(task)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
      />
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className={`text-sm font-medium text-left hover:underline ${done ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}
        >
          {task.title}
        </button>
        {task.dueDate && (
          <p className={`text-xs ${overdue ? "text-red-500 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
            {overdue ? "Overdue · " : ""}{formatDate(task.dueDate)}
          </p>
        )}
        {done && task.completedAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500">Completed {formatDate(task.completedAt)}</p>
        )}
      </div>
    </motion.div>
  );
}

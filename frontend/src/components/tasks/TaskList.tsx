import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ApiTask } from "../../api/tasks";
import { TaskItem } from "./TaskItem";

interface Props {
  title: string;
  tasks: ApiTask[];
  emptyMessage: string;
  emptyIcon?: LucideIcon;
  emptySubtext?: string;
  onToggle: (task: ApiTask) => void;
  onEdit: (task: ApiTask) => void;
  collapsible?: boolean;
  variant?: "overdue";
}

export function TaskList({ title, tasks, emptyMessage, emptyIcon: EmptyIcon, emptySubtext, onToggle, onEdit, collapsible = false, variant }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visible = !collapsible || expanded;
  const isOverdue = variant === "overdue";

  return (
    <section className="mb-6">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <span className={`text-xs inline-block transition-transform ${expanded ? "rotate-90" : ""}`}>▶</span>
          {title} <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">({tasks.length})</span>
        </button>
      ) : (
        <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isOverdue ? "text-red-600 dark:text-red-400 animate-pulse" : "text-gray-700 dark:text-gray-300"}`}>
          {title} <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">({tasks.length})</span>
        </h2>
      )}
      {visible && (
        tasks.length === 0 ? (
          emptyMessage ? (
            <div className="flex flex-col items-center justify-center py-7 text-center">
              {EmptyIcon && (
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <EmptyIcon size={19} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                </div>
              )}
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{emptyMessage}</p>
              {emptySubtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{emptySubtext}</p>}
            </div>
          ) : null
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {tasks.map(task => (
                <TaskItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} />
              ))}
            </AnimatePresence>
          </div>
        )
      )}
    </section>
  );
}

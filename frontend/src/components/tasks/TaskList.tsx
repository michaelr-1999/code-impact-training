import { useState } from "react";
import type { ApiTask } from "../../api/tasks";
import { TaskItem } from "./TaskItem";

interface Props {
  title: string;
  tasks: ApiTask[];
  emptyMessage: string;
  onToggle: (task: ApiTask) => void;
  collapsible?: boolean;
}

export function TaskList({ title, tasks, emptyMessage, onToggle, collapsible = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visible = !collapsible || expanded;

  return (
    <section className="mb-6">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 hover:text-gray-900 transition-colors"
        >
          <span className={`text-xs inline-block transition-transform ${expanded ? "rotate-90" : ""}`}>▶</span>
          {title} <span className="text-gray-400 font-normal normal-case">({tasks.length})</span>
        </button>
      ) : (
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          {title} <span className="text-gray-400 font-normal normal-case">({tasks.length})</span>
        </h2>
      )}
      {visible && (
        tasks.length === 0 ? (
          <p className="text-sm text-gray-400 italic">{emptyMessage}</p>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => <TaskItem key={task.id} task={task} onToggle={onToggle} />)}
          </div>
        )
      )}
    </section>
  );
}

import type { Task } from "./types";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
      <p className="mt-1 text-sm text-gray-500">
        {task.completed ? "Done" : "Not completed"}
      </p>
    </div>
  );
}

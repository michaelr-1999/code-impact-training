import { useState, useEffect, type FormEvent } from "react";
import { getAllTasks, createTask, type ApiTask } from "../api/tasks";

function formatDate(iso: string | null) {
  if (!iso) return "No due date";
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAllTasks().then(setTasks).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const task = await createTask({
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      setTasks((prev) => [task, ...prev]);
      setTitle("");
      setDueDate("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tasks</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow p-4 mb-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">New Task</h2>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <div>
          <label className="block text-xs text-gray-500 mb-1">Due date (optional)</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Adding…" : "Add Task"}
        </button>
      </form>

      <div className="space-y-2">
        {tasks.length === 0 && (
          <p className="text-sm text-gray-500">No tasks yet.</p>
        )}
        {tasks.map((task) => (
          <div key={task.id} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">{task.title}</p>
              <p className="text-xs text-gray-500">{formatDate(task.dueDate)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

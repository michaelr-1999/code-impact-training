import { useState, useEffect } from "react";
import { getAllTasks, completeTask, incompleteTask, type ApiTask } from "../api/tasks";
import { TaskList } from "../components/tasks/TaskList";

export default function TasksPage() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);

  useEffect(() => {
    getAllTasks(true).then(setTasks).catch(() => {});
  }, []);

  const incomplete = tasks
    .filter(t => !t.completedAt && t.dueDate !== null)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const backlog = tasks
    .filter(t => !t.completedAt && t.dueDate === null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const complete = tasks
    .filter(t => !!t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  async function handleToggle(task: ApiTask) {
    const wasDone = !!task.completedAt;
    setTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, completedAt: wasDone ? null : new Date().toISOString() } : t)
    );
    try {
      const updated = await (wasDone ? incompleteTask(task.id) : completeTask(task.id));
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tasks</h1>
      <TaskList
        title="Incomplete"
        tasks={incomplete}
        emptyMessage="No upcoming tasks"
        onToggle={handleToggle}
      />
      <TaskList
        title="Backlog"
        tasks={backlog}
        emptyMessage="No tasks in backlog"
        onToggle={handleToggle}
      />
      <TaskList
        title="Complete"
        tasks={complete}
        emptyMessage="No completed tasks"
        onToggle={handleToggle}
        collapsible
      />
    </div>
  );
}

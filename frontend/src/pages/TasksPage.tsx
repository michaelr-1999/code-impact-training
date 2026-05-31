import { useState, useEffect } from "react";
import { getAllTasks, completeTask, incompleteTask, type ApiTask } from "../api/tasks";
import { TaskList } from "../components/tasks/TaskList";
import { TaskModal } from "../components/tasks/TaskModal";

export default function TasksPage() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ApiTask | null>(null);

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

  function openCreate() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEdit(task: ApiTask) {
    setEditingTask(task);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingTask(null);
  }

  function handleSave(saved: ApiTask) {
    setTasks(prev => {
      const exists = prev.some(t => t.id === saved.id);
      return exists ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev];
    });
  }

  function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function handleDeleteSeries(seriesId: string) {
    setTasks(prev => prev.filter(t => t.seriesId !== seriesId));
  }

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          + Create task
        </button>
      </div>
      <TaskList
        title="Incomplete"
        tasks={incomplete}
        emptyMessage="No upcoming tasks"
        onToggle={handleToggle}
        onEdit={openEdit}
      />
      <TaskList
        title="Backlog"
        tasks={backlog}
        emptyMessage="No tasks in backlog"
        onToggle={handleToggle}
        onEdit={openEdit}
      />
      <TaskList
        title="Complete"
        tasks={complete}
        emptyMessage="No completed tasks"
        onToggle={handleToggle}
        onEdit={openEdit}
        collapsible
      />
      {modalOpen && (
        <TaskModal
          task={editingTask}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
          onDeleteSeries={handleDeleteSeries}
        />
      )}
    </div>
  );
}

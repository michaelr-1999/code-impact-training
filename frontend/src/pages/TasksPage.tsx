import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ListTodo, CheckCircle2, Inbox, Trophy } from "lucide-react";
import { getAllTasks, completeTask, incompleteTask, type ApiTask } from "../api/tasks";
import { TaskList } from "../components/tasks/TaskList";
import { TaskModal } from "../components/tasks/TaskModal";
import { PageHeader } from "../components/PageHeader";
import { useToast } from "../context/ToastContext";

function TasksSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {([3, 2, 1] as const).map((count, i) => (
        <div key={i}>
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, j) => (
              <div key={j} className="h-14 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ApiTask | null>(null);
  const toast = useToast();

  useEffect(() => {
    const targetId = editId;
    getAllTasks(true).then((loadedTasks) => {
      setTasks(loadedTasks);
      if (targetId) {
        const task = loadedTasks.find((t) => t.id === targetId);
        if (task) {
          setEditingTask(task);
          setModalOpen(true);
          setSearchParams({}, { replace: true });
        }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = new Date();

  const overdue = tasks
    .filter(t => !t.completedAt && t.dueDate !== null && new Date(t.dueDate!) < now)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const incomplete = tasks
    .filter(t => !t.completedAt && t.dueDate !== null && new Date(t.dueDate!) >= now)
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
    toast("Task saved");
  }

  function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    toast("Task deleted", "info");
  }

  function handleDeleteSeries(seriesId: string) {
    setTasks(prev => prev.filter(t => t.seriesId !== seriesId));
    toast("Series deleted", "info");
  }

  async function handleToggle(task: ApiTask) {
    const wasDone = !!task.completedAt;
    setTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, completedAt: wasDone ? null : new Date().toISOString() } : t)
    );
    toast(wasDone ? "Task marked incomplete" : "Task completed");
    try {
      const updated = await (wasDone ? incompleteTask(task.id) : completeTask(task.id));
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <PageHeader
        icon={ListTodo}
        gradient="from-green-500 to-emerald-600"
        title="Tasks"
        actions={
          <button
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            + Create task
          </button>
        }
      />
      {loading ? <TasksSkeleton /> : <>
      {overdue.length > 0 && (
        <TaskList
          title="Overdue"
          tasks={overdue}
          emptyMessage=""
          variant="overdue"
          onToggle={handleToggle}
          onEdit={openEdit}
        />
      )}
      <TaskList
        title="Incomplete"
        tasks={incomplete}
        emptyMessage="All caught up"
        emptyIcon={CheckCircle2}
        emptySubtext="No tasks due soon"
        onToggle={handleToggle}
        onEdit={openEdit}
      />
      <TaskList
        title="Backlog"
        tasks={backlog}
        emptyMessage="Backlog is clear"
        emptyIcon={Inbox}
        emptySubtext="Nothing waiting in the wings"
        onToggle={handleToggle}
        onEdit={openEdit}
      />
      <TaskList
        title="Complete"
        tasks={complete}
        emptyMessage="No completed tasks"
        emptyIcon={Trophy}
        emptySubtext="Finish a task to see it here"
        onToggle={handleToggle}
        onEdit={openEdit}
        collapsible
      />
      </>}
      <AnimatePresence>
        {modalOpen && (
          <TaskModal
            task={editingTask}
            onClose={closeModal}
            onSave={handleSave}
            onDelete={handleDelete}
            onDeleteSeries={handleDeleteSeries}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

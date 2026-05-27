import { useState, useEffect, type FormEvent } from "react";
import { createTask, updateTask, deleteTask, type ApiTask } from "../../api/tasks";

function toDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface Props {
  task: ApiTask | null;
  onClose: () => void;
  onSave: (task: ApiTask) => void;
  onDelete: (id: string) => void;
}

export function TaskModal({ task, onClose, onSave, onDelete }: Props) {
  const isEdit = task !== null;
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? toDateTimeLocal(new Date(task.dueDate)) : ""
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      let saved: ApiTask;
      if (isEdit) {
        saved = await updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        });
      } else {
        saved = await createTask({
          title: title.trim(),
          ...(description.trim() && { description: description.trim() }),
          ...(dueDate && { dueDate: new Date(dueDate).toISOString() }),
        });
      }
      onSave(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? "Failed to save task" : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    setDeleting(true);
    setError("");
    try {
      await deleteTask(task.id);
      onDelete(task.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isEdit ? "Edit task" : "New task"}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (error) setError(""); }}
              placeholder="Task title"
              autoFocus
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${error ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due date &amp; time</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            {isEdit ? (
              confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Delete this task?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                >
                  Delete
                </button>
              )
            ) : <div />}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving…" : isEdit ? "Save changes" : "Create task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

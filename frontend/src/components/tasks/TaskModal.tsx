import { useState, useEffect, type FormEvent } from "react";
import { createTask, updateTask, deleteTask, type ApiTask } from "../../api/tasks";

function toDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addInterval(date: Date, interval: number, unit: string): Date {
  const d = new Date(date);
  switch (unit) {
    case "day":   d.setDate(d.getDate() + interval); break;
    case "week":  d.setDate(d.getDate() + interval * 7); break;
    case "month": d.setMonth(d.getMonth() + interval); break;
    case "year":  d.setFullYear(d.getFullYear() + interval); break;
  }
  return d;
}

interface Props {
  task: ApiTask | null;
  onClose: () => void;
  onSave: (task: ApiTask) => void;
  onDelete: (id: string) => void;
}

export function TaskModal({ task, onClose, onSave, onDelete }: Props) {
  const isEdit = task !== null;
  const isSeries = isEdit && task.seriesId !== null;
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? toDateTimeLocal(new Date(task.dueDate)) : ""
  );
  const [repeats, setRepeats] = useState(false);
  const [repeatCount, setRepeatCount] = useState(isSeries ? 1 : 2);
  const [repeatInterval, setRepeatInterval] = useState(task?.repeatInterval ?? 1);
  const [repeatUnit, setRepeatUnit] = useState(task?.repeatUnit ?? "day");
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
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
      if (isEdit) {
        const saved = await updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        });
        onSave(saved);
        if (repeats) {
          if (isSeries) {
            // Add more to existing series — backend finds the last item
            const items = await createTask({
              title: title.trim(),
              ...(description.trim() && { description: description.trim() }),
              seriesId: task.seriesId!,
              repeatCount,
              repeatInterval,
              repeatUnit,
              ...(repeatDays.length > 0 && { repeatDays }),
            });
            items.forEach((item) => onSave(item));
          } else if (dueDate) {
            // Start a new series from this task's due date
            const nextDate = addInterval(new Date(dueDate), repeatInterval, repeatUnit);
            const items = await createTask({
              title: title.trim(),
              ...(description.trim() && { description: description.trim() }),
              dueDate: nextDate.toISOString(),
              repeatCount,
              repeatInterval,
              repeatUnit,
            });
            items.forEach((item) => onSave(item));
          }
        }
      } else {
        const items = await createTask({
          title: title.trim(),
          ...(description.trim() && { description: description.trim() }),
          ...(dueDate && { dueDate: new Date(dueDate).toISOString() }),
          ...(repeats && { repeatCount, repeatInterval, repeatUnit }),
          ...(repeats && repeatDays.length > 0 && { repeatDays }),
        });
        items.forEach((item) => onSave(item));
      }
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
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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
              onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch { /* unsupported */ } }}
              className="w-full px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-green-50/60 dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
            />
            <div className="h-72" />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={repeats}
                onChange={(e) => setRepeats(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isSeries ? "Add more occurrences" : "Repeating"}
              </span>
            </label>
            {repeats && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20">
                    {isSeries ? "Additional" : isEdit ? "Additional" : "Occurrences"}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={repeatCount}
                    onChange={(e) => setRepeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap gap-1">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRepeatDays((prev) => prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort((a, b) => a - b))}
                        className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${repeatDays.includes(i) ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-1.5">
                    <button type="button" onClick={() => setRepeatDays([1, 2, 3, 4, 5])} className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400">Weekdays</button>
                    <button type="button" onClick={() => setRepeatDays([0, 6])} className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400">Weekends</button>
                    {repeatDays.length > 0 && (
                      <button type="button" onClick={() => setRepeatDays([])} className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400">Clear</button>
                    )}
                  </div>
                </div>
                {repeatDays.length === 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Repeat every</span>
                    <input
                      type="number"
                      min={1}
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                    />
                    <select
                      value={repeatUnit}
                      onChange={(e) => setRepeatUnit(e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="day">day(s)</option>
                      <option value="week">week(s)</option>
                      <option value="month">month(s)</option>
                      <option value="year">year(s)</option>
                    </select>
                  </div>
                )}
              </div>
            )}
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

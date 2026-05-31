import { useState, useEffect, type FormEvent } from "react";
import {
  createReminder,
  updateReminder,
  deleteReminder,
  deleteReminderSeries,
  createCategory,
  deleteCategory,
  type ApiReminder,
  type ApiReminderCategory,
} from "../../api/reminders";
import { DateTimePicker } from "../DateTimePicker";

function toDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


interface Props {
  reminder: ApiReminder | null;
  categories: ApiReminderCategory[];
  onClose: () => void;
  onSave: (reminder: ApiReminder) => void;
  onDelete: (id: string) => void;
  onDeleteSeries?: (seriesId: string) => void;
  onCategoriesChange: (categories: ApiReminderCategory[]) => void;
}

export function ReminderModal({ reminder, categories, onClose, onSave, onDelete, onDeleteSeries, onCategoriesChange }: Props) {
  const isEdit = reminder !== null;
  const isSeries = isEdit && reminder.seriesId !== null;
  const [title, setTitle] = useState(reminder?.title ?? "");
  const [scheduledTime, setScheduledTime] = useState(
    reminder?.scheduledTime ? toDateTimeLocal(reminder.scheduledTime) : ""
  );
  const [categoryId, setCategoryId] = useState(reminder?.categoryId ?? "");
  const [repeats, setRepeats] = useState(false);
  const [repeatCount, setRepeatCount] = useState(isSeries ? 1 : 2);
  const [repeatInterval, setRepeatInterval] = useState(reminder?.repeatInterval ?? 1);
  const [repeatUnit, setRepeatUnit] = useState(reminder?.repeatUnit ?? "day");
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategoryLoading, setAddingCategoryLoading] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [confirmingCategoryId, setConfirmingCategoryId] = useState<string | null>(null);

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
        const saved = await updateReminder(reminder.id, {
          title: title.trim(),
          scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : null,
          categoryId: categoryId || null,
        });
        onSave(saved);
        if (repeats && isSeries) {
          const items = await createReminder({
            title: title.trim(),
            ...(categoryId && { categoryId }),
            seriesId: reminder.seriesId!,
            repeatCount,
            repeatInterval,
            repeatUnit,
            ...(repeatDays.length > 0 && { repeatDays, timezoneOffset: new Date().getTimezoneOffset() }),
          });
          items.forEach((item) => onSave(item));
        }
      } else {
        const items = await createReminder({
          title: title.trim(),
          ...(scheduledTime && { scheduledTime: new Date(scheduledTime).toISOString() }),
          ...(categoryId && { categoryId }),
          ...(repeats && { repeatCount, repeatInterval, repeatUnit }),
          ...(repeats && repeatDays.length > 0 && { repeatDays, timezoneOffset: new Date().getTimezoneOffset() }),
        });
        items.forEach((item) => onSave(item));
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? "Failed to save reminder" : "Failed to create reminder");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!reminder) return;
    setDeleting(true);
    setError("");
    try {
      await deleteReminder(reminder.id);
      onDelete(reminder.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete reminder");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteSeries() {
    if (!reminder?.seriesId) return;
    setDeleting(true);
    setError("");
    try {
      await deleteReminderSeries(reminder.seriesId);
      onDeleteSeries?.(reminder.seriesId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete series");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    setAddingCategoryLoading(true);
    try {
      const cat = await createCategory(newCategoryName.trim());
      const updated = [...categories, cat].sort((a, b) => a.name.localeCompare(b.name));
      onCategoriesChange(updated);
      setCategoryId(cat.id);
      setAddingCategory(false);
      setNewCategoryName("");
    } catch {
      // user can retry
    } finally {
      setAddingCategoryLoading(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    setDeletingCategoryId(id);
    try {
      await deleteCategory(id);
      onCategoriesChange(categories.filter((c) => c.id !== id));
      if (categoryId === id) setCategoryId("");
      setConfirmingCategoryId(null);
    } catch {
      // user can retry
    } finally {
      setDeletingCategoryId(null);
    }
  }

  const userCategories = categories.filter((c) => c.userId !== null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? "Edit reminder" : "New reminder"}
          </h2>
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
              placeholder="Reminder title"
              autoFocus
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${error ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheduled time</label>
            <DateTimePicker value={scheduledTime} onChange={setScheduledTime} accent="amber" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {!addingCategory ? (
              <button
                type="button"
                onClick={() => setAddingCategory(true)}
                className="mt-1.5 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 font-medium"
              >
                + Add new category
              </button>
            ) : (
              <div className="flex gap-2 mt-1.5">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                  placeholder="Category name"
                  autoFocus
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={addingCategoryLoading || !newCategoryName.trim()}
                  className="px-2 py-1 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50"
                >
                  {addingCategoryLoading ? "Adding…" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingCategory(false); setNewCategoryName(""); }}
                  className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {(!isEdit || isSeries) && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={repeats}
                  onChange={(e) => setRepeats(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isSeries ? "Add more occurrences" : "Repeating"}
                </span>
              </label>
              {repeats && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-20">
                      {isSeries ? "Additional" : "Occurrences"}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((label, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRepeatDays((prev) => prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort((a, b) => a - b))}
                          className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${repeatDays.includes(i) ? "bg-amber-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-1.5">
                      <button type="button" onClick={() => setRepeatDays([1, 2, 3, 4, 5])} className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400">Weekdays</button>
                      <button type="button" onClick={() => setRepeatDays([0, 6])} className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400">Weekends</button>
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
                        className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                      />
                      <select
                        value={repeatUnit}
                        onChange={(e) => setRepeatUnit(e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          )}

          <div className="flex items-center justify-between pt-2">
            {isEdit ? (
              confirmingDelete ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Delete this reminder?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Just this one"}
                  </button>
                  {isSeries && (
                    <button
                      type="button"
                      onClick={handleDeleteSeries}
                      disabled={deleting}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
                    >
                      All in series
                    </button>
                  )}
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
                className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving…" : isEdit ? "Save changes" : "Create reminder"}
              </button>
            </div>
          </div>
        </form>

        {userCategories.length > 0 && (
          <div className="px-6 pb-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-3 mb-2">
              Manage categories
            </p>
            <div className="space-y-1">
              {userCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                  {confirmingCategoryId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Delete?</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        disabled={deletingCategoryId === cat.id}
                        className="text-xs font-medium text-white bg-red-600 px-2 py-0.5 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {deletingCategoryId === cat.id ? "Deleting…" : "Yes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingCategoryId(null)}
                        className="text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-2 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingCategoryId(cat.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

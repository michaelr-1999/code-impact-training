import { useState, useEffect, type FormEvent } from "react";
import {
  createReminder,
  updateReminder,
  deleteReminder,
  createCategory,
  deleteCategory,
  type ApiReminder,
  type ApiReminderCategory,
} from "../../api/reminders";

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
  onCategoriesChange: (categories: ApiReminderCategory[]) => void;
}

export function ReminderModal({ reminder, categories, onClose, onSave, onDelete, onCategoriesChange }: Props) {
  const isEdit = reminder !== null;
  const [title, setTitle] = useState(reminder?.title ?? "");
  const [scheduledTime, setScheduledTime] = useState(
    reminder?.scheduledTime ? toDateTimeLocal(reminder.scheduledTime) : ""
  );
  const [categoryId, setCategoryId] = useState(reminder?.categoryId ?? "");
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
      let saved: ApiReminder;
      if (isEdit) {
        saved = await updateReminder(reminder.id, {
          title: title.trim(),
          scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : null,
          categoryId: categoryId || null,
        });
      } else {
        saved = await createReminder({
          title: title.trim(),
          ...(scheduledTime && { scheduledTime: new Date(scheduledTime).toISOString() }),
          ...(categoryId && { categoryId }),
        });
      }
      onSave(saved);
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit reminder" : "New reminder"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (error) setError(""); }}
              placeholder="Reminder title"
              autoFocus
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${error ? "border-red-400" : "border-gray-300"}`}
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled time</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
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
                className="mt-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium"
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
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="px-2 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            {isEdit ? (
              confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Delete this reminder?</span>
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
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Delete
                </button>
              )
            ) : <div />}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
          <div className="px-6 pb-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">
              Manage categories
            </p>
            <div className="space-y-1">
              {userCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700">{cat.name}</span>
                  {confirmingCategoryId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Delete?</span>
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
                        className="text-xs font-medium text-gray-600 border border-gray-300 px-2 py-0.5 rounded hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingCategoryId(cat.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
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

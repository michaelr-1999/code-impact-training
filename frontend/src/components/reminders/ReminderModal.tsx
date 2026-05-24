import { useState, useEffect, type FormEvent } from "react";
import { createReminder, type ApiReminder, type ApiReminderCategory } from "../../api/reminders";

interface Props {
  categories: ApiReminderCategory[];
  onClose: () => void;
  onSave: (reminder: ApiReminder) => void;
}

export function ReminderModal({ categories, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      const saved = await createReminder({
        title: title.trim(),
        ...(scheduledTime && { scheduledTime: new Date(scheduledTime).toISOString() }),
        ...(categoryId && { categoryId }),
      });
      onSave(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create reminder");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New reminder</h2>
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
          </div>
          <div className="flex justify-end gap-3 pt-2">
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
              {submitting ? "Creating…" : "Create reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

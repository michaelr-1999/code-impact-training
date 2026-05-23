import { useState, useEffect, type FormEvent } from "react";
import { getAllReminders, createReminder, type ApiReminder } from "../api/reminders";

function formatDate(iso: string | null) {
  if (!iso) return "No scheduled time";
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ApiReminder[]>([]);
  const [title, setTitle] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAllReminders().then(setReminders).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const reminder = await createReminder({
        title: title.trim(),
        scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : undefined,
      });
      setReminders((prev) => [reminder, ...prev]);
      setTitle("");
      setScheduledTime("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reminders</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow p-4 mb-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">New Reminder</h2>
        <input
          type="text"
          placeholder="Reminder title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <div>
          <label className="block text-xs text-gray-500 mb-1">Scheduled time (optional)</label>
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Adding…" : "Add Reminder"}
        </button>
      </form>

      <div className="space-y-2">
        {reminders.length === 0 && (
          <p className="text-sm text-gray-500">No reminders yet.</p>
        )}
        {reminders.map((reminder) => (
          <div key={reminder.id} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
              <p className="text-xs text-gray-500">{formatDate(reminder.scheduledTime)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

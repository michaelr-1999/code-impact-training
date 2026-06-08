import { useState, useEffect } from "react";
import {
  getAllReminders,
  getCategories,
  markReminderDone,
  markReminderUndone,
  type ApiReminder,
  type ApiReminderCategory,
} from "../api/reminders";
import { CategorySection } from "../components/reminders/CategorySection";
import { ReminderItem } from "../components/reminders/ReminderItem";
import { ReminderModal } from "../components/reminders/ReminderModal";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ApiReminder[]>([]);
  const [categories, setCategories] = useState<ApiReminderCategory[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editReminder, setEditReminder] = useState<ApiReminder | null>(null);

  useEffect(() => {
    Promise.all([getAllReminders(), getCategories()])
      .then(([r, c]) => {
        setReminders(r);
        setCategories(c);
      })
      .catch(() => {});
  }, []);

  function openCreate() {
    setEditReminder(null);
    setModalOpen(true);
  }

  function openEdit(reminder: ApiReminder) {
    setEditReminder(reminder);
    setModalOpen(true);
  }

  function handleSave(reminder: ApiReminder) {
    setReminders((prev) => {
      const idx = prev.findIndex((r) => r.id === reminder.id);
      if (idx >= 0) return prev.map((r) => (r.id === reminder.id ? reminder : r));
      return [reminder, ...prev];
    });
  }

  function handleDelete(id: string) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  function handleDeleteSeries(seriesId: string) {
    setReminders((prev) => prev.filter((r) => r.seriesId !== seriesId));
  }

  async function handleToggle(reminder: ApiReminder) {
    const wasDone = reminder.isDone;
    setReminders((prev) =>
      prev.map((r) => (r.id === reminder.id ? { ...r, isDone: !wasDone } : r))
    );
    try {
      const updated = wasDone
        ? await markReminderUndone(reminder.id)
        : await markReminderDone(reminder.id);
      setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      setReminders((prev) =>
        prev.map((r) => (r.id === reminder.id ? { ...r, isDone: wasDone } : r))
      );
    }
  }

  const now = new Date();
  const active = reminders.filter((r) => !r.isDone);
  const done = reminders.filter((r) => r.isDone);

  const overdue = active.filter((r) => r.scheduledTime && new Date(r.scheduledTime) < now);
  const overdueIds = new Set(overdue.map((r) => r.id));
  const nonOverdueActive = active.filter((r) => !overdueIds.has(r.id));
  const uncategorizedActive = nonOverdueActive.filter((r) => r.categoryId === null);

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reminders</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 font-medium"
          >
            {showCompleted ? "Hide completed" : "Show completed"}
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Create reminder
          </button>
        </div>
      </div>

      {overdue.length > 0 && (
        <CategorySection
          name="Overdue"
          reminders={overdue}
          onToggle={handleToggle}
          onEdit={openEdit}
          variant="overdue"
        />
      )}

      {categories.map((cat) => (
        <CategorySection
          key={cat.id}
          name={cat.name}
          reminders={nonOverdueActive.filter((r) => r.categoryId === cat.id)}
          onToggle={handleToggle}
          onEdit={openEdit}
        />
      ))}

      {uncategorizedActive.length > 0 && (
        <CategorySection
          name="Uncategorized"
          reminders={uncategorizedActive}
          onToggle={handleToggle}
          onEdit={openEdit}
        />
      )}

      {showCompleted && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Completed
          </h2>
          {done.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No completed reminders.</p>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-4 py-2">
              {done.map((r) => (
                <ReminderItem key={r.id} reminder={r} onToggle={handleToggle} onEdit={openEdit} />
              ))}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <ReminderModal
          reminder={editReminder}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
          onDeleteSeries={handleDeleteSeries}
          onCategoriesChange={setCategories}
        />
      )}
    </div>
  );
}

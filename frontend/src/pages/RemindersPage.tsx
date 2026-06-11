import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useToast } from "../context/ToastContext";

function RemindersSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {([2, 3] as const).map((count, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-28 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, j) => (
              <div key={j} className="h-8 bg-gray-100 dark:bg-gray-800 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [reminders, setReminders] = useState<ApiReminder[]>([]);
  const [categories, setCategories] = useState<ApiReminderCategory[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editReminder, setEditReminder] = useState<ApiReminder | null>(null);
  const toast = useToast();

  useEffect(() => {
    const targetId = editId;
    Promise.all([getAllReminders(), getCategories()])
      .then(([loadedReminders, c]) => {
        setReminders(loadedReminders);
        setCategories(c);
        if (targetId) {
          const reminder = loadedReminders.find((r) => r.id === targetId);
          if (reminder) {
            setEditReminder(reminder);
            setModalOpen(true);
            setSearchParams({}, { replace: true });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    toast("Reminder saved");
  }

  function handleDelete(id: string) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    toast("Reminder deleted", "info");
  }

  function handleDeleteSeries(seriesId: string) {
    setReminders((prev) => prev.filter((r) => r.seriesId !== seriesId));
    toast("Series deleted", "info");
  }

  async function handleToggle(reminder: ApiReminder) {
    const wasDone = reminder.isDone;
    setReminders((prev) =>
      prev.map((r) => (r.id === reminder.id ? { ...r, isDone: !wasDone } : r))
    );
    toast(wasDone ? "Reminder marked undone" : "Reminder done");
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
      <PageHeader
        icon={Bell}
        gradient="from-amber-400 to-orange-500"
        title="Reminders"
        actions={
          <>
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 font-medium transition-colors"
            >
              {showCompleted ? "Hide completed" : "Show completed"}
            </button>
            <button
              onClick={openCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
            >
              Create reminder
            </button>
          </>
        }
      />

      {loading ? <RemindersSkeleton /> : <>
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
      </>}

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

      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}

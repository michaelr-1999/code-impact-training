import { motion } from "framer-motion";
import type { ApiReminder } from "../../api/reminders";

interface Props {
  reminder: ApiReminder;
  onToggle: (reminder: ApiReminder) => void;
  onEdit: (reminder: ApiReminder) => void;
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ReminderItem({ reminder, onToggle, onEdit }: Props) {
  const time = formatTime(reminder.scheduledTime);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.18 }}
      className={`flex items-center gap-3 py-2 pl-2 border-l-[3px] rounded-r-sm transition-colors duration-150 hover:bg-amber-50 dark:hover:bg-amber-900/10 ${
        reminder.isDone ? "border-l-gray-200 dark:border-l-gray-700" : "border-l-amber-400 dark:border-l-amber-500"
      }`}
    >
      <input
        type="checkbox"
        checked={reminder.isDone}
        onChange={() => onToggle(reminder)}
        className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer shrink-0"
      />
      <button
        type="button"
        onClick={() => onEdit(reminder)}
        className={`text-sm flex-1 text-left hover:underline ${reminder.isDone ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}
      >
        {reminder.title}
      </button>
      {time && <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{time}</span>}
    </motion.div>
  );
}

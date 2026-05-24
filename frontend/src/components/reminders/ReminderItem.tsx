import type { ApiReminder } from "../../api/reminders";

interface Props {
  reminder: ApiReminder;
  onToggle: (reminder: ApiReminder) => void;
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ReminderItem({ reminder, onToggle }: Props) {
  const time = formatTime(reminder.scheduledTime);
  return (
    <div className="flex items-center gap-3 py-2">
      <input
        type="checkbox"
        checked={reminder.isDone}
        onChange={() => onToggle(reminder)}
        className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer shrink-0"
      />
      <span className={`text-sm flex-1 ${reminder.isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
        {reminder.title}
      </span>
      {time && <span className="text-xs text-gray-400 shrink-0">{time}</span>}
    </div>
  );
}

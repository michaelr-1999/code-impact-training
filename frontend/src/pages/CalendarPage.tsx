import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent, updateEvent, deleteEvent, type ApiEvent } from "../api/events";
import type { ApiTask } from "../api/tasks";
import type { ApiReminder } from "../api/reminders";
import { getCalendarData } from "../api/calendar";
import { calendarColors } from "../lib/calendarColors";

const DAYS_OF_WEEK_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAYS_OF_WEEK_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

type View = "month" | "week" | "day";

type CalendarEvent = ApiEvent;

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function toDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Create event modal ────────────────────────────────────────────────────────

function CreateEventModal({ defaultDate, onClose, onSubmit }: {
  defaultDate: Date;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; start: string; end: string; repeatInterval?: number; repeatUnit?: string; repeatCount?: number }) => Promise<void>;
}) {
  const defaultStart = new Date(defaultDate);
  defaultStart.setHours(9, 0, 0, 0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState(toDateTimeLocal(defaultStart));
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState<"minutes" | "hours" | "days" | "weeks" | "months">("hours");
  const [repeats, setRepeats] = useState(false);
  const [repeatCount, setRepeatCount] = useState(2);
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState("day");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    if (durationValue <= 0) { setError("Duration must be greater than 0."); return; }
    setSubmitting(true);
    setError("");
    try {
      const startDate = new Date(start);
      let endDate: Date;
      if (durationUnit === "months") {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + durationValue);
      } else {
        const msMap = { minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000, weeks: 7 * 24 * 60 * 60 * 1000 };
        endDate = new Date(startDate.getTime() + durationValue * msMap[durationUnit as keyof typeof msMap]);
      }
      const end = toDateTimeLocal(endDate);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        start,
        end,
        ...(repeats && { repeatCount, repeatInterval, repeatUnit }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create event</h2>
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
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch { /* unsupported */ } }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
            />
            <div className="h-72" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={durationValue}
                onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as "minutes" | "hours" | "days" | "weeks" | "months")}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="minutes">minute(s)</option>
                <option value="hours">hour(s)</option>
                <option value="days">day(s)</option>
                <option value="weeks">week(s)</option>
                <option value="months">month(s)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={repeats}
                onChange={(e) => setRepeats(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Repeating</span>
            </label>
            {repeats && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Occurrences</span>
                  <input
                    type="number"
                    min={2}
                    max={365}
                    value={repeatCount}
                    onChange={(e) => setRepeatCount(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Repeat every</span>
                  <input
                    type="number"
                    min={1}
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                  <select
                    value={repeatUnit}
                    onChange={(e) => setRepeatUnit(e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="day">day(s)</option>
                    <option value="week">week(s)</option>
                    <option value="month">month(s)</option>
                    <option value="year">year(s)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Event detail / edit modal ─────────────────────────────────────────────────

function EventDetailModal({ event, onClose, onSave, onDelete, onAddMore }: {
  event: CalendarEvent;
  onClose: () => void;
  onSave: (updated: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onAddMore: (items: CalendarEvent[]) => void;
}) {
  const isSeries = event.seriesId !== null;
  const diffMinutes = Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000);
  const diffDays = diffMinutes / (60 * 24);
  const initialUnit: "minutes" | "hours" | "days" | "weeks" | "months" =
    Number.isInteger(diffDays) && diffDays % 30 === 0 ? "months"
    : Number.isInteger(diffDays) && diffDays % 7 === 0 ? "weeks"
    : Number.isInteger(diffDays) ? "days"
    : diffMinutes % 60 === 0 ? "hours"
    : "minutes";
  const initialDuration =
    initialUnit === "months" ? diffDays / 30
    : initialUnit === "weeks" ? diffDays / 7
    : initialUnit === "days" ? diffDays
    : initialUnit === "hours" ? diffMinutes / 60
    : diffMinutes;

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [start, setStart] = useState(toDateTimeLocal(new Date(event.startTime)));
  const [durationValue, setDurationValue] = useState(initialDuration);
  const [durationUnit, setDurationUnit] = useState<"minutes" | "hours" | "days" | "weeks" | "months">(initialUnit);
  const [addMore, setAddMore] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [repeatInterval, setRepeatInterval] = useState(event.repeatInterval ?? 1);
  const [repeatUnit, setRepeatUnit] = useState(event.repeatUnit ?? "day");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      const startDate = new Date(start);
      let endDate: Date;
      if (durationUnit === "months") {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + durationValue);
      } else {
        const msMap = { minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000, weeks: 7 * 24 * 60 * 60 * 1000 };
        endDate = new Date(startDate.getTime() + durationValue * msMap[durationUnit as keyof typeof msMap]);
      }
      const end = toDateTimeLocal(endDate);
      const updated = await updateEvent(event.id, {
        title: title.trim(),
        description: description.trim(),
        start,
        end,
      });
      onSave(updated);
      if (addMore && isSeries) {
        const items = await createEvent({
          seriesId: event.seriesId!,
          repeatCount,
          repeatInterval,
          repeatUnit,
        });
        onAddMore(items);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await deleteEvent(event.id);
      onDelete(event.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit event</h2>
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
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch { /* unsupported */ } }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
            />
            <div className="h-72" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={durationValue}
                onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as "minutes" | "hours" | "days" | "weeks" | "months")}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="minutes">minute(s)</option>
                <option value="hours">hour(s)</option>
                <option value="days">day(s)</option>
                <option value="weeks">week(s)</option>
                <option value="months">month(s)</option>
              </select>
            </div>
          </div>
          {isSeries && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addMore}
                  onChange={(e) => setAddMore(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add more occurrences</span>
              </label>
              {addMore && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Additional</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Repeat every</span>
                    <input
                      type="number"
                      min={1}
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                    />
                    <select
                      value={repeatUnit}
                      onChange={(e) => setRepeatUnit(e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="day">day(s)</option>
                      <option value="week">week(s)</option>
                      <option value="month">month(s)</option>
                      <option value="year">year(s)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-between pt-2">
            {confirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Delete this event?</span>
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
            )}
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({ viewDate, today, events, tasks, reminders, onDayClick, onEventClick, onTaskClick, onReminderClick }: { viewDate: Date; today: Date; events: CalendarEvent[]; tasks: ApiTask[]; reminders: ApiReminder[]; onDayClick: (date: Date) => void; onEventClick: (event: CalendarEvent) => void; onTaskClick: () => void; onReminderClick: () => void }) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; currentMonth: boolean }[] = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, currentMonth: false });
  }

  return (
    <>
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {DAYS_OF_WEEK_SHORT.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const cellDate = new Date(year, month, cell.day);
          const isToday = cell.currentMonth && isSameDay(cellDate, today);
          const cellEvents = cell.currentMonth
            ? events.filter((e) => isSameDay(new Date(e.startTime), cellDate))
            : [];
          const cellTasks = cell.currentMonth
            ? tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), cellDate))
            : [];
          const cellReminders = cell.currentMonth
            ? reminders.filter((r) => r.scheduledTime && isSameDay(new Date(r.scheduledTime), cellDate))
            : [];
          const totalItems = cellEvents.length + cellTasks.length + cellReminders.length;
          return (
            <div
              key={i}
              onClick={() => cell.currentMonth && onDayClick(cellDate)}
              className={`
                min-h-[44px] sm:min-h-[72px] p-1 sm:p-2 border-b border-r border-gray-100 dark:border-gray-800
                ${!cell.currentMonth ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer"}
                ${i % 7 === 6 ? "border-r-0" : ""}
              `}
            >
              <span
                className={`
                  inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm
                  ${isToday ? "bg-blue-600 text-white font-semibold" : ""}
                  ${!isToday && cell.currentMonth ? "text-gray-900 dark:text-white" : ""}
                  ${!isToday && !cell.currentMonth ? "text-gray-400 dark:text-gray-600" : ""}
                `}
              >
                {cell.day}
              </span>
              <div className="mt-0.5 space-y-0.5 hidden sm:block">
                {cellEvents.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                    className={`truncate text-xs px-1 py-0.5 rounded cursor-pointer ${calendarColors.event.pill}`}
                  >
                    {e.title}
                  </div>
                ))}
                {cellTasks.slice(0, Math.max(0, 2 - cellEvents.length)).map((t) => (
                  <div
                    key={t.id}
                    onClick={(ev) => { ev.stopPropagation(); onTaskClick(); }}
                    className={`truncate text-xs px-1 py-0.5 rounded cursor-pointer ${calendarColors.task.pill}`}
                  >
                    {t.title}
                  </div>
                ))}
                {cellReminders.slice(0, Math.max(0, 2 - cellEvents.length - cellTasks.length)).map((r) => (
                  <div
                    key={r.id}
                    onClick={(ev) => { ev.stopPropagation(); onReminderClick(); }}
                    className={`truncate text-xs px-1 py-0.5 rounded cursor-pointer ${calendarColors.reminder.pill}`}
                  >
                    {r.title}
                  </div>
                ))}
                {totalItems > 2 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-1">+{totalItems - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

const CELL_HEIGHT = 48; // px per hour row

function useCurrentTime() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  return new Date(); // called during render — always accurate
}

function minuteOffset() {
  return (new Date().getMinutes() / 60) * CELL_HEIGHT;
}

// ── Week view ─────────────────────────────────────────────────────────────────

function WeekView({ viewDate, today, events, tasks, reminders, onEventClick, onTaskClick, onReminderClick }: { viewDate: Date; today: Date; events: CalendarEvent[]; tasks: ApiTask[]; reminders: ApiReminder[]; onEventClick: (event: CalendarEvent) => void; onTaskClick: () => void; onReminderClick: () => void }) {
  const weekStart = startOfWeek(viewDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * CELL_HEIGHT;
      if (headerRef.current) {
        const scrollbarWidth = scrollRef.current.offsetWidth - scrollRef.current.clientWidth;
        headerRef.current.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
  }, []);

  return (
    <div className="overflow-x-auto">
      {/* Day headers */}
      <div ref={headerRef} className="grid border-b border-gray-200 dark:border-gray-700" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="border-r border-gray-200 dark:border-gray-700" />
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className="py-2 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">{DAYS_OF_WEEK_SHORT[day.getDay()]}</div>
              <div className={`
                mx-auto mt-0.5 w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
                ${isToday ? "bg-blue-600 text-white" : "text-gray-900 dark:text-white"}
              `}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid — default window 8am–8pm (12 rows visible), full 24h scrollable */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ height: `${12 * CELL_HEIGHT}px` }}>
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="grid border-b border-gray-100 dark:border-gray-800" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", height: `${CELL_HEIGHT}px` }}>
              <div className="pr-2 pb-2 text-right text-xs text-gray-400 dark:text-gray-500 border-r border-gray-200 dark:border-gray-700 leading-none">
                {formatHour(hour)}
              </div>
              {days.map((_, i) => (
                <div key={i} className="border-r border-gray-100 dark:border-gray-800 last:border-r-0" />
              ))}
            </div>
          ))}
          {events.flatMap((event) => {
            const eventStart = new Date(event.startTime);
            const eventEnd = new Date(event.endTime);
            return days.flatMap((day, dayIndex) => {
              const dayStart = new Date(day);
              dayStart.setHours(0, 0, 0, 0);
              const dayEnd = new Date(dayStart);
              dayEnd.setDate(dayStart.getDate() + 1);
              if (eventEnd <= dayStart || eventStart >= dayEnd) return [];
              const segStart = eventStart > dayStart ? eventStart : dayStart;
              const segEnd = eventEnd < dayEnd ? eventEnd : dayEnd;
              const dayMs = 86400000;
              const top = ((segStart.getTime() - dayStart.getTime()) / dayMs) * 24 * CELL_HEIGHT;
              const height = Math.max(
                ((segEnd.getTime() - segStart.getTime()) / dayMs) * 24 * CELL_HEIGHT,
                CELL_HEIGHT / 2
              );
              return [(
                <div
                  key={`${event.id}-${dayIndex}`}
                  onClick={() => onEventClick(event)}
                  className={`absolute text-xs rounded px-1 py-0.5 overflow-hidden cursor-pointer ${calendarColors.event.block}`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `calc(56px + ${dayIndex} * (100% - 56px) / 7 + 2px)`,
                    width: `calc((100% - 56px) / 7 - 4px)`,
                  }}
                >
                  {event.title}
                </div>
              )];
            });
          })}
          {tasks.filter((t) => t.dueDate).map((task) => {
            const due = new Date(task.dueDate!);
            const dayIndex = days.findIndex((d) => isSameDay(d, due));
            if (dayIndex === -1) return null;
            const top = (due.getHours() + due.getMinutes() / 60) * CELL_HEIGHT;
            return (
              <div
                key={task.id}
                onClick={onTaskClick}
                className={`absolute text-xs rounded px-1 py-0.5 overflow-hidden cursor-pointer ${calendarColors.task.block}`}
                style={{
                  top: `${top}px`,
                  height: `${CELL_HEIGHT / 2}px`,
                  left: `calc(56px + ${dayIndex} * (100% - 56px) / 7 + 2px)`,
                  width: `calc((100% - 56px) / 7 - 4px)`,
                }}
              >
                {task.title}
              </div>
            );
          })}
          {reminders.filter((r) => r.scheduledTime).map((reminder) => {
            const scheduled = new Date(reminder.scheduledTime!);
            const dayIndex = days.findIndex((d) => isSameDay(d, scheduled));
            if (dayIndex === -1) return null;
            const top = (scheduled.getHours() + scheduled.getMinutes() / 60) * CELL_HEIGHT;
            return (
              <div
                key={reminder.id}
                onClick={onReminderClick}
                className={`absolute text-xs rounded px-1 py-0.5 overflow-hidden cursor-pointer ${calendarColors.reminder.block}`}
                style={{
                  top: `${top}px`,
                  height: `${CELL_HEIGHT / 2}px`,
                  left: `calc(56px + ${dayIndex} * (100% - 56px) / 7 + 2px)`,
                  width: `calc((100% - 56px) / 7 - 4px)`,
                }}
              >
                {reminder.title}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Day view ──────────────────────────────────────────────────────────────────

function DayView({ viewDate, today, events, tasks, reminders, onEventClick, onTaskClick, onReminderClick }: { viewDate: Date; today: Date; events: CalendarEvent[]; tasks: ApiTask[]; reminders: ApiReminder[]; onEventClick: (event: CalendarEvent) => void; onTaskClick: () => void; onReminderClick: () => void }) {
  const isToday = isSameDay(viewDate, today);
  const now = useCurrentTime();
  const currentHour = now.getHours();
  const offset = minuteOffset();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = currentHour * CELL_HEIGHT;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* Day header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className={`
          w-10 h-10 flex items-center justify-center rounded-full text-lg font-semibold
          ${isToday ? "bg-blue-600 text-white" : "text-gray-900 dark:text-white"}
        `}>
          {viewDate.getDate()}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">{DAYS_OF_WEEK_FULL[viewDate.getDay()]}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}</div>
        </div>
      </div>

      {/* Time grid — scrolls to current hour on open */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ height: `${12 * CELL_HEIGHT}px` }}>
        <div className="relative">
          {HOURS.map((hour) => {
            const isCurrentHour = isToday && hour === currentHour;
            return (
              <div key={hour} className={`relative flex border-b border-gray-100 dark:border-gray-800 ${isCurrentHour ? "bg-blue-50 dark:bg-[#0d2818]" : ""}`} style={{ height: `${CELL_HEIGHT}px` }}>
                <div className={`w-14 shrink-0 pr-2 pb-2 text-right text-xs border-r border-gray-200 dark:border-gray-700 leading-none ${isCurrentHour ? "text-blue-600 dark:text-moss font-semibold" : "text-gray-400 dark:text-gray-500"}`}>
                  {formatHour(hour)}
                </div>
                <div className="flex-1" />
                {isCurrentHour && (
                  <div
                    className="absolute left-0 right-0 flex items-center pointer-events-none"
                    style={{ top: `${offset}px` }}
                  >
                    <div className="w-14 shrink-0 flex justify-end pr-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    </div>
                    <div className="flex-1 h-px bg-red-500" />
                  </div>
                )}
              </div>
            );
          })}
          {events.filter((e) => {
            const dayStart = new Date(viewDate); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart); dayEnd.setDate(dayStart.getDate() + 1);
            return new Date(e.endTime) > dayStart && new Date(e.startTime) < dayEnd;
          }).map((event) => {
            const dayStart = new Date(viewDate); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart); dayEnd.setDate(dayStart.getDate() + 1);
            const segStart = new Date(event.startTime) > dayStart ? new Date(event.startTime) : dayStart;
            const segEnd = new Date(event.endTime) < dayEnd ? new Date(event.endTime) : dayEnd;
            const dayMs = 86400000;
            const top = ((segStart.getTime() - dayStart.getTime()) / dayMs) * 24 * CELL_HEIGHT;
            const height = Math.max(
              ((segEnd.getTime() - segStart.getTime()) / dayMs) * 24 * CELL_HEIGHT,
              CELL_HEIGHT / 2
            );
            return (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className={`absolute text-xs rounded px-2 py-0.5 overflow-hidden cursor-pointer ${calendarColors.event.block}`}
                style={{ top: `${top}px`, height: `${height}px`, left: "56px", right: "4px" }}
              >
                {event.title}
              </div>
            );
          })}
          {tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), viewDate)).map((task) => {
            const due = new Date(task.dueDate!);
            const top = (due.getHours() + due.getMinutes() / 60) * CELL_HEIGHT;
            return (
              <div
                key={task.id}
                onClick={onTaskClick}
                className={`absolute text-xs rounded px-2 py-0.5 overflow-hidden cursor-pointer ${calendarColors.task.block}`}
                style={{ top: `${top}px`, height: `${CELL_HEIGHT / 2}px`, left: "56px", right: "4px" }}
              >
                {task.title}
              </div>
            );
          })}
          {reminders.filter((r) => r.scheduledTime && isSameDay(new Date(r.scheduledTime), viewDate)).map((reminder) => {
            const scheduled = new Date(reminder.scheduledTime!);
            const top = (scheduled.getHours() + scheduled.getMinutes() / 60) * CELL_HEIGHT;
            return (
              <div
                key={reminder.id}
                onClick={onReminderClick}
                className={`absolute text-xs rounded px-2 py-0.5 overflow-hidden cursor-pointer ${calendarColors.reminder.block}`}
                style={{ top: `${top}px`, height: `${CELL_HEIGHT / 2}px`, left: "56px", right: "4px" }}
              >
                {reminder.title}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Header label ──────────────────────────────────────────────────────────────

function headerLabel(view: View, viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  if (view === "month") return `${MONTH_NAMES[month]} ${year}`;
  if (view === "week") {
    const ws = startOfWeek(viewDate);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    if (ws.getMonth() === we.getMonth()) {
      return `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()}–${we.getDate()}, ${year}`;
    }
    return `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()} – ${MONTH_NAMES[we.getMonth()]} ${we.getDate()}, ${year}`;
  }
  return `${MONTH_NAMES[month]} ${viewDate.getDate()}, ${year}`;
}

function navDate(view: View, viewDate: Date, dir: 1 | -1): Date {
  const d = new Date(viewDate);
  if (view === "month") return new Date(d.getFullYear(), d.getMonth() + dir, 1);
  if (view === "week") { d.setDate(d.getDate() + dir * 7); return d; }
  d.setDate(d.getDate() + dir);
  return d;
}

function getVisibleRange(view: View, viewDate: Date): { start: Date; end: Date } {
  if (view === "day") {
    const start = new Date(viewDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(viewDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (view === "week") {
    const start = startOfWeek(viewDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  // month: full 6-week grid shown
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 - firstDayOfMonth);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 41);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("month");
  const [viewDate, setViewDate] = useState(today);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [reminders, setReminders] = useState<ApiReminder[]>([]);

  useEffect(() => {
    const { start, end } = getVisibleRange(view, viewDate);
    getCalendarData(start.toISOString(), end.toISOString())
      .then(({ events, tasks, reminders }) => {
        setEvents(events);
        setTasks(tasks);
        setReminders(reminders);
      })
      .catch(() => {});
  }, [view, viewDate]);

  async function handleSubmit(data: { title: string; description: string; start: string; end: string; repeatInterval?: number; repeatUnit?: string; repeatCount?: number }) {
    const created = await createEvent(data);
    setEvents((prev) => [...prev, ...created]);
  }

  function handleSave(updated: CalendarEvent) {
    setEvents((prev) => prev.map((e) => e.id === updated.id ? updated : e));
  }

  function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function handleAddMore(items: CalendarEvent[]) {
    setEvents((prev) => [...prev, ...items]);
  }

  const views: { key: View; label: string }[] = [
    { key: "month", label: "Month" },
    { key: "week", label: "Week" },
    { key: "day", label: "Day" },
  ];

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create
          </button>
        </div>

        {/* View switcher */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden self-start sm:self-auto">
          {views.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`
                px-3 py-1.5 text-sm font-medium transition-colors
                ${view === key
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden w-full max-w-3xl">
        {/* Navigation header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setViewDate(navDate(view, viewDate, -1))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-xl leading-none"
            aria-label="Previous"
          >
            &#8249;
          </button>
          <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {headerLabel(view, viewDate)}
          </span>
          <button
            onClick={() => setViewDate(navDate(view, viewDate, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-xl leading-none"
            aria-label="Next"
          >
            &#8250;
          </button>
        </div>

        {view === "month" && <MonthView viewDate={viewDate} today={today} events={events} tasks={tasks} reminders={reminders} onDayClick={(date) => { setViewDate(date); setView("day"); }} onEventClick={setSelectedEvent} onTaskClick={() => navigate("/tasks")} onReminderClick={() => navigate("/reminders")} />}
        {view === "week" && <WeekView viewDate={viewDate} today={today} events={events} tasks={tasks} reminders={reminders} onEventClick={setSelectedEvent} onTaskClick={() => navigate("/tasks")} onReminderClick={() => navigate("/reminders")} />}
        {view === "day" && <DayView viewDate={viewDate} today={today} events={events} tasks={tasks} reminders={reminders} onEventClick={setSelectedEvent} onTaskClick={() => navigate("/tasks")} onReminderClick={() => navigate("/reminders")} />}
      </div>

      {showCreateModal && (
        <CreateEventModal
          defaultDate={viewDate}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleSubmit}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          onAddMore={handleAddMore}
        />
      )}
    </div>
  );
}

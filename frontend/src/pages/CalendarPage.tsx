import { useState, useEffect, useRef, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { createEvent, updateEvent, deleteEvent, deleteEventSeries, type ApiEvent } from "../api/events";
import { DateTimePicker } from "../components/DateTimePicker";
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

function formatBlockTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
  onSubmit: (data: { title: string; description: string; start: string; end: string; repeatInterval?: number; repeatUnit?: string; repeatCount?: number; repeatDays?: number[]; timezoneOffset?: number }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState(() => {
    const nextHour = new Date(Math.ceil(Date.now() / 3600000) * 3600000);
    const d = new Date(defaultDate);
    d.setHours(nextHour.getHours(), 0, 0, 0);
    return toDateTimeLocal(d);
  });
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [durationHours, setDurationHours] = useState(0);
  const [durationDays, setDurationDays] = useState(0);
  const [durationWeeks, setDurationWeeks] = useState(0);
  const [durationMonths, setDurationMonths] = useState(0);
  const [repeats, setRepeats] = useState(false);
  const [repeatCount, setRepeatCount] = useState(2);
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState("day");
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    if (durationMonths === 0 && durationWeeks === 0 && durationDays === 0 && durationHours === 0 && durationMinutes === 0) {
      setError("Duration must be greater than 0.");
      return;
    }
    if (new Date(start) < new Date()) {
      setError("Start time cannot be in the past.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const startDate = new Date(start);
      let endDate = new Date(startDate);
      if (durationMonths > 0) endDate.setMonth(endDate.getMonth() + durationMonths);
      endDate = new Date(endDate.getTime() +
        durationWeeks * 7 * 24 * 60 * 60 * 1000 +
        durationDays * 24 * 60 * 60 * 1000 +
        durationHours * 60 * 60 * 1000 +
        durationMinutes * 60 * 1000
      );
      const end = toDateTimeLocal(endDate);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        start,
        end,
        ...(repeats && { repeatCount, repeatInterval, repeatUnit }),
        ...(repeats && repeatDays.length > 0 && { repeatDays, timezoneOffset: new Date().getTimezoneOffset() }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
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
          <hr className="border-t border-gray-100 dark:border-gray-700" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start <span className="text-red-500">*</span>
            </label>
            <DateTimePicker value={start} onChange={setStart} accent="blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
            <div className="flex flex-wrap gap-3">
              {([
                ["Min", durationMinutes, setDurationMinutes],
                ["Hours", durationHours, setDurationHours],
                ["Days", durationDays, setDurationDays],
                ["Weeks", durationWeeks, setDurationWeeks],
                ["Months", durationMonths, setDurationMonths],
              ] as [string, number, (v: number) => void][]).map(([label, value, setter]) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                  <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) => setter(Math.max(0, parseInt(e.target.value) || 0))}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-16 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                </div>
              ))}
            </div>
          </div>
          <hr className="border-t border-gray-100 dark:border-gray-700" />
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
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap gap-1">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRepeatDays((prev) => prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort((a, b) => a - b))}
                        className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${repeatDays.includes(i) ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-1.5">
                    <button type="button" onClick={() => setRepeatDays([1, 2, 3, 4, 5])} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">Weekdays</button>
                    <button type="button" onClick={() => setRepeatDays([0, 6])} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">Weekends</button>
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
                      onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
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
                )}
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
      </motion.div>
    </motion.div>
  );
}

// ── Event detail / edit modal ─────────────────────────────────────────────────

function EventDetailModal({ event, onClose, onSave, onDelete, onDeleteSeries, onAddMore }: {
  event: CalendarEvent;
  onClose: () => void;
  onSave: (updated: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onDeleteSeries?: (seriesId: string) => void;
  onAddMore: (items: CalendarEvent[]) => void;
}) {
  const isSeries = event.seriesId !== null;
  const totalMinutes = Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000);
  const initWeeks = Math.floor(totalMinutes / (7 * 24 * 60));
  const initDays = Math.floor((totalMinutes % (7 * 24 * 60)) / (24 * 60));
  const initHours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const initMins = totalMinutes % 60;

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [start, setStart] = useState(toDateTimeLocal(new Date(event.startTime)));
  const [durationMinutes, setDurationMinutes] = useState(initMins);
  const [durationHours, setDurationHours] = useState(initHours);
  const [durationDays, setDurationDays] = useState(initDays);
  const [durationWeeks, setDurationWeeks] = useState(initWeeks);
  const [durationMonths, setDurationMonths] = useState(0);
  const [addMore, setAddMore] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [repeatInterval, setRepeatInterval] = useState(event.repeatInterval ?? 1);
  const [repeatUnit, setRepeatUnit] = useState(event.repeatUnit ?? "day");
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
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
      let endDate = new Date(startDate);
      if (durationMonths > 0) endDate.setMonth(endDate.getMonth() + durationMonths);
      endDate = new Date(endDate.getTime() +
        durationWeeks * 7 * 24 * 60 * 60 * 1000 +
        durationDays * 24 * 60 * 60 * 1000 +
        durationHours * 60 * 60 * 1000 +
        durationMinutes * 60 * 1000
      );
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
          ...(repeatDays.length > 0 && { repeatDays, timezoneOffset: new Date().getTimezoneOffset() }),
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

  async function handleDeleteSeries() {
    if (!event.seriesId) return;
    setDeleting(true);
    setError("");
    try {
      await deleteEventSeries(event.seriesId);
      onDeleteSeries?.(event.seriesId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete series");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
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
          <hr className="border-t border-gray-100 dark:border-gray-700" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start <span className="text-red-500">*</span>
            </label>
            <DateTimePicker value={start} onChange={setStart} accent="blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
            <div className="flex flex-wrap gap-3">
              {([
                ["Min", durationMinutes, setDurationMinutes],
                ["Hours", durationHours, setDurationHours],
                ["Days", durationDays, setDurationDays],
                ["Weeks", durationWeeks, setDurationWeeks],
                ["Months", durationMonths, setDurationMonths],
              ] as [string, number, (v: number) => void][]).map(([label, value, setter]) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                  <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) => setter(Math.max(0, parseInt(e.target.value) || 0))}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-16 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                </div>
              ))}
            </div>
          </div>
          <hr className="border-t border-gray-100 dark:border-gray-700" />
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
                      onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((label, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRepeatDays((prev) => prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort((a, b) => a - b))}
                          className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${repeatDays.includes(i) ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-1.5">
                      <button type="button" onClick={() => setRepeatDays([1, 2, 3, 4, 5])} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">Weekdays</button>
                      <button type="button" onClick={() => setRepeatDays([0, 6])} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">Weekends</button>
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
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
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
                  )}
                </div>
              )}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-between pt-2">
            {confirmingDelete ? (
              <div className="flex flex-col gap-2 w-full">
                <span className="text-sm text-gray-600 dark:text-gray-400">Delete this event?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="whitespace-nowrap px-2.5 py-1 text-xs font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Just this one"}
                  </button>
                  {isSeries && (
                    <button
                      type="button"
                      onClick={handleDeleteSeries}
                      disabled={deleting}
                      className="whitespace-nowrap px-2.5 py-1 text-xs font-medium text-white bg-red-700 border border-transparent rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
                    >
                      All in series
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="whitespace-nowrap px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="whitespace-nowrap ml-auto px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Saving…" : "Save changes"}
                  </button>
                </div>
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
            {!confirmingDelete && (
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
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({ viewDate, today, events, tasks, reminders, onDayClick, onEventClick, onTaskClick, onReminderClick }: { viewDate: Date; today: Date; events: CalendarEvent[]; tasks: ApiTask[]; reminders: ApiReminder[]; onDayClick: (date: Date) => void; onEventClick: (event: CalendarEvent) => void; onTaskClick: (task: ApiTask) => void; onReminderClick: (reminder: ApiReminder) => void }) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; currentMonth: boolean }[] = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, currentMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, currentMonth: true });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, currentMonth: false });

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
          const cellDayStart = cellDate;
          const cellDayEnd = new Date(year, month, cell.day + 1);
          const isToday = cell.currentMonth && isSameDay(cellDate, today);
          const cellEvents = cell.currentMonth
            ? events.filter((e) => {
                const s = new Date(e.startTime);
                const en = new Date(e.endTime);
                return s < cellDayEnd && en > cellDayStart;
              })
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
                ${!cell.currentMonth ? "bg-gray-50 dark:bg-gray-800" : isToday ? "bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 cursor-pointer" : "bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer"}
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
                    onClick={(ev) => { ev.stopPropagation(); onTaskClick(t); }}
                    className={`truncate text-xs px-1 py-0.5 rounded cursor-pointer ${calendarColors.task.pill}`}
                  >
                    {t.title}
                  </div>
                ))}
                {cellReminders.slice(0, Math.max(0, 2 - cellEvents.length - cellTasks.length)).map((r) => (
                  <div
                    key={r.id}
                    onClick={(ev) => { ev.stopPropagation(); onReminderClick(r); }}
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


function computeOverlapLayout(
  items: { key: string; top: number; height: number }[]
): Map<string, { columnIndex: number; totalColumns: number }> {
  if (items.length === 0) return new Map();
  const sorted = [...items].sort((a, b) => a.top - b.top);
  const colEnds: number[] = [];
  const cols: number[] = [];
  for (const item of sorted) {
    let col = colEnds.findIndex((end) => end <= item.top);
    if (col === -1) { col = colEnds.length; colEnds.push(0); }
    colEnds[col] = item.top + item.height;
    cols.push(col);
  }
  const n = sorted.length;
  const visited = new Array(n).fill(false);
  const result = new Map<string, { columnIndex: number; totalColumns: number }>();
  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    const cluster: number[] = [];
    const queue = [i];
    visited[i] = true;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      cluster.push(curr);
      for (let j = 0; j < n; j++) {
        if (!visited[j] && sorted[curr].top < sorted[j].top + sorted[j].height && sorted[j].top < sorted[curr].top + sorted[curr].height) {
          visited[j] = true;
          queue.push(j);
        }
      }
    }
    const maxCol = Math.max(...cluster.map((k) => cols[k]));
    for (const k of cluster) {
      result.set(sorted[k].key, { columnIndex: cols[k], totalColumns: maxCol + 1 });
    }
  }
  return result;
}

// ── Week view ─────────────────────────────────────────────────────────────────

function WeekView({ viewDate, today, events, tasks, reminders, onEventClick, onTaskClick, onReminderClick }: { viewDate: Date; today: Date; events: CalendarEvent[]; tasks: ApiTask[]; reminders: ApiReminder[]; onEventClick: (event: CalendarEvent) => void; onTaskClick: (task: ApiTask) => void; onReminderClick: (reminder: ApiReminder) => void }) {
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
            <div key={i} className={`py-2 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${isToday ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}>
              <div className={`text-xs uppercase font-medium ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>{DAYS_OF_WEEK_SHORT[day.getDay()]}</div>
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
      <div ref={scrollRef} className="overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full" style={{ height: `${12 * CELL_HEIGHT}px` }}>
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="grid border-b border-gray-100 dark:border-gray-800" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", height: `${CELL_HEIGHT}px` }}>
              <div className="pr-2 pb-2 text-right text-xs text-gray-400 dark:text-gray-500 border-r border-gray-200 dark:border-gray-700 leading-none">
                {formatHour(hour)}
              </div>
              {days.map((day, i) => (
                <div key={i} className={`border-r border-gray-100 dark:border-gray-800 last:border-r-0 ${isSameDay(day, today) ? "bg-blue-50/30 dark:bg-blue-900/5" : ""}`} />
              ))}
            </div>
          ))}
          {days.flatMap((day, dayIndex) => {
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayStart.getDate() + 1);
            const dayMs = 86400000;
            const slotItems: { key: string; top: number; height: number; title: string; time: string; onClick: () => void; className: string }[] = [];
            for (const event of events) {
              const s = new Date(event.startTime), e = new Date(event.endTime);
              if (e <= dayStart || s >= dayEnd) continue;
              const segS = s > dayStart ? s : dayStart;
              const segE = e < dayEnd ? e : dayEnd;
              const top = ((segS.getTime() - dayStart.getTime()) / dayMs) * 24 * CELL_HEIGHT;
              const height = Math.max(((segE.getTime() - segS.getTime()) / dayMs) * 24 * CELL_HEIGHT, CELL_HEIGHT / 2);
              slotItems.push({ key: `e-${event.id}-${dayIndex}`, top, height, title: event.title, time: formatBlockTime(s), onClick: () => onEventClick(event), className: calendarColors.event.block });
            }
            for (const task of tasks) {
              if (!task.dueDate || !isSameDay(new Date(task.dueDate), day)) continue;
              const due = new Date(task.dueDate);
              const top = (due.getHours() + due.getMinutes() / 60) * CELL_HEIGHT;
              slotItems.push({ key: `t-${task.id}-${dayIndex}`, top, height: CELL_HEIGHT / 2, title: task.title, time: formatBlockTime(due), onClick: () => onTaskClick(task), className: calendarColors.task.block });
            }
            for (const reminder of reminders) {
              if (!reminder.scheduledTime || !isSameDay(new Date(reminder.scheduledTime), day)) continue;
              const scheduled = new Date(reminder.scheduledTime);
              const top = (scheduled.getHours() + scheduled.getMinutes() / 60) * CELL_HEIGHT;
              slotItems.push({ key: `r-${reminder.id}-${dayIndex}`, top, height: CELL_HEIGHT / 2, title: reminder.title, time: formatBlockTime(scheduled), onClick: () => onReminderClick(reminder), className: calendarColors.reminder.block });
            }
            const layout = computeOverlapLayout(slotItems);
            return slotItems.map((item) => {
              const { columnIndex: col, totalColumns: total } = layout.get(item.key) ?? { columnIndex: 0, totalColumns: 1 };
              return (
                <div
                  key={item.key}
                  onClick={item.onClick}
                  className={`absolute text-xs rounded px-1 py-0.5 overflow-hidden cursor-pointer ${item.className}`}
                  style={{
                    top: `${item.top}px`,
                    height: `${item.height}px`,
                    left: `calc(56px + ${(dayIndex * total + col) / (7 * total)} * (100% - 56px) + 1px)`,
                    width: `calc((100% - 56px) / ${7 * total} - 2px)`,
                  }}
                >
                  <div className="font-medium leading-tight truncate">{item.title}</div>
                  {item.height >= CELL_HEIGHT && (
                    <div className="opacity-75 leading-tight truncate">{item.time}</div>
                  )}
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}

// ── Day view ──────────────────────────────────────────────────────────────────

function DayView({ viewDate, today, events, tasks, reminders, onEventClick, onTaskClick, onReminderClick }: { viewDate: Date; today: Date; events: CalendarEvent[]; tasks: ApiTask[]; reminders: ApiReminder[]; onEventClick: (event: CalendarEvent) => void; onTaskClick: (task: ApiTask) => void; onReminderClick: (reminder: ApiReminder) => void }) {
  const isToday = isSameDay(viewDate, today);
  const now = useCurrentTime();
  const currentHour = now.getHours();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = currentHour * CELL_HEIGHT;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayStart = new Date(viewDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayStart.getDate() + 1);
  const dayMs = 86400000;
  const daySlotItems: { key: string; top: number; height: number; title: string; time: string; onClick: () => void; className: string }[] = [];
  for (const event of events) {
    const s = new Date(event.startTime), e = new Date(event.endTime);
    if (e <= dayStart || s >= dayEnd) continue;
    const segS = s > dayStart ? s : dayStart;
    const segE = e < dayEnd ? e : dayEnd;
    const top = ((segS.getTime() - dayStart.getTime()) / dayMs) * 24 * CELL_HEIGHT;
    const height = Math.max(((segE.getTime() - segS.getTime()) / dayMs) * 24 * CELL_HEIGHT, CELL_HEIGHT / 2);
    daySlotItems.push({ key: `e-${event.id}`, top, height, title: event.title, time: formatBlockTime(s), onClick: () => onEventClick(event), className: calendarColors.event.block });
  }
  for (const task of tasks) {
    if (!task.dueDate || !isSameDay(new Date(task.dueDate), viewDate)) continue;
    const due = new Date(task.dueDate);
    const top = (due.getHours() + due.getMinutes() / 60) * CELL_HEIGHT;
    daySlotItems.push({ key: `t-${task.id}`, top, height: CELL_HEIGHT / 2, title: task.title, time: formatBlockTime(due), onClick: () => onTaskClick(task), className: calendarColors.task.block });
  }
  for (const reminder of reminders) {
    if (!reminder.scheduledTime || !isSameDay(new Date(reminder.scheduledTime), viewDate)) continue;
    const scheduled = new Date(reminder.scheduledTime);
    const top = (scheduled.getHours() + scheduled.getMinutes() / 60) * CELL_HEIGHT;
    daySlotItems.push({ key: `r-${reminder.id}`, top, height: CELL_HEIGHT / 2, title: reminder.title, time: formatBlockTime(scheduled), onClick: () => onReminderClick(reminder), className: calendarColors.reminder.block });
  }
  const dayLayout = computeOverlapLayout(daySlotItems);

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
      <div ref={scrollRef} className="overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full" style={{ height: `${12 * CELL_HEIGHT}px` }}>
        <div className="relative">
          {HOURS.map((hour) => {
            const isCurrentHour = isToday && hour === currentHour;
            return (
              <div key={hour} className={`relative flex border-b border-gray-100 dark:border-gray-800 ${isCurrentHour ? "bg-blue-50 dark:bg-[#0d2818]" : ""}`} style={{ height: `${CELL_HEIGHT}px` }}>
                <div className={`w-14 shrink-0 pr-2 pb-2 text-right text-xs border-r border-gray-200 dark:border-gray-700 leading-none ${isCurrentHour ? "text-blue-600 dark:text-moss font-semibold" : "text-gray-400 dark:text-gray-500"}`}>
                  {formatHour(hour)}
                </div>
                <div className="flex-1" />
              </div>
            );
          })}
          {daySlotItems.map((item) => {
            const { columnIndex: col, totalColumns: total } = dayLayout.get(item.key) ?? { columnIndex: 0, totalColumns: 1 };
            return (
              <div
                key={item.key}
                onClick={item.onClick}
                className={`absolute text-xs rounded px-2 py-0.5 overflow-hidden cursor-pointer ${item.className}`}
                style={{
                  top: `${item.top}px`,
                  height: `${item.height}px`,
                  left: `calc(56px + ${col / total} * (100% - 60px))`,
                  width: `calc((100% - 60px) / ${total} - 2px)`,
                }}
              >
                <div className="font-medium leading-tight truncate">{item.title}</div>
                {item.height >= CELL_HEIGHT && (
                  <div className="opacity-75 leading-tight truncate">{item.time}</div>
                )}
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
  const [showJumpPicker, setShowJumpPicker] = useState(false);
  const [jumpYear, setJumpYear] = useState(today.getFullYear());
  const [jumpMonth, setJumpMonth] = useState<number | null>(null);
  const jumpPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showJumpPicker) return;
    function handleClick(e: MouseEvent) {
      if (jumpPickerRef.current && !jumpPickerRef.current.contains(e.target as Node)) {
        setShowJumpPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showJumpPicker]);

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

  async function handleSubmit(data: { title: string; description: string; start: string; end: string; repeatInterval?: number; repeatUnit?: string; repeatCount?: number; repeatDays?: number[]; timezoneOffset?: number }) {
    const created = await createEvent(data);
    setEvents((prev) => [...prev, ...created]);
  }

  function handleSave(updated: CalendarEvent) {
    setEvents((prev) => prev.map((e) => e.id === updated.id ? updated : e));
  }

  function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function handleDeleteSeries(seriesId: string) {
    setEvents((prev) => prev.filter((e) => e.seriesId !== seriesId));
  }

  function handleAddMore(items: CalendarEvent[]) {
    setEvents((prev) => [...prev, ...items]);
  }

  const isTodayInView =
    view === "day"
      ? isSameDay(today, viewDate)
      : view === "week"
      ? (() => { const ws = startOfWeek(viewDate); const we = new Date(ws); we.setDate(ws.getDate() + 6); we.setHours(23, 59, 59, 999); return today >= ws && today <= we; })()
      : today.getFullYear() === viewDate.getFullYear() && today.getMonth() === viewDate.getMonth();

  const views: { key: View; label: string }[] = [
    { key: "month", label: "Month" },
    { key: "week", label: "Week" },
    { key: "day", label: "Day" },
  ];

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <CalendarDays size={19} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create
          </button>
          {!isTodayInView && (
            <button
              onClick={() => setViewDate(new Date())}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Return to Today
            </button>
          )}
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
          <div className="relative">
            <button
              onClick={() => { setJumpYear(viewDate.getFullYear()); setJumpMonth(null); setShowJumpPicker((v) => !v); }}
              className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {headerLabel(view, viewDate)}
            </button>
            {showJumpPicker && (
              <div
                ref={jumpPickerRef}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 w-56"
              >
                {view === "week" && jumpMonth !== null ? (
                  /* Week picker — step 2 */
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => setJumpMonth(null)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-lg leading-none"
                      >
                        &#8249;
                      </button>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {MONTH_NAMES[jumpMonth]} {jumpYear}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {(() => {
                        const firstDay = new Date(jumpYear, jumpMonth, 1);
                        const lastDay = new Date(jumpYear, jumpMonth + 1, 0);
                        const ws = startOfWeek(firstDay);
                        const weeks: Date[] = [];
                        const d = new Date(ws);
                        while (d <= lastDay) { weeks.push(new Date(d)); d.setDate(d.getDate() + 7); }
                        const currentWeekStart = startOfWeek(viewDate);
                        return weeks.map((weekStart) => {
                          const weekEnd = new Date(weekStart);
                          weekEnd.setDate(weekStart.getDate() + 6);
                          const isCurrent = isSameDay(weekStart, currentWeekStart);
                          const label = weekStart.getMonth() === weekEnd.getMonth()
                            ? `${MONTH_NAMES[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()}–${weekEnd.getDate()}`
                            : `${MONTH_NAMES[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()} – ${MONTH_NAMES[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getDate()}`;
                          return (
                            <button
                              key={weekStart.toISOString()}
                              onClick={() => { setViewDate(new Date(weekStart)); setShowJumpPicker(false); }}
                              className={`px-3 py-2 text-sm rounded-lg text-left transition-colors ${isCurrent ? "bg-blue-600 text-white font-medium" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                            >
                              {label}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </>
                ) : (
                  /* Month picker — step 1 (always shown for month/day view; shown first for week view) */
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => setJumpYear((y) => y - 1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-lg leading-none"
                      >
                        &#8249;
                      </button>
                      <span className="font-semibold text-gray-900 dark:text-white">{jumpYear}</span>
                      <button
                        onClick={() => setJumpYear((y) => y + 1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-lg leading-none"
                      >
                        &#8250;
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {MONTH_NAMES.map((name, i) => {
                        const isCurrent = jumpYear === viewDate.getFullYear() && i === viewDate.getMonth();
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              if (view === "week") {
                                setJumpMonth(i);
                              } else {
                                setViewDate(new Date(jumpYear, i, 1));
                                setShowJumpPicker(false);
                              }
                            }}
                            className={`px-1 py-2 text-sm rounded-lg transition-colors ${isCurrent ? "bg-blue-600 text-white font-medium" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                          >
                            {name.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setViewDate(navDate(view, viewDate, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-xl leading-none"
            aria-label="Next"
          >
            &#8250;
          </button>
        </div>

        {view === "month" && <MonthView viewDate={viewDate} today={today} events={events} tasks={tasks} reminders={reminders} onDayClick={(date) => { setViewDate(date); setView("day"); }} onEventClick={setSelectedEvent} onTaskClick={(task) => navigate(`/tasks?edit=${task.id}`)} onReminderClick={(reminder) => navigate(`/reminders?edit=${reminder.id}`)} />}
        {view === "week" && <WeekView viewDate={viewDate} today={today} events={events} tasks={tasks} reminders={reminders} onEventClick={setSelectedEvent} onTaskClick={(task) => navigate(`/tasks?edit=${task.id}`)} onReminderClick={(reminder) => navigate(`/reminders?edit=${reminder.id}`)} />}
        {view === "day" && <DayView viewDate={viewDate} today={today} events={events} tasks={tasks} reminders={reminders} onEventClick={setSelectedEvent} onTaskClick={(task) => navigate(`/tasks?edit=${task.id}`)} onReminderClick={(reminder) => navigate(`/reminders?edit=${reminder.id}`)} />}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateEventModal
            defaultDate={viewDate}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onSave={handleSave}
            onDelete={handleDelete}
            onDeleteSeries={handleDeleteSeries}
            onAddMore={handleAddMore}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

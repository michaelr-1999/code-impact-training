import { useState } from "react";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateTimeLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  accent?: "green" | "amber" | "blue";
}

export function DateTimePicker({ value, onChange, accent = "blue" }: Props) {
  const now = new Date();
  const sel = value ? new Date(value) : null;
  const [viewYear, setViewYear] = useState((sel ?? now).getFullYear());
  const [viewMonth, setViewMonth] = useState((sel ?? now).getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { day: number; cur: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, cur: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
  for (let d = 1; cells.length < 42; d++) cells.push({ day: d, cur: false });

  function pickDay(day: number) {
    const h = sel?.getHours() ?? 0;
    const m = sel?.getMinutes() ?? 0;
    onChange(toDateTimeLocal(new Date(viewYear, viewMonth, day, h, m, 0, 0)));
  }

  const hours24 = sel ? sel.getHours() : 0;
  const isPM = hours24 >= 12;
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;

  function setHour12(raw: string) {
    const h12 = Math.max(1, Math.min(12, parseInt(raw) || 1));
    const h24 = isPM ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
    const base = sel ?? new Date(viewYear, viewMonth, 1, 0, 0, 0, 0);
    const d = new Date(base);
    d.setHours(h24);
    onChange(toDateTimeLocal(d));
  }

  function toggleAmPm() {
    const base = sel ?? new Date(viewYear, viewMonth, 1, 0, 0, 0, 0);
    const d = new Date(base);
    d.setHours(d.getHours() < 12 ? d.getHours() + 12 : d.getHours() - 12);
    onChange(toDateTimeLocal(d));
  }

  function setMinute(raw: string) {
    const m = Math.max(0, Math.min(59, parseInt(raw) || 0));
    const base = sel ?? new Date(viewYear, viewMonth, 1, 0, 0, 0, 0);
    const d = new Date(base);
    d.setMinutes(m);
    onChange(toDateTimeLocal(d));
  }

  const ac = {
    green: {
      sel: "bg-green-600 text-white",
      today: "font-bold text-green-600 dark:text-green-400",
      hdr: "text-green-600 dark:text-green-400",
      ring: "focus:ring-green-500",
    },
    amber: {
      sel: "bg-amber-500 text-white",
      today: "font-bold text-amber-500 dark:text-amber-400",
      hdr: "text-amber-500 dark:text-amber-400",
      ring: "focus:ring-amber-500",
    },
    blue: {
      sel: "bg-blue-600 text-white",
      today: "font-bold text-blue-600 dark:text-blue-400",
      hdr: "text-blue-600 dark:text-blue-400",
      ring: "focus:ring-blue-500",
    },
  }[accent];

  const isSelected = (day: number) =>
    sel !== null &&
    sel.getFullYear() === viewYear &&
    sel.getMonth() === viewMonth &&
    sel.getDate() === day;

  const isToday = (day: number) =>
    now.getFullYear() === viewYear &&
    now.getMonth() === viewMonth &&
    now.getDate() === day;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-lg leading-none"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-lg leading-none"
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className={`text-center text-xs font-semibold py-0.5 ${ac.hdr}`}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, i) => (
          <div key={i} className="flex items-center justify-center">
            <button
              type="button"
              disabled={!cell.cur}
              onClick={() => cell.cur && pickDay(cell.day)}
              className={`h-8 w-8 rounded-full text-xs transition-colors ${
                !cell.cur
                  ? "text-gray-300 dark:text-gray-600 cursor-default"
                  : isSelected(cell.day)
                  ? `${ac.sel} cursor-pointer`
                  : isToday(cell.day)
                  ? `${ac.today} hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer`
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              }`}
            >
              {cell.day}
            </button>
          </div>
        ))}
      </div>

      {/* Time inputs */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Time</span>
        <input
          type="text"
          inputMode="numeric"
          value={String(hours12)}
          onChange={e => setHour12(e.target.value)}
          className={`w-12 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${ac.ring}`}
        />
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">:</span>
        <input
          type="text"
          inputMode="numeric"
          value={String(sel ? sel.getMinutes() : 0).padStart(2, "0")}
          onChange={e => setMinute(e.target.value)}
          className={`w-12 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${ac.ring}`}
        />
        <button
          type="button"
          onClick={toggleAmPm}
          className={`w-10 py-1 rounded-lg text-xs font-semibold border transition-colors ${
            isPM
              ? "border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-white"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          }`}
        >
          {isPM ? "PM" : "AM"}
        </button>
      </div>
    </div>
  );
}

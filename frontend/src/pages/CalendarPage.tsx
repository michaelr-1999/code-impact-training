import { useState, useEffect, useRef } from "react";

const DAYS_OF_WEEK_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAYS_OF_WEEK_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

type View = "month" | "week" | "day";

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

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({ viewDate, today, onDayClick }: { viewDate: Date; today: Date; onDayClick: (date: Date) => void }) {
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
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAYS_OF_WEEK_SHORT.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const isToday = cell.currentMonth && isSameDay(
            new Date(year, month, cell.day), today
          );
          return (
            <div
              key={i}
              onClick={() => cell.currentMonth && onDayClick(new Date(year, month, cell.day))}
              className={`
                min-h-[44px] sm:min-h-[72px] p-1 sm:p-2 border-b border-r border-gray-100
                ${!cell.currentMonth ? "bg-gray-50" : "bg-white hover:bg-blue-50 cursor-pointer"}
                ${i % 7 === 6 ? "border-r-0" : ""}
              `}
            >
              <span
                className={`
                  inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm
                  ${isToday ? "bg-blue-600 text-white font-semibold" : ""}
                  ${!isToday && cell.currentMonth ? "text-gray-900" : ""}
                  ${!isToday && !cell.currentMonth ? "text-gray-400" : ""}
                `}
              >
                {cell.day}
              </span>
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

function WeekView({ viewDate, today }: { viewDate: Date; today: Date }) {
  const weekStart = startOfWeek(viewDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * CELL_HEIGHT;
    }
  }, []);

  return (
    <div className="overflow-x-auto">
      {/* Day headers */}
      <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="border-r border-gray-200" />
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className="py-2 text-center border-r border-gray-200 last:border-r-0">
              <div className="text-xs text-gray-500 uppercase">{DAYS_OF_WEEK_SHORT[day.getDay()]}</div>
              <div className={`
                mx-auto mt-0.5 w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
                ${isToday ? "bg-blue-600 text-white" : "text-gray-900"}
              `}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid — default window 8am–8pm (12 rows visible), full 24h scrollable */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ height: `${12 * CELL_HEIGHT}px` }}>
        {HOURS.map((hour) => (
          <div key={hour} className="grid border-b border-gray-100" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
            <div className="pr-2 py-2 text-right text-xs text-gray-400 border-r border-gray-200 leading-none">
              {formatHour(hour)}
            </div>
            {days.map((_, i) => (
              <div key={i} className="h-12 border-r border-gray-100 last:border-r-0" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Day view ──────────────────────────────────────────────────────────────────

function DayView({ viewDate, today }: { viewDate: Date; today: Date }) {
  const isToday = isSameDay(viewDate, today);
  const now = useCurrentTime();
  const currentHour = now.getHours();
  const offset = minuteOffset();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = currentHour * CELL_HEIGHT;
    }
  }, []);

  return (
    <div>
      {/* Day header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
        <div className={`
          w-10 h-10 flex items-center justify-center rounded-full text-lg font-semibold
          ${isToday ? "bg-blue-600 text-white" : "text-gray-900"}
        `}>
          {viewDate.getDate()}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{DAYS_OF_WEEK_FULL[viewDate.getDay()]}</div>
          <div className="text-xs text-gray-500">{MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}</div>
        </div>
      </div>

      {/* Time grid — scrolls to current hour on open */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ height: `${12 * CELL_HEIGHT}px` }}>
        {HOURS.map((hour) => {
          const isCurrentHour = isToday && hour === currentHour;
          return (
            <div key={hour} className={`relative flex border-b border-gray-100 ${isCurrentHour ? "bg-blue-50" : ""}`}>
              <div className={`w-14 shrink-0 pr-2 py-2 text-right text-xs border-r border-gray-200 leading-none ${isCurrentHour ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                {formatHour(hour)}
              </div>
              <div className="flex-1 h-12" />
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

function navigate(view: View, viewDate: Date, dir: 1 | -1): Date {
  const d = new Date(viewDate);
  if (view === "month") return new Date(d.getFullYear(), d.getMonth() + dir, 1);
  if (view === "week") { d.setDate(d.getDate() + dir * 7); return d; }
  d.setDate(d.getDate() + dir);
  return d;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const [view, setView] = useState<View>("month");
  const [viewDate, setViewDate] = useState(today);

  const views: { key: View; label: string }[] = [
    { key: "month", label: "Month" },
    { key: "week", label: "Week" },
    { key: "day", label: "Day" },
  ];

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>

        {/* View switcher */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden self-start sm:self-auto">
          {views.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`
                px-3 py-1.5 text-sm font-medium transition-colors
                ${view === key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden w-full max-w-3xl">
        {/* Navigation header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <button
            onClick={() => setViewDate(navigate(view, viewDate, -1))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors text-xl leading-none"
            aria-label="Previous"
          >
            &#8249;
          </button>
          <span className="text-base sm:text-lg font-semibold text-gray-900">
            {headerLabel(view, viewDate)}
          </span>
          <button
            onClick={() => setViewDate(navigate(view, viewDate, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors text-xl leading-none"
            aria-label="Next"
          >
            &#8250;
          </button>
        </div>

        {view === "month" && <MonthView viewDate={viewDate} today={today} onDayClick={(date) => { setViewDate(date); setView("day"); }} />}
        {view === "week" && <WeekView viewDate={viewDate} today={today} />}
        {view === "day" && <DayView viewDate={viewDate} today={today} />}
      </div>
    </div>
  );
}

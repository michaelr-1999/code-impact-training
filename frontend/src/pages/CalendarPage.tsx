import { useState } from "react";

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarPage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

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

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  function isToday(day: number, currentMonth: boolean) {
    return (
      currentMonth &&
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Calendar</h1>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors text-xl leading-none"
            aria-label="Previous month"
          >
            &#8249;
          </button>
          <span className="text-base sm:text-lg font-semibold text-gray-900">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors text-xl leading-none"
            aria-label="Next month"
          >
            &#8250;
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const today_ = isToday(cell.day, cell.currentMonth);
            return (
              <div
                key={i}
                className={`
                  min-h-[44px] sm:min-h-[72px] p-1 sm:p-2 border-b border-r border-gray-100
                  ${!cell.currentMonth ? "bg-gray-50" : "bg-white"}
                  ${i % 7 === 6 ? "border-r-0" : ""}
                `}
              >
                <span
                  className={`
                    inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm
                    ${today_ ? "bg-blue-600 text-white font-semibold" : ""}
                    ${!today_ && cell.currentMonth ? "text-gray-900" : ""}
                    ${!today_ && !cell.currentMonth ? "text-gray-400" : ""}
                  `}
                >
                  {cell.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

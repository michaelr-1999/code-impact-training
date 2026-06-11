import { useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import type { DashboardEvent } from "../../api/dashboard";

interface Props {
  events: DashboardEvent[];
}

function formatEventTime(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const sameDay = s.toDateString() === e.toDateString();
  const time = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = (d: Date) => d.toLocaleDateString([], { month: "short", day: "numeric" });
  return sameDay
    ? `${time(s)} – ${time(e)}`
    : `${date(s)}, ${time(s)} – ${date(e)}, ${time(e)}`;
}

export function EventsWidget({ events }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Today's Events</h2>
        <button
          onClick={() => navigate("/calendar")}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-moss dark:hover:text-moss-hover font-medium"
        >
          View all
        </button>
      </div>
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <CalendarDays size={20} className="text-gray-300 dark:text-gray-600 mb-1.5" strokeWidth={1.5} />
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Open schedule</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">No events today</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li
              key={event.id}
              onClick={() => navigate("/calendar")}
              className="flex flex-col gap-0.5 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {formatEventTime(event.startTime, event.endTime)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

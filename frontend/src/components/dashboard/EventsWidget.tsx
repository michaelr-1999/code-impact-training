import { useNavigate } from "react-router-dom";
import type { DashboardEvent } from "../../api/dashboard";

interface Props {
  events: DashboardEvent[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
        <p className="text-sm text-gray-400 dark:text-gray-500">No events today</p>
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
                {formatTime(event.startTime)} – {formatTime(event.endTime)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { getDashboardToday, postAiSummary, type DashboardData } from "../api/dashboard";
import { EventsWidget } from "../components/dashboard/EventsWidget";
import { TasksWidget } from "../components/dashboard/TasksWidget";
import { RemindersWidget } from "../components/dashboard/RemindersWidget";
import { OverdueWidget } from "../components/dashboard/OverdueWidget";
import { AISummaryCard } from "../components/dashboard/AISummaryCard";

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function WidgetSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
      <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const overdueTasks = (() => {
    if (!data) return [];
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return data.tasks.filter(task => task.dueDate && new Date(task.dueDate) < t);
  })();
  const nonOverdueTasks = (() => {
    if (!data) return [];
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return data.tasks.filter(task => !task.dueDate || new Date(task.dueDate) >= t);
  })();
  const overdueReminders = (() => {
    if (!data) return [];
    const now = new Date();
    return data.reminders.filter(r => r.scheduledTime && new Date(r.scheduledTime) < now);
  })();
  const nonOverdueReminders = (() => {
    if (!data) return [];
    const now = new Date();
    return data.reminders.filter(r => !r.scheduledTime || new Date(r.scheduledTime) >= now);
  })();
  const hasOverdue = overdueTasks.length > 0 || overdueReminders.length > 0;

  useEffect(() => {
    getDashboardToday()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleGenerateSummary() {
    setSummaryLoading(true);
    setSummaryError(null);
    postAiSummary()
      .then(setSummary)
      .catch(() => setSummaryError("Couldn't generate summary — try again"))
      .finally(() => setSummaryLoading(false));
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatToday()}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <WidgetSkeleton />
          <WidgetSkeleton />
          <WidgetSkeleton />
        </div>
      ) : data ? (
        <>
          {hasOverdue && (
            <div className="mb-4">
              <OverdueWidget tasks={overdueTasks} reminders={overdueReminders} />
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <EventsWidget events={data.events} />
            <TasksWidget tasks={nonOverdueTasks} />
            <RemindersWidget reminders={nonOverdueReminders} />
          </div>

          <div className="mt-4">
            <button
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:bg-moss dark:hover:bg-moss-hover dark:text-black dark:disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {summaryLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating…
                </>
              ) : summary ? (
                "Refresh summary"
              ) : (
                "Your day ahead"
              )}
            </button>

            {summaryError && (
              <p className="mt-2 text-sm text-red-500">{summaryError}</p>
            )}

            {summary && !summaryLoading && (
              <div className="mt-3">
                <AISummaryCard summary={summary} />
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500">Failed to load dashboard data.</p>
      )}
    </div>
  );
}

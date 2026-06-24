import { useState, useEffect, useRef } from "react";
import { LayoutDashboard, CalendarDays, ListTodo, Bell } from "lucide-react";
import { getDashboardToday, postAiSummary, type DashboardData } from "../api/dashboard";
import { EventsWidget } from "../components/dashboard/EventsWidget";
import { TasksWidget } from "../components/dashboard/TasksWidget";
import { RemindersWidget } from "../components/dashboard/RemindersWidget";
import { OverdueWidget } from "../components/dashboard/OverdueWidget";
import { AISummaryCard } from "../components/dashboard/AISummaryCard";
import { PageHeader } from "../components/PageHeader";

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function useCountUp(target: number, duration = 700) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    function step(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCurrent(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

interface StatCardProps {
  label: string;
  count: number;
  icon: typeof LayoutDashboard;
  gradient: string;
  countColor: string;
}

function StatCard({ label, count, icon: Icon, gradient, countColor }: StatCardProps) {
  const animated = useCountUp(count);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-3 flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
        <Icon size={16} className="text-white" strokeWidth={2} />
      </div>
      <div>
        <p className={`text-2xl font-bold leading-none ${countColor}`}>{animated}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-4 animate-pulse">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-3 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0" />
          <div>
            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-6 mb-1.5" />
            <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
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
      <PageHeader
        icon={LayoutDashboard}
        gradient="from-blue-500 to-violet-600"
        title="Dashboard"
        subtitle={formatToday()}
      />

      {loading ? (
        <>
          <StatsRowSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <WidgetSkeleton />
            <WidgetSkeleton />
            <WidgetSkeleton />
          </div>
        </>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <StatCard label="Events today" count={data.events.length} icon={CalendarDays} gradient="from-blue-500 to-blue-600" countColor="text-blue-600 dark:text-blue-400" />
            <StatCard label="Tasks due" count={data.tasks.length} icon={ListTodo} gradient="from-green-500 to-emerald-600" countColor="text-green-600 dark:text-green-400" />
            <StatCard label="Reminders" count={data.reminders.length} icon={Bell} gradient="from-amber-400 to-orange-500" countColor="text-amber-500 dark:text-amber-400" />
          </div>
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

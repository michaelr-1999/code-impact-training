import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarDays, ListTodo, Bell, User } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { useBadgeCounts } from "../hooks/useBadgeCounts";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, activeColor: "bg-gradient-to-r from-blue-500 to-violet-600", badgeKey: null },
  { to: "/calendar",  label: "Calendar",  icon: CalendarDays,    activeColor: "bg-gradient-to-r from-blue-500 to-blue-600",   badgeKey: null },
  { to: "/tasks",     label: "Tasks",     icon: ListTodo,        activeColor: "bg-gradient-to-r from-green-500 to-emerald-600", badgeKey: "tasks" as const },
  { to: "/reminders", label: "Reminders", icon: Bell,            activeColor: "bg-gradient-to-r from-amber-400 to-orange-500", badgeKey: "reminders" as const },
  { to: "/profile",   label: "Profile",   icon: User,            activeColor: "bg-gradient-to-r from-slate-500 to-gray-700",  badgeKey: null },
];

function Sidebar({ onClose, badges }: { onClose?: () => void; badges: { tasks: number; reminders: number } }) {
  return (
    <div className="w-56 flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Branding */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">O</span>
        </div>
        <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">Orbit</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {navItems.map(({ to, label, icon: Icon, activeColor, badgeKey }) => {
          const badgeCount = badgeKey ? badges[badgeKey] : 0;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? `${activeColor} text-white shadow-sm`
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? "text-white" : "text-gray-400 dark:text-gray-500"} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                  {badgeCount > 0 && (
                    <span className={`ml-auto text-xs font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 ${isActive ? "bg-white/25 text-white" : "bg-red-500 text-white"}`}>
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useNotifications(true);
  const badges = useBadgeCounts();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:shrink-0 md:flex-col">
        <Sidebar badges={badges} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setMobileOpen(false)} badges={badges} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">O</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Orbit</span>
          </div>
        </header>

        <main className="flex-1 bg-gray-50 dark:bg-black">
          <div key={location.pathname} className="page-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/calendar", label: "Calendar" },
  { to: "/tasks", label: "Tasks" },
  { to: "/reminders", label: "Reminders" },
  { to: "/profile", label: "Profile" },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleNavClick() {
    onClose?.();
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 shrink-0">
        <span className="text-sm font-semibold text-gray-900">Impact Training</span>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-200 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 text-left"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — always visible md+ */}
      <aside className="hidden md:flex md:shrink-0 md:flex-col">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar — slides in */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 text-sm font-semibold text-gray-900">Impact Training</span>
        </header>

        <main className="flex-1 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

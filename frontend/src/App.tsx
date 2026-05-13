import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CalendarPage from "./pages/CalendarPage";
import TasksPage from "./pages/TasksPage";
import RemindersPage from "./pages/RemindersPage";
import ProfilePage from "./pages/ProfilePage";
import AppLayout from "./layouts/AppLayout";

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  // Only redirect if the user was already authenticated when this component mounted.
  // If token becomes truthy during this render (i.e. they just logged in), let
  // LoginPage's navigate() handle the destination instead of hardcoding /dashboard.
  const [wasAuthOnMount] = useState(() => !!token);
  return wasAuthOnMount && token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

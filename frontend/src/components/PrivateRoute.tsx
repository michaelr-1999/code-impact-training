import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const location = useLocation();

  // Also check localStorage: React Router's useSyncExternalStore forces a sync
  // re-render on navigate() before AuthContext's setToken has committed, so the
  // context token can be null for one render even though localStorage is already set.
  if (!token && !localStorage.getItem("token")) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}

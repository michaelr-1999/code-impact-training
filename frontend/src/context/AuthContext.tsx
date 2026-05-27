import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { registerLogout } from "../lib/api";

type User = { id: string; name: string; email: string };

type AuthContextValue = {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  function login(newToken: string, newUser: User) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function updateUser(updatedUser: User) {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  useEffect(() => {
    registerLogout(logout);
  }, [logout]);

  // Sync state if token is cleared from another tab or devtools
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === "token" && !e.newValue) logout();
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

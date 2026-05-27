import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMe } from "../api/auth";

type User = { id: string; name: string; email: string };

export default function ProfilePage() {
  const { user: ctxUser, token } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(ctxUser);
  const [loading, setLoading] = useState(!ctxUser);

  useEffect(() => {
    if (ctxUser) return;
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    getMe(token)
      .then(setUser)
      .catch(() => navigate("/login", { replace: true }))
      .finally(() => setLoading(false));
  }, [ctxUser, token, navigate]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-4 sm:p-8 max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-lg font-semibold text-blue-700">{initials}</span>
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

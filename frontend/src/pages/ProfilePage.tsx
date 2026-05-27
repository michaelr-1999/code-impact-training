import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMe, putProfile, putPassword } from "../api/auth";

type User = { id: string; name: string; email: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfilePage() {
  const { user: ctxUser, token, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(ctxUser);
  const [loading, setLoading] = useState(!ctxUser);

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

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

  function startEditing() {
    if (!user) return;
    setEditName(user.name);
    setEditEmail(user.email);
    setProfileError(null);
    setProfileSuccess(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setProfileError(null);
  }

  async function handleSaveProfile() {
    if (!editName.trim()) {
      setProfileError("Name is required.");
      return;
    }
    if (!EMAIL_RE.test(editEmail)) {
      setProfileError("Please enter a valid email address.");
      return;
    }
    setProfileError(null);
    setProfileSaving(true);
    try {
      const updated = await putProfile({ name: editName.trim(), email: editEmail.trim() });
      setUser(updated);
      updateUser(updated);
      setEditing(false);
      setProfileSuccess("Profile updated.");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordError(null);
    setPasswordSaving(true);
    try {
      await putPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password updated.");
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  }

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
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="p-4 sm:p-8 max-w-lg space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {!editing ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-lg font-semibold text-blue-700">{initials}</span>
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                </div>
              </div>
              <button
                onClick={startEditing}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Edit profile
              </button>
            </div>
            {profileSuccess && (
              <p className="mt-3 text-sm text-green-600">{profileSuccess}</p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Edit profile</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {profileError && <p className="text-sm text-red-500">{profileError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {profileSaving ? "Saving…" : "Save changes"}
              </button>
              <button
                onClick={cancelEditing}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Sign out</h2>
        <p className="text-sm text-gray-500 mb-3">You will be redirected to the login page.</p>
        <button
          onClick={() => { logout(); navigate("/login", { replace: true }); }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Change password card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Change password</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
          <button
            onClick={handleChangePassword}
            disabled={passwordSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {passwordSaving ? "Updating…" : "Update password"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getMe, putProfile, putPassword } from "../api/auth";

type User = { id: string; name: string; email: string; avatarUrl?: string | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfilePage() {
  const { user: ctxUser, token, updateUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);

  // Notifications
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );

  async function handleRequestNotifPermission() {
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  function handleTestNotification() {
    new Notification("Event starting in 5 minutes", { body: "Team standup", icon: "/favicon.ico" });
  }

  async function resizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 200;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    setAvatarPreview(resized);
    e.target.value = "";
  }

  async function handleSaveAvatar() {
    if (!avatarPreview) return;
    setAvatarSaving(true);
    try {
      const updated = await putProfile({ avatarUrl: avatarPreview });
      updateUser(updated);
      setUser(updated);
      setAvatarPreview(null);
    } catch {
      // keep preview so user can retry
    } finally {
      setAvatarSaving(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarSaving(true);
    try {
      const updated = await putProfile({ avatarUrl: null });
      updateUser(updated);
      setUser(updated);
      setAvatarPreview(null);
    } catch {
      // silently fail
    } finally {
      setAvatarSaving(false);
    }
  }

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
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
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
      <div className="mb-2 flex items-center gap-3">
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-moss transition-colors"
        >
          {isDark ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Light
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Dark
            </>
          )}
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
      </div>

      {/* Profile card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        {!editing ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Profile" className="w-14 h-14 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-moss-subtle flex items-center justify-center shrink-0">
                    <span className="text-lg font-semibold text-blue-700 dark:text-moss">{initials}</span>
                  </div>
                )}
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
                </div>
              </div>
              <button
                onClick={startEditing}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-moss dark:hover:text-moss-hover"
              >
                Edit profile
              </button>
            </div>
            {profileSuccess && (
              <p className="mt-3 text-sm text-green-600 dark:text-moss">{profileSuccess}</p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Edit profile</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-moss bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-moss bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            {profileError && <p className="text-sm text-red-500">{profileError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:bg-moss dark:hover:bg-moss-hover dark:text-black dark:disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {profileSaving ? "Saving…" : "Save changes"}
              </button>
              <button
                onClick={cancelEditing}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile picture */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Profile picture</h2>
        <div className="flex items-center gap-5">
          {/* Avatar display */}
          <div className="relative group shrink-0">
            {avatarPreview ?? user.avatarUrl ? (
              <img
                src={avatarPreview ?? user.avatarUrl!}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-moss-subtle flex items-center justify-center">
                <span className="text-2xl font-semibold text-blue-700 dark:text-moss">{initials}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              aria-label="Change photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {avatarPreview ? (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400">Preview — save to apply</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveAvatar}
                    disabled={avatarSaving}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {avatarSaving ? "Saving…" : "Save photo"}
                  </button>
                  <button
                    onClick={() => setAvatarPreview(null)}
                    disabled={avatarSaving}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-moss hover:text-blue-700 dark:hover:text-moss-hover border border-blue-300 dark:border-moss rounded-lg hover:bg-blue-50 dark:hover:bg-moss-subtle transition-colors"
                >
                  Change photo
                </button>
                {user.avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={avatarSaving}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Remove photo
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Notifications</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Get browser notifications 5 minutes before and at the start of events, tasks, and reminders.
        </p>
        {!("Notification" in window) ? (
          <p className="text-sm text-red-500">Your browser does not support notifications.</p>
        ) : notifPermission === "granted" ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-moss bg-green-50 dark:bg-moss-subtle px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-moss" />
              Enabled
            </span>
            <button
              onClick={handleTestNotification}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-moss hover:text-blue-700 dark:hover:text-moss-hover border border-blue-300 dark:border-moss rounded-lg hover:bg-blue-50 dark:hover:bg-moss-subtle transition-colors"
            >
              Send test notification
            </button>
          </div>
        ) : notifPermission === "denied" ? (
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-400 px-2 py-1 rounded-full mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Blocked
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Notifications are blocked. To enable them, click the lock icon in your browser's address bar and allow notifications for this site.
            </p>
          </div>
        ) : (
          <button
            onClick={handleRequestNotifPermission}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-moss dark:hover:bg-moss-hover dark:text-black text-white text-sm font-medium rounded-lg transition-colors"
          >
            Enable notifications
          </button>
        )}
      </div>

      {/* Sign out */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Sign out</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">You will be redirected to the login page.</p>
        <button
          onClick={() => { logout(); navigate("/login", { replace: true }); }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Change password card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Change password</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-moss bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowCurrentPassword(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showCurrentPassword ? (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">New password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-moss bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowNewPassword(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showNewPassword ? (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Confirm new password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-moss bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showConfirmPassword ? (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
              </button>
            </div>
          </div>
          {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-green-600 dark:text-moss">{passwordSuccess}</p>}
          <button
            onClick={handleChangePassword}
            disabled={passwordSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:bg-moss dark:hover:bg-moss-hover dark:text-black dark:disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {passwordSaving ? "Updating…" : "Update password"}
          </button>
        </div>
      </div>
    </div>
  );
}

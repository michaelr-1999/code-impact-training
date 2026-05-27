export async function register(name: string, email: string, password: string) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Registration failed");
  }

  return data.data as { token: string; user: { id: string; name: string; email: string } };
}

import { apiFetch } from "../lib/api";

export async function putProfile(data: { name?: string; email?: string }) {
  const res = await apiFetch("/api/users/me", { method: "PUT", body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to update profile");
  return json.data as { id: string; name: string; email: string };
}

export async function putPassword(data: { currentPassword: string; newPassword: string }) {
  const res = await apiFetch("/api/users/me/password", { method: "PUT", body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to update password");
}

export async function getMe(token: string) {
  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch profile");
  return data.data as { id: string; name: string; email: string };
}

export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Login failed");
  }

  return data.data as { token: string; user: { id: string; name: string; email: string } };
}

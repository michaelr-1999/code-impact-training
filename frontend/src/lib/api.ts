type LogoutFn = () => void;

let onLogout: LogoutFn | null = null;

export function registerLogout(fn: LogoutFn) {
  onLogout = fn;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("token");

  const headers = new Headers(init.headers as HeadersInit);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(path, { ...init, headers });

  if (res.status === 401) {
    onLogout?.();
    const redirect = encodeURIComponent(window.location.pathname);
    window.location.replace(`/login?redirect=${redirect}`);
  }

  return res;
}

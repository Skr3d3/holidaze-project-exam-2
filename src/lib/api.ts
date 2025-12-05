const BASE = process.env.REACT_APP_API_BASE || "https://v2.api.noroff.dev/holidaze";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json() as any)?.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
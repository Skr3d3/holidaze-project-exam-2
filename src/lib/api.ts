const BASE = process.env.REACT_APP_API_BASE || "https://v2.api.noroff.dev/holidaze";

const AUTH = process.env.REACT_APP_API_AUTH || "https://v2.api.noroff.dev";

async function doFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      msg =
        body?.message ||
        body?.errors?.[0]?.message ||
        JSON.stringify(body);
    } catch {
      try {
        msg = await res.text();
      } catch {}
    }
    throw new Error(msg);
  }

  return res.json();
}


export function api<T>(path: string, init?: RequestInit) {
  return doFetch<T>(`${BASE}${path}`, init);
}


export function apiAuth<T>(path: string, init?: RequestInit) {
  return doFetch<T>(`${AUTH}${path}`, init);
}
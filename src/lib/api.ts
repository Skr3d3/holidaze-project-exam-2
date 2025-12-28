const BASE_AUTH = process.env.REACT_APP_API_AUTH || "https://v2.api.noroff.dev";
const BASE_HOLI = process.env.REACT_APP_API_BASE || "https://v2.api.noroff.dev/holidaze";
const ENV_KEY = (process.env.REACT_APP_API_KEY || "").trim();

async function doFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    let body: any = null;
    try { body = await res.json(); } catch {}
    const msg = body?.message || body?.errors?.[0]?.message || `${res.status} ${res.statusText}`;
    if (process.env.NODE_ENV === "development" && body?.errors?.[0]) {
      console.debug("API error detail:", body.errors[0]);
    }
    throw new Error(msg);
  }
  return res.json();
}

export function apiAuth<T>(path: string, init?: RequestInit) {
  return doFetch<T>(`${BASE_AUTH}${path}`, init);
}

export function api<T>(path: string, init: RequestInit = {}) {
  const key =
    (localStorage.getItem("holidaze_api_key") || "").trim() ||
    (process.env.REACT_APP_API_KEY || process.env.REACT_APP_NOROFF_API_KEY || "").trim();

  return doFetch<T>(
    `${BASE_HOLI}${path}`,
    {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(key ? { "X-Noroff-API-Key": key } : {}),
        ...(init.headers || {}),
      },
    }
  );
}

export function apiPostJson<T>(path: string, body: unknown, extraHeaders?: HeadersInit) {
  return api<T>(path, {
    method: "POST",
    headers: { ...(extraHeaders || {}) },
    body: JSON.stringify(body),
  });
}

const BASE_AUTH = process.env.REACT_APP_API_AUTH || "https://v2.api.noroff.dev";
const BASE_HOLI = process.env.REACT_APP_API_BASE || "https://v2.api.noroff.dev/holidaze";
const ENV_KEY = (process.env.REACT_APP_API_KEY || "").trim();

async function doFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    if (text) {
      try {
        const body = JSON.parse(text);
        msg = body?.errors?.[0]?.message || body?.message || msg;
      } catch {
        msg = text || msg;
      }
    }
    throw new Error(msg);
  }
  if (res.status === 204 || !text.trim()) {
    return null as unknown as T;
  }
  if (!contentType.includes("application/json")) {
    return text as unknown as T;
  }
  return JSON.parse(text) as T;
}

export function apiAuth<T>(path: string, init?: RequestInit) {
  return doFetch<T>(`${BASE_AUTH}${path}`, init);
}

export function api<T>(path: string, init: RequestInit = {}) {
  const key =
    (localStorage.getItem("holidaze_api_key") || "").trim() || (ENV_KEY).trim();

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

// src/lib/auth.ts
export function saveAuth(token: string, user: any) {
  localStorage.setItem("holidaze_token", token);
  localStorage.setItem("holidaze_user", JSON.stringify(user));
}

export const getToken = () => localStorage.getItem("holidaze_token");

export function getUser<T = any>(): T | null {
  const raw = localStorage.getItem("holidaze_user");
  return raw ? (JSON.parse(raw) as T) : null;
}

export function clearAuth() {
  localStorage.removeItem("holidaze_token");
  localStorage.removeItem("holidaze_user");
}

const apiKey = process.env.REACT_APP_API_KEY;

export function authHeaders() {
  const t = getToken();
  return {
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...(apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
  };
}

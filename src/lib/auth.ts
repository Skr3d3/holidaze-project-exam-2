export function saveAuth(token: string, user: any) {
  localStorage.setItem("holidaze_token", token);
  localStorage.setItem("holidaze_user", JSON.stringify(user));
  try { window.dispatchEvent(new Event("authchange")); } catch {}
}

export const getToken = () => localStorage.getItem("holidaze_token");

export function getUser<T = any>(): T | null {
  const raw = localStorage.getItem("holidaze_user");
  return raw ? (JSON.parse(raw) as T) : null;
}

export function clearAuth() {
  localStorage.removeItem("holidaze_token");
  localStorage.removeItem("holidaze_user");
  try { window.dispatchEvent(new Event("authchange")); } catch {}
}

const ENV_API_KEY = (process.env.REACT_APP_API_KEY || "").trim();

export function authHeaders() {
  const t = getToken();
  return {
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...(ENV_API_KEY ? { "X-Noroff-API-Key": ENV_API_KEY } : {}),
  };
}

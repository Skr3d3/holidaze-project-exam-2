export function saveAuth(token: string, user: any) {
  localStorage.setItem("holidaze_token", token);
  localStorage.setItem("holidaze_user", JSON.stringify(user));
}
export function getToken() { return localStorage.getItem("holidaze_token"); }
export function getUser<T = any>(): T | null {
  const raw = localStorage.getItem("holidaze_user");
  return raw ? JSON.parse(raw) as T : null;
}
export function clearAuth() {
  localStorage.removeItem("holidaze_token");
  localStorage.removeItem("holidaze_user");
}
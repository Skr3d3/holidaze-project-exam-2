import { apiAuth } from "./api";
import type { AuthLoginResponse, AuthRegisterBody, ApiKeyResponse } from "../types/holidaze";

export async function login(email: string, password: string, opts?: { holidaze?: boolean }) {
  const qs = opts?.holidaze ? "?_holidaze=true" : "";
  const res = await apiAuth<AuthLoginResponse>(`/auth/login${qs}`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const { accessToken, ...user } = res.data;
  return res.data;
}

export async function register(body: AuthRegisterBody, opts?: { autoLogin?: boolean; holidaze?: boolean }) {
  await apiAuth(`/auth/register`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (opts?.autoLogin) {
    return login(body.email, body.password, { holidaze: opts.holidaze });
  }
}
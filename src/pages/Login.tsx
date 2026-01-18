import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiAuth } from "../lib/api";
import { saveAuth } from "../lib/auth";

type LoginResponse = {
  data: {
    accessToken: string;
    name: string;
    email: string;
    venueManager?: boolean;
    avatar?: { url: string; alt?: string };
    banner?: { url: string; alt?: string };
  };
  meta?: unknown;
};

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await apiAuth<LoginResponse>("/auth/login?_holidaze=true", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const { accessToken, ...user } = res.data;
      if (!accessToken) throw new Error("Invalid login response");
      saveAuth(accessToken, user);

      nav("/dashboard");
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="page-heading">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn w-full" disabled={busy}>
          {busy ? "Logging in…" : "Login"}
        </button>
      </form>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiAuth } from "../lib/api";
import { saveAuth } from "../lib/auth";

const STUD = /@stud\.noroff\.no$/i;

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

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [venueManager, setVenueManager] = useState(false);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (!STUD.test(email)) throw new Error("Email must be @stud.noroff.no");
      if (password.length < 8) throw new Error("Password must be at least 8 characters");

      await apiAuth("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, venueManager }),
      });

      const login = await apiAuth<LoginResponse>("/auth/login?_holidaze=true", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const { accessToken, ...user } = login.data;
      if (!accessToken) throw new Error("Login after register failed");
      saveAuth(accessToken, user);

      nav("/dashboard");
    } catch (e: any) {
      setErr(e.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="page-heading">Register</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="input"
          type="email"
          placeholder="Email (@stud.noroff.no)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label className="flex items-center gap-2 text-sm text-[color:var(--color-text)]">
          <input
            type="checkbox"
            checked={venueManager}
            onChange={(e) => setVenueManager(e.target.checked)}
          />
          I am a venue manager
        </label>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn w-full" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { getUser, getToken } from "../lib/auth";

type P = {
  name: string;
  email: string;
  venueManager?: boolean;
  avatar?: { url: string};
  venues?: any[];
  bookings?: any[];
};

export default function Profile() {
  const meName = useMemo(() => getUser<{ name: string }>()?.name ?? null, []);
  const token = useMemo(() => getToken() ?? null, []);

  const [profile, setProfile] = useState<P | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCtrlRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!meName) return;
    loadCtrlRef.current?.abort();
    const ctrl = new AbortController();
    loadCtrlRef.current = ctrl;
    const myReq = ++reqIdRef.current;
    setLoading(true);
    setErr(null);
    try {
      const res = await api<{ data: P }>(
        `/profiles/${encodeURIComponent(meName)}?_venues=true&_bookings=true&_=${Date.now()}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: ctrl.signal, cache: "no-store" }
      );
      if (myReq !== reqIdRef.current) return;
      const p = (res as any).data ?? (res as any);
      setProfile(p);
      setAvatarUrl(p?.avatar?.url || "");
    } catch (e: any) {
      if (e?.name === "AbortError" || /aborted/i.test(String(e?.message))) return;
      setErr(e.message || "Failed to load profile");
    } finally {
      if (myReq === reqIdRef.current) setLoading(false);
    }
  }, [meName, token]);

  useEffect(() => {
    load();
    return () => loadCtrlRef.current?.abort();
  }, [load]);

  if (!meName) return <div className="page">Please log in.</div>;

  async function onSaveAvatar(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !meName) return;
    setSaving(true);
    setErr(null);
    try {
      await api(`/profiles/${encodeURIComponent(meName)}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          avatar: avatarUrl ? { url: avatarUrl || undefined } : null,
        }),
      });
      await load();
    } catch (e: any) {
      setErr(e.message || "Failed to update avatar");
    } finally {
      setSaving(false);
    }
  }

  const bookings = profile?.bookings || [];
  const venues = profile?.venues || [];

  async function onDeleteBooking(id: string) {
    if (!token) return;
    if (!window.confirm("Delete this booking?")) return;
    loadCtrlRef.current?.abort();
    const prev = profile;
    setProfile((p) =>
      p ? { ...p, bookings: (p.bookings || []).filter((b: any) => b.id !== id) } : p
    );
    try {
      await api(`/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await load();
    } catch (e: any) {
      setProfile(prev || null);
      window.alert(e.message || "Delete failed");
    }
  }

  async function onEditBooking(b: any) {
    if (!token) return;
    const df = window.prompt("New start date (YYYY-MM-DD):", String(b.dateFrom).slice(0, 10));
    if (!df) return;
    const dt = window.prompt("New end date (YYYY-MM-DD):", String(b.dateTo).slice(0, 10));
    if (!dt) return;
    const gStr = window.prompt("Guests:", String(b.guests));
    const g = Number(gStr ?? b.guests);
    if (!Number.isFinite(g) || g < 1) return window.alert("Invalid guests");
    loadCtrlRef.current?.abort();
    const prev = profile;
    setProfile((p) =>
      p
        ? {
            ...p,
            bookings: (p.bookings || []).map((x: any) =>
              x.id === b.id ? { ...x, dateFrom: df, dateTo: dt, guests: g } : x
            ),
          }
        : p
    );
    try {
      await api(`/bookings/${b.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dateFrom: df, dateTo: dt, guests: g }),
      });
      await load();
    } catch (e: any) {
      setProfile(prev || null);
      window.alert(e.message || "Update failed");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <section className="flex items-start gap-6">
        <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          {profile?.avatar?.url ? (
            <img
              src={profile.avatar.url}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-sm text-gray-500">
              No avatar
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{profile?.name || meName}</h1>
          <div className="text-sm text-gray-600">{profile?.email}</div>
          {profile?.venueManager ? (
            <div className="mt-1 inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Venue manager
            </div>
          ) : null}
        </div>
      </section>

      <section className="card max-w-xl">
        <h2 className="text-lg font-semibold mb-3">Update avatar</h2>
        <form onSubmit={onSaveAvatar} className="space-y-3">
          <input
            className="input w-full"
            placeholder="Image URL (https://...)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button className="btn" disabled={saving || !token}>
            {saving ? "Saving…" : "Save avatar"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">My upcoming bookings</h2>
        {loading && <div>Loading…</div>}
        {!loading && bookings.length === 0 && (
          <div className="text-sm text-gray-600">No bookings.</div>
        )}
        <div className="grid gap-3">
          {bookings.map((b: any) => (
            <div key={b.id} className="card flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">
                  {b?.venue?.name || "Venue"} — {String(b.dateFrom).slice(0, 10)} →{" "}
                  {String(b.dateTo).slice(0, 10)}
                </div>
                <div className="text-sm text-gray-600">Guests: {b.guests}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => onEditBooking(b)}>
                  Edit
                </button>
                <button className="btn-danger" onClick={() => onDeleteBooking(b.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {profile?.venueManager ? (
        <section>
          <h2 className="text-lg font-semibold mb-3">My venues</h2>
          {!loading && venues.length === 0 && (
            <div className="text-sm text-gray-600">No venues yet.</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v: any) => (
              <a key={v.id} href={`/venues/${v.id}`} className="card hover:shadow-md transition">
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3">
                  {v.media?.[0]?.url ? (
                    <img
                      src={v.media[0].url}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="font-medium">{v.name}</div>
                {(v.location?.city || v.location?.country) && (
                  <div className="text-xs text-gray-500">
                    {[v.location?.city, v.location?.country].filter(Boolean).join(", ")}
                  </div>
                )}
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
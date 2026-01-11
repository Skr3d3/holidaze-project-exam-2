import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { api } from "../lib/api";
import { getUser, getToken } from "../lib/auth";
import { useNavigate } from "react-router-dom";

type P = {
  name: string;
  email: string;
  venueManager?: boolean;
  avatar?: { url: string };
  venues?: any[];
  bookings?: any[];
};

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <section className={className}>
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <div
          className={`flex-shrink-0 w-2.5 h-2.5 border-gray-600 border-r-2 border-b-2 transform transition-transform ${
            isOpen ? "rotate-45" : "-rotate-45"
          }`}
        ></div>
      </div>
      {isOpen && <div className="mt-3">{children}</div>}
    </section>
  );
}

export default function Profile() {
  const navigate = useNavigate();
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
        `/profiles/${encodeURIComponent(
          meName
        )}?_venues=true&_bookings=true&_=${Date.now()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: ctrl.signal,
          cache: "no-store",
        }
      );
      if (myReq !== reqIdRef.current) return;
      const p = (res as any).data ?? (res as any);
      setProfile(p);
      setAvatarUrl(p?.avatar?.url || "");
    } catch (e: any) {
      if (e?.name === "AbortError" || /aborted/i.test(String(e?.message)))
        return;
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
      p
        ? { ...p, bookings: (p.bookings || []).filter((b: any) => b.id !== id) }
        : p
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
    const df = window.prompt(
      "New start date (YYYY-MM-DD):",
      String(b.dateFrom).slice(0, 10)
    );
    if (!df) return;
    const dt = window.prompt(
      "New end date (YYYY-MM-DD):",
      String(b.dateTo).slice(0, 10)
    );
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

  function onEditVenue(v: any) {
    navigate(`/venues/${v.id}/edit`);
  }

  async function onDeleteVenue(id: string) {
    if (!token) return;
    if (!window.confirm("Delete this venue? This action cannot be undone and will cancel all bookings for this venue.")) return;
    loadCtrlRef.current?.abort();
    const prev = profile;
    setProfile((p) =>
      p ? { ...p, venues: (p.venues || []).filter((v: any) => v.id !== id) } : p
    );
    try {
      await api(`/venues/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await load();
    } catch (e: any) {
      setProfile(prev || null);
      window.alert(e.message || "Delete failed");
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
              alt="User avatar"
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

      <CollapsibleSection
        title="Update avatar"
        defaultOpen={false}
        className="card max-w-xl"
      >
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
      </CollapsibleSection>

      <CollapsibleSection title="My upcoming bookings">
        {loading && <div>Loading…</div>}
        {!loading && bookings.length === 0 && (
          <div className="text-sm text-gray-600">No bookings.</div>
        )}
        <div className="grid gap-3">
          {bookings.map((b: any) => (
            <div
              key={b.id}
              className="card flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-medium">
                  {b?.venue?.name || "Venue"} —{" "}
                  {String(b.dateFrom).slice(0, 10)} →{" "}
                  {String(b.dateTo).slice(0, 10)}
                </div>
                <div className="text-sm text-gray-600">Guests: {b.guests}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => onEditBooking(b)}
                >
                  Edit
                </button>
                <button
                  className="btn-danger"
                  onClick={() => onDeleteBooking(b.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {profile?.venueManager ? (
        <CollapsibleSection title="My venues">
          {!loading && venues.length === 0 && (
            <div className="text-sm text-gray-600">No venues yet.</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v: any) => (
              <div
                key={v.id}
                className="card hover:shadow-md transition flex flex-col"
              >
                <a
                  href={`/my-venues/${v.id}`}
                  className="flex-grow"
                >
                  <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3">
                    {v.media?.[0]?.url ? (
                      <img
                        src={v.media[0].url}
                        className="w-full h-full object-cover"
                        alt={v.name}
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-sm text-gray-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="font-medium">{v.name}</div>
                  {(v.location?.city || v.location?.country) && (
                    <div className="text-xs text-gray-500">
                      {[v.location?.city, v.location?.country]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                </a>
                <div className="flex gap-2 mt-4">
                  <button
                    className="btn-secondary w-full"
                    onClick={() => onEditVenue(v)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger w-full"
                    onClick={() => onDeleteVenue(v.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
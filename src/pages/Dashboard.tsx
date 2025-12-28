import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { getUser, getToken } from "../lib/auth";
import { unwrap, type Booking, type BookingWithVenue } from "../types/holidaze";

type B = Booking | BookingWithVenue;

export default function Dashboard() {
  const nav = useNavigate();
  const meName = useMemo(() => getUser<{ name: string }>()?.name ?? null, []);
  const token = useMemo(() => getToken() ?? null, []);

  const [items, setItems] = useState<B[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadCtrlRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!meName || !token) return;
    loadCtrlRef.current?.abort();
    const ctrl = new AbortController();
    loadCtrlRef.current = ctrl;
    const myReq = ++reqIdRef.current;

    setLoading(true);
    setErr(null);
    try {
      const url = `/profiles/${encodeURIComponent(meName)}/bookings?_venue=true&_=${Date.now()}`;
      const res = await api<{ data: B[] }>(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
        cache: "no-store" as RequestCache,
      });
      if (myReq !== reqIdRef.current) return;
      const data = unwrap(res);
      const filtered = data.filter(x => !removedIds.has(x.id));
      setItems(filtered);
      if (filtered.length === data.length && removedIds.size) {
        setRemovedIds(prev => {
          const copy = new Set(prev);
          for (const x of filtered) copy.delete(x.id);
          return copy;
        });
      }
    } catch (e: any) {
      if (e?.name === "AbortError" || /aborted/i.test(String(e?.message))) return;
      if (/401/.test(String(e?.message))) nav("/login");
      else setErr(e.message || "Failed to load bookings");
    } finally {
      if (myReq === reqIdRef.current) setLoading(false);
    }
  }, [meName, token, nav, removedIds]);

  useEffect(() => {
    load();
    return () => loadCtrlRef.current?.abort();
  }, [load]);

  if (!meName || !token) return <div className="page">Please log in.</div>;

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  async function onDelete(id: string) {
    if (!window.confirm("Delete this booking?")) return;
    loadCtrlRef.current?.abort();
    setRemovedIds(prev => new Set(prev).add(id));
    const prev = items;
    setItems(xs => xs.filter(x => x.id !== id));
    try {
      await api(`/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await sleep(250);
      await load();
    } catch (e: any) {
      setRemovedIds(prevSet => {
        const copy = new Set(prevSet);
        copy.delete(id);
        return copy;
      });
      setItems(prev);
      window.alert(e.message || "Delete failed");
    }
  }

  async function onEdit(b: B) {
    const df = window.prompt("New start date (YYYY-MM-DD):", b.dateFrom.slice(0, 10));
    if (!df) return;
    const dt = window.prompt("New end date (YYYY-MM-DD):", b.dateTo.slice(0, 10));
    if (!dt) return;
    const gStr = window.prompt("Guests:", String(b.guests));
    const g = Number(gStr ?? b.guests);
    if (!Number.isFinite(g) || g < 1) return window.alert("Invalid guests");

    loadCtrlRef.current?.abort();

    const prev = items;
    const patch = { ...b, dateFrom: df, dateTo: dt, guests: g };
    setItems(xs => xs.map(x => (x.id === b.id ? patch : x)));

    try {
      await api(`/bookings/${b.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dateFrom: df, dateTo: dt, guests: g }),
      });
      await sleep(250);
      await load();
    } catch (e: any) {
      setItems(prev);
      window.alert(e.message || "Update failed");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">My bookings</h1>
      {loading && <div>Loading…</div>}
      {err && <div className="text-red-600">{err}</div>}
      {!loading && !err && items.length === 0 && (
        <div className="text-sm text-gray-600">No upcoming bookings.</div>
      )}
      <div className="grid gap-3">
        {items.map(b => {
          const vName =
            "venue" in b && (b as BookingWithVenue).venue?.name
              ? (b as BookingWithVenue).venue!.name
              : "Venue";
          return (
            <div key={b.id} className="card flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">
                  {vName} — {b.dateFrom.slice(0, 10)} → {b.dateTo.slice(0, 10)}
                </div>
                <div className="text-sm text-gray-600">Guests: {b.guests}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => onEdit(b)}>Edit</button>
                <button className="btn-danger" onClick={() => onDelete(b.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
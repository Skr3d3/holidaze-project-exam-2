import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { getUser, getToken } from "../lib/auth";
import { CreateVenue } from "../types/holidaze";

export default function ManageVenues() {
  const meName = useMemo(() => getUser<{ name: string }>()?.name ?? null, []);
  const token = useMemo(() => getToken() ?? null, []);
  const [items, setItems] = useState<CreateVenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const loadCtrlRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!meName || !token) return;
    loadCtrlRef.current?.abort();
    const ctrl = new AbortController();
    loadCtrlRef.current = ctrl;
    const myReq = ++reqIdRef.current;
    setLoading(true);
    setErr(null);
    try {
      const res = await api<{ data: CreateVenue[] }>(
        `/profiles/${encodeURIComponent(meName)}/venues?limit=100&sort=created&sortOrder=desc&_=${Date.now()}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal, cache: "no-store" }
      );
      if (myReq !== reqIdRef.current) return;
      const data = (res as any).data ?? (res as any);
      setItems(data);
    } catch (e: any) {
      if (e?.name === "AbortError" || /aborted/i.test(String(e?.message))) return;
      setErr(e.message || "Failed to load venues");
    } finally {
      if (myReq === reqIdRef.current) setLoading(false);
    }
  }, [meName, token]);

  useEffect(() => {
    load();
    return () => loadCtrlRef.current?.abort();
  }, [load]);

  if (!meName || !token) return <div className="page">Please log in.</div>;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function onEdit(v: CreateVenue) {
    const name = window.prompt("Venue name:", v.name) || v.name;
    const priceStr = window.prompt("Price (number):", String(v.price ?? 0));
    const price = Number(priceStr ?? v.price ?? 0);
    if (!Number.isFinite(price) || price < 0) return window.alert("Invalid price");
    const city = window.prompt("City (optional):", v.location?.city || "") || undefined;
    const country = window.prompt("Country (optional):", v.location?.country || "") || undefined;
    const currentImg = v.media?.[0]?.url || "";
    const img = window.prompt("Image URL (optional):", currentImg) || "";
    const media = img ? [{ url: img, alt: name }] : [];
    loadCtrlRef.current?.abort();
    const prev = items;
    const patch = { ...v, name, price, media, location: { city, country } };
    setItems((xs) => xs.map((x) => (x.id === v.id ? patch : x)));
    try {
      await api(`/venues/${v.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          price,
          media,
          location: { city, country } }),
      });
      await sleep(250);
      await load();
    } catch (e: any) {
      setItems(prev);
      window.alert(e.message || "Update failed");
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this venue? This action cannot be undone and will cancel all bookings for this venue.")) return;
    loadCtrlRef.current?.abort();
    const prev = items;
    setItems((xs) => xs.filter((x) => x.id !== id));
    try {
      await api(`/venues/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await sleep(250);
      await load();
    } catch (e: any) {
      setItems(prev);
      window.alert(e.message || "Delete failed");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <section className="flex items-center justify-between">
        <h1 className="page-heading">Manage venues</h1>
        <Link to="/manage/venues/new" className="btn">Create venue</Link>
      </section>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((v) => (
          <div key={v.id} className="card">
            <Link to={`/my-venues/${v.id}`} className="block">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-3">
                {v.media?.[0]?.url && (
                  <img
                    src={v.media[0].url}
                    alt={v.media[0].alt || v.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="font-medium">{v.name}</div>
              {v.location?.city || v.location?.country ? (
                <div className="text-xs text-gray-500">
                  {[v.location?.city, v.location?.country].filter(Boolean).join(", ")}
                </div>
              ) : null}
              {typeof v.price === "number" && (
                <div className="mt-2 text-sm text-gray-700">€{v.price}</div>
              )}
            </Link>
            <div className="mt-3 flex gap-2">
              <Link to={`/manage/venues/${v.id}/edit`} className="btn-secondary">Edit</Link>
              <button className="btn-danger" onClick={() => onDelete(v.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
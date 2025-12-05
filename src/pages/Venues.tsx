import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { unwrap, type Venue } from "../types/holidaze";

const normalize = (s: string) => s.toLowerCase();

function matches(v: Venue, q: string) {
  if (!q) return true;
  const t = normalize(q);
  const parts = [
    v.name,
    v.description,
    v.location?.city ?? "",
    v.location?.country ?? "",
  ];
  return parts.some(p => (p ? normalize(p).includes(t) : false));
}

export default function Venues() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await api<{ data: Venue[] }>(`/venues?sort=created&sortOrder=desc`);
        if (!alive) return;
        setItems(unwrap(res));
      } catch (e: any) {
        if (!alive) return;
        setErr(e.message || "Failed to load venues");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const list = useMemo(
    () => items.filter(v => matches(v, debounced)),
    [items, debounced]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Venues</h1>

      <div className="mb-6">
        <input
          className="input max-w-md"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, description, city, country…"
        />
      </div>

      {loading && <div className="text-sm text-gray-600">Loading…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {!loading && !err && list.length === 0 && (
        <div className="text-sm text-gray-500">No venues found.</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(v => (
          <a key={v.id} href={`/venues/${v.id}`} className="card hover:shadow-md transition">
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3">
              {v.media?.[0]?.url && (
                <img src={v.media[0].url} alt={v.media[0].alt || v.name}
                     className="w-full h-full object-cover" loading="lazy"/>
              )}
            </div>
            <div className="font-medium">{v.name}</div>
            {v.location?.city || v.location?.country ? (
              <div className="text-xs text-gray-500">
                {[v.location?.city, v.location?.country].filter(Boolean).join(", ")}
              </div>
            ) : null}
            {typeof v.price === "number" && (
              <div className="mt-2 text-sm text-gray-800">€{v.price}</div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
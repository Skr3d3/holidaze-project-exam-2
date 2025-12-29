import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { unwrap, type Venue } from "../types/holidaze";
import { getUser } from "../lib/auth";

export default function Home() {
  const user = getUser<{ name: string; venueManager?: boolean }>();
  const [items, setItems] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await api<{ data: Venue[] }>("/venues?sort=rating&sortOrder=desc&limit=12");
        if (!alive) return;
        setItems(unwrap(res));
      } catch (e: any) {
        if (!alive) return;
        setErr(e.message || "Failed to load featured venues");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const featured = items.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      <section className="text-center">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
          Find your next stay with Holidaze
        </h1>
        <p className="mt-2 text-gray-600">
          Browse curated venues around the world and book in minutes.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link to="/venues" className="btn">Browse venues</Link>
          {!user && <Link to="/register" className="btn-secondary">Create account</Link>}
          {user?.venueManager && <Link to="/manage/venues" className="btn-secondary">Manage venues</Link>}
        </div>
      </section>

      <section>
        <h2 className="page-heading">Featured venues</h2>

        {loading && <div className="text-sm text-gray-600">Loading…</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}

        {!loading && !err && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(v => (
              <Link key={v.id} to={`/venues/${v.id}`} className="card hover:shadow-md transition">
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3">
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
                  <div className="mt-2 text-sm text-gray-800">€{v.price}</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
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
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <section className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[color:var(--color-text)] mb-4">
          Find your next stay with Holidaze
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          Browse curated venues around the world and book in minutes.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link to="/venues" className="btn h-12 px-6 text-base">Browse venues</Link>
          {!user && <Link to="/register" className="btn-secondary h-12 px-6 text-base">Create account</Link>}
          {user?.venueManager && <Link to="/managevenues" className="btn-secondary h-12 px-6 text-base">Manage venues</Link>}
        </div>
      </section>

      <section>
        <h2 className="page-heading">Featured venues</h2>

        {loading && <div className="text-sm text-gray-500">Loading…</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}

        {!loading && !err && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(v => (
              <Link key={v.id} to={`/venues/${v.id}`} className="card hover:shadow-lg transition group">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-3 relative">
                  {v.media?.[0]?.url ? (
                    <img
                      src={v.media[0].url}
                      alt={v.media[0].alt || v.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-gray-400 bg-gray-50">No image</div>
                  )}
                </div>
                <div className="font-semibold text-lg text-gray-900">{v.name}</div>
                <div className="flex justify-between items-start mt-1">
                  {v.location?.city || v.location?.country ? (
                    <div className="text-sm text-gray-500">
                      {[v.location?.city, v.location?.country].filter(Boolean).join(", ")}
                    </div>
                  ) : <div />}
                  {typeof v.price === "number" && (
                    <div className="text-sm font-medium text-gray-900">€{v.price}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
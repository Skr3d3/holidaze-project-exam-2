import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, apiPostJson } from "../lib/api";
import { getToken } from "../lib/auth";
import { unwrap, type Venue, type VenueWithBookings } from "../types/holidaze";

export default function VenueDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [venue, setVenue] = useState<Venue | VenueWithBookings | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [guests, setGuests] = useState(1);
  const [busy, setBusy] = useState(false);
  const [bookErr, setBookErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await api<{ data: VenueWithBookings }>(`/venues/${id}?_bookings=true`);
        if (!alive) return;
        setVenue(unwrap(res));
      } catch (e: any) {
        if (!alive) return;
        setErr(e.message || "Failed to load venue");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);


  function toISODate(d: string, endOfDay = false) {
    if (!d) return "";
    const t = new Date(d + "T00:00:00Z");
    if (endOfDay) t.setUTCHours(23, 59, 59, 999);
    return t.toISOString();
  }

  async function book() {
    setBookErr(null);
    const token = getToken();
    if (!token) { nav("/login"); return; }

    if (!id) { setBookErr("Missing venue id"); return; }
    if (!dateFrom || !dateTo) { setBookErr("Please select start and end dates"); return; }
    if (guests < 1) { setBookErr("Guests must be at least 1"); return; }

    const payload = {
      venueId: String(id),
      dateFrom: toISODate(dateFrom, false),
      dateTo:   toISODate(dateTo, true),
      guests: Number(guests),
    };

    try {
      setBusy(true);
      await apiPostJson("/bookings", payload, {
        Authorization: `Bearer ${getToken()!}`,
      });

      nav("/dashboard");
    } catch (e: any) {
      setBookErr(e.message || "Booking failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="page">Loading…</div>;
  if (err)      return <div className="page text-red-600">{err}</div>;
  if (!venue)   return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-3">
      <section className="md:col-span-2">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {venue.media?.slice(0, 4).map((m, i) => (
            <div key={i} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
              <img src={m.url} alt={m.alt || `${venue.name} ${i+1}`}
                   className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <h1 className="page-heading">{venue.name}</h1>
        {venue.location?.city || venue.location?.country ? (
          <div className="text-sm text-gray-500 mb-3">
            {[venue.location?.city, venue.location?.country].filter(Boolean).join(", ")}
          </div>
        ) : null}
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{venue.description}</p>
      </section>

      <aside className="card">
        <div className="text-xl font-semibold mb-2">
          {typeof venue.price === "number" ? `€${venue.price}` : "Price on request"}
        </div>
        <div className="text-sm text-gray-500 mb-4">
          Max guests: {venue.maxGuests ?? "—"}
        </div>

        <div className="space-y-2">
          <input type="date" className="input" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} />
          <input type="date" className="input" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} />
          <input type="number" min={1} className="input" value={guests}
                 onChange={(e)=>setGuests(Math.max(1, Number(e.target.value)||1))} />
          {bookErr && <div className="text-sm text-red-600">{bookErr}</div>}
          <button className="btn w-full" onClick={book} disabled={busy || !dateFrom || !dateTo}>
            {busy ? "Booking…" : "Book now"}
          </button>
        </div>
      </aside>
    </div>
  );
}

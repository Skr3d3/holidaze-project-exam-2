import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, apiPostJson } from "../lib/api";
import { getToken } from "../lib/auth";
import { unwrap, type Venue, type VenueWithBookings } from "../types/holidaze";

type BookingLite = { id: string; dateFrom: string; dateTo: string };

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
        const res = await api<{ data: VenueWithBookings }>(`/venues/${id}?_bookings=true&_owner=true`);
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

  const todayStr = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return toYMD(d);
  }, []);

  const bookedRanges = useMemo(() => {
    const xs: BookingLite[] = ((venue as VenueWithBookings)?.bookings || []) as any;
    return xs
      .map(b => {
        const s = new Date(b.dateFrom);
        const e = new Date(b.dateTo);
        const sYMD = toYMD(s);
        const eYMD = toYMD(e);
        return [sYMD, eYMD] as const;
      })
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [venue]);

  function toYMD(d: Date) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function isYMDInRange(ymd: string, s: string, e: string) {
    return ymd >= s && ymd <= e;
  }

  function dateOverlapsAnyRange(startYMD: string, endYMD: string) {
    if (!startYMD || !endYMD) return false;
    return bookedRanges.some(([s, e]) => !(endYMD < s || startYMD > e));
  }

  function isSingleDateBooked(ymd: string) {
    if (!ymd) return false;
    return bookedRanges.some(([s, e]) => isYMDInRange(ymd, s, e));
  }

  function toISODate(d: string, endOfDay = false) {
    if (!d) return "";
    const t = new Date(d + "T00:00:00Z");
    if (endOfDay) t.setUTCHours(23, 59, 59, 999);
    return t.toISOString();
  }

  function handleDateFromChange(v: string) {
    setBookErr(null);
    if (!v) { setDateFrom(""); return; }
    if (isSingleDateBooked(v)) {
      setBookErr("That start date is already booked.");
      return;
    }
    // adjust end if invalid or overlapping
    if (dateTo && (dateTo < v || dateOverlapsAnyRange(v, dateTo))) {
      setDateTo("");
    }
    setDateFrom(v);
  }

  function handleDateToChange(v: string) {
    setBookErr(null);
    if (!v) { setDateTo(""); return; }
    if (!dateFrom) {
      setBookErr("Pick a start date first.");
      return;
    }
    if (v < dateFrom) {
      setBookErr("End date must be after start date.");
      return;
    }
    if (dateOverlapsAnyRange(dateFrom, v)) {
      setBookErr("Your date range overlaps an existing booking.");
      return;
    }
    setDateTo(v);
  }

  async function book() {
    setBookErr(null);
    const token = getToken();
    if (!token) { nav("/login"); return; }

    if (!id) { setBookErr("Missing venue id"); return; }
    if (!dateFrom || !dateTo) { setBookErr("Please select start and end dates"); return; }
    if (guests < 1) { setBookErr("Guests must be at least 1"); return; }
    if (dateOverlapsAnyRange(dateFrom, dateTo)) {
      setBookErr("Your date range overlaps an existing booking.");
      return;
    }

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
      nav("/profile");
    } catch (e: any) {
      setBookErr(e.message || "Booking failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="page">Loading…</div>;
  if (err)      return <div className="page text-red-600">{err}</div>;
  if (!venue)   return null;

  const mg = typeof venue.maxGuests === "number" ? venue.maxGuests : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-3">
      <section className="md:col-span-2">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {venue.media?.slice(0, 4).map((m, i) => (
            <div key={i} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
              <img src={m.url} alt={m.alt || `${venue.name} ${i+1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <h1 className="page-heading">{venue.name}</h1>

        {(venue.location?.city || venue.location?.country) && (
          <div className="text-sm text-gray-500 mb-3">
            {[venue.location?.city, venue.location?.country].filter(Boolean).join(", ")}
          </div>
        )}

        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-6">{venue.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <Amenity label="Wifi" active={Boolean((venue as any)?.meta?.wifi)} />
          <Amenity label="Parking" active={Boolean((venue as any)?.meta?.parking)} />
          <Amenity label="Breakfast" active={Boolean((venue as any)?.meta?.breakfast)} />
          <Amenity label="Pets" active={Boolean((venue as any)?.meta?.pets)} />
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <div>Rating: {typeof (venue as any).rating === "number" ? `${(venue as any).rating} / 5` : "—"}</div>
          <div>Max guests: {venue.maxGuests ?? "—"}</div>
          {(venue as any)?.owner?.name && <div>Host: {(venue as any).owner.name}</div>}
        </div>
      </section>

      <aside className="card">
        <div className="text-xl font-semibold mb-2">
          {typeof venue.price === "number" ? `€${venue.price}` : "Price on request"}
        </div>
        <div className="text-sm text-gray-500 mb-4">Max guests: {venue.maxGuests ?? "—"}</div>

        <div className="space-y-2">
          <input
            type="date"
            className="input"
            value={dateFrom}
            onChange={(e)=>handleDateFromChange(e.target.value)}
            min={todayStr}
          />
          <input
            type="date"
            className="input"
            value={dateTo}
            onChange={(e)=>handleDateToChange(e.target.value)}
            min={dateFrom || todayStr}
          />
          <input
            type="number"
            min={1}
            {...(mg ? { max: mg } : {})}
            className="input"
            value={guests}
            onChange={(e)=>setGuests(Math.min(mg ?? Infinity, Math.max(1, Number(e.target.value)||1)))}
          />
          {bookErr && <div className="text-sm text-red-600">{bookErr}</div>}
          <button className="btn w-full" onClick={book} disabled={busy || !dateFrom || !dateTo}>
            {busy ? "Booking…" : "Book now"}
          </button>
        </div>

        {bookedRanges.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Booked dates</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {bookedRanges.map(([s, e], i) => (
                <span key={i} className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                  {s} → {e}
                </span>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Selected dates can’t overlap the ranges above.
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function Amenity({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`text-xs px-2 py-1 rounded-full border ${
      active ? "bg-emerald-50 border-emerald-200 text-emerald-700"
             : "bg-gray-50 border-gray-200 text-gray-500"
    }`}>
      {label}
    </div>
  );
}
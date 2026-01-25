import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { getToken } from "../lib/auth";

type Booking = {
  id: string;
  dateFrom: string;
  dateTo: string;
  guests: number;
  venue: { id: string; name: string; maxGuests?: number } | null;
};

type VenueWithBookings = {
  id: string;
  name: string;
  maxGuests?: number;
  bookings?: { id: string; dateFrom: string; dateTo: string }[];
};

export default function BookingEdit() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const token = getToken();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [guests, setGuests] = useState(1);
  const [venue, setVenue] = useState<VenueWithBookings | null>(null);

  const loadCtrl = useRef<AbortController | null>(null);

  const todayStr = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0);
    return toYMD(d);
  }, []);

  useEffect(() => {
    if (!id) return;
    loadCtrl.current?.abort();
    const ctrl = new AbortController();
    loadCtrl.current = ctrl;
    setLoading(true); setErr(null);
    (async () => {
      try {
        const bRes = await api<{ data: Booking }>(`/bookings/${encodeURIComponent(id)}?_venue=true`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: ctrl.signal,
          cache: "no-store",
        });
        const booking = (bRes as any).data ?? bRes;
        if (!booking?.venue?.id) throw new Error("Missing venue for booking");

        setDateFrom(String(booking.dateFrom).slice(0, 10));
        setDateTo(String(booking.dateTo).slice(0, 10));
        setGuests(booking.guests);

        const vRes = await api<{ data: VenueWithBookings }>(
          `/venues/${encodeURIComponent(booking.venue.id)}?_bookings=true`,
          { signal: ctrl.signal, cache: "no-store" }
        );
        const v = (vRes as any).data ?? vRes;
        setVenue(v);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e.message || "Failed to load booking");
      } finally {
        setLoading(false);
      }
    })();
    return () => loadCtrl.current?.abort();
  }, [id, token]);

  const bookedRanges = useMemo(() => {
    const xs = venue?.bookings || [];
    return xs
      .filter(b => b.id !== id)
      .map(b => [toYMD(new Date(b.dateFrom)), toYMD(new Date(b.dateTo))] as const)
      .sort((a,b) => a[0].localeCompare(b[0]));
  }, [venue, id]);

  function toYMD(d: Date) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function overlapsAny(s: string, e: string) {
    if (!s || !e) return false;
    return bookedRanges.some(([bs, be]) => !(e < bs || s > be));
  }

  function onChangeStart(v: string) {
    setErr(null);
    if (!v) { setDateFrom(""); return; }
    if (dateTo && (dateTo < v || overlapsAny(v, dateTo))) setDateTo("");
    setDateFrom(v);
  }

  function onChangeEnd(v: string) {
    setErr(null);
    if (!v) { setDateTo(""); return; }
    if (!dateFrom) { setErr("Pick a start date first."); return; }
    if (v < dateFrom) { setErr("End date must be after start date."); return; }
    if (overlapsAny(dateFrom, v)) { setErr("Selected range overlaps another booking."); return; }
    setDateTo(v);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    if (!token) { nav("/login"); return; }
    if (!dateFrom || !dateTo) { setErr("Please select start and end dates"); return; }
    if (guests < 1) { setErr("Guests must be at least 1"); return; }
    if (overlapsAny(dateFrom, dateTo)) { setErr("Selected range overlaps another booking."); return; }

    setSaving(true); setErr(null);
    try {
      await api(`/bookings/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          dateFrom: new Date(dateFrom + "T00:00:00Z").toISOString(),
          dateTo:   new Date(dateTo   + "T23:59:59.999Z").toISOString(),
          guests,
        }),
      });
      nav("/profile");
    } catch (e: any) {
      setErr(e.message || "Failed to save booking");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page">Loading…</div>;
  if (!venue) return <div className="page">No booking found.</div>;

  const mg = typeof venue.maxGuests === "number" ? venue.maxGuests : undefined;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Edit booking</h1>
      <div className="text-sm text-gray-600 mb-4">
        Venue: <span className="font-medium">{venue.name}</span>
      </div>

      {bookedRanges.length > 0 && (
        <div className="mb-4 text-xs text-gray-600">
          Booked: {bookedRanges.map(([s,e], i) => <span key={i} className="mr-2">{s}–{e}</span>)}
        </div>
      )}

      <form onSubmit={onSave} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Start date</label>
          <input type="date" className="input" value={dateFrom} onChange={e=>onChangeStart(e.target.value)} min={todayStr} />
        </div>
        <div>
          <label className="block text-sm mb-1">End date</label>
          <input type="date" className="input" value={dateTo} onChange={e=>onChangeEnd(e.target.value)} min={dateFrom || todayStr} />
        </div>
        <div>
          <label className="block text-sm mb-1">Guests{mg ? ` (max ${mg})` : ""}</label>
          <input
            type="number"
            className="input"
            min={1}
            {...(mg ? { max: mg } : {})}
            value={guests}
            onChange={(e)=>setGuests(Math.min(mg ?? Infinity, Math.max(1, Number(e.target.value)||1)))}
          />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex gap-3 mt-2">
          <button className="btn" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
          <button type="button" className="btn-secondary" onClick={()=>nav(-1)} disabled={saving}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
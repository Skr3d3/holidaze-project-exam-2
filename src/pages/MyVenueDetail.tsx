import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { getToken } from "../lib/auth";
import type { Venue, Booking } from "../types/holidaze";

type BookingWithCustomer = Booking & {
  customer?: {
    name?: string;
    email?: string;
    avatar?: { url: string; alt?: string };
  };
};

type VenueWithBookings = Venue & {
  bookings?: BookingWithCustomer[];
};

export default function MyVenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const safeId = id ?? "";
  const token = useMemo(() => getToken(), []);
  const [venue, setVenue] = useState<VenueWithBookings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadCtrlRef = useRef<AbortController | null>(null);

  const loadVenue = useCallback(async () => {
    if (!safeId) return;
    loadCtrlRef.current?.abort();
    const ctrl = new AbortController();
    loadCtrlRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ data: VenueWithBookings }>(
        `/venues/${encodeURIComponent(safeId)}?_bookings=true&_owner=true&_=${Date.now()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: ctrl.signal,
          cache: "no-store",
        }
      );
      const venueData = (res as any).data ?? res;
      setVenue(venueData as VenueWithBookings);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e.message || "Failed to load venue details.");
    } finally {
      setLoading(false);
    }
  }, [safeId, token]);

  useEffect(() => {
    loadVenue();
    return () => loadCtrlRef.current?.abort();
  }, [loadVenue]);

  if (loading) return <div className="page">Loading venue details...</div>;
  if (error) {
    return (
      <div className="page text-red-500">
        Error: {error}
        <button onClick={loadVenue} className="btn mt-4">Retry</button>
      </div>
    );
  }
  if (!venue) return <div className="page">Venue not found.</div>;

  const bookings = venue.bookings ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <section>
        <h1 className="text-3xl font-semibold mb-4 text-[color:var(--color-text)]">{venue.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {venue.media?.[0]?.url ? (
              <img
                src={venue.media[0].url}
                alt={venue.media[0].alt || venue.name}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full aspect-video bg-gray-200 rounded-lg grid place-items-center">
                <p className="text-gray-500">No image available</p>
              </div>
            )}
          </div>
          <div>
            <h2 className="page-heading">Details</h2>
            {venue.description && <p className="text-gray-700 mb-4">{venue.description}</p>}
            {typeof venue.price === "number" && (
              <p><strong>Price per night:</strong> €{venue.price}</p>
            )}
            <p><strong>Max guests:</strong> {venue.maxGuests}</p>
            {"rating" in venue && (
              <p><strong>Rating:</strong> {(venue as any).rating ?? 0} / 5</p>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="page-heading">Bookings</h2>
        <div className="space-y-4">
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <div key={booking.id} className="card flex items-start sm:items-center gap-4">
                <div className="shrink-0">
                  {booking.customer?.avatar?.url ? (
                    <img
                      src={booking.customer.avatar.url}
                      alt={booking.customer?.name || "Customer"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                     <div>
                        <p className="font-semibold">{booking.customer?.name || "Customer"}</p>
                        {booking.customer?.email && (
                          <p className="text-sm text-gray-500">{booking.customer.email}</p>
                        )}
                     </div>
                     <div className="text-sm mt-2 sm:mt-0 text-gray-700">
                        <p><strong>From:</strong> {new Date(booking.dateFrom).toLocaleDateString()}</p>
                        <p><strong>To:</strong> {new Date(booking.dateTo).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <p className="text-sm mt-1 text-gray-700"><strong>Guests:</strong> {booking.guests}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No bookings for this venue yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

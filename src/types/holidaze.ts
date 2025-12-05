export type ApiSingle<T> = { data: T; meta?: unknown };
export type ApiList<T>   = { data: T[]; meta?: unknown };
export type MaybeWrapped<T> = T | ApiSingle<T> | ApiList<T>;
export function unwrap<T>(res: MaybeWrapped<T>): T {
  return (res && typeof res === "object" && "data" in res) ? (res as any).data : (res as T);
}

export type ImageRef = { url: string; alt: string };
export type MetaFacilities = { wifi: boolean; parking: boolean; breakfast: boolean; pets: boolean };
export type GeoLocation = {
  address: string | null; city: string | null; zip: string | null; country: string | null;
  continent: string | null; lat: number; lng: number;
};

export type Venue = {
  id: string; name: string; description: string;
  media: ImageRef[]; price: number; maxGuests: number; rating: number;
  created: string; updated: string;
  meta: MetaFacilities; location: GeoLocation;
};
export type VenueOwner = { name: string; email: string; bio?: string; avatar?: ImageRef; banner?: ImageRef };
export type VenueBookingLite = { id: string; dateFrom: string; dateTo: string; guests: number; created: string; updated: string };
export type VenueWithOwner    = Venue & { owner: VenueOwner };
export type VenueWithBookings = Venue & { bookings: VenueBookingLite[] };

export type Booking = { id: string; dateFrom: string; dateTo: string; guests: number; created: string; updated: string };
export type BookingWithVenue = Booking & { venue: Venue | VenueWithOwner };

export type ProfileCore = {
  name: string; email: string; bio?: string; avatar?: ImageRef; banner?: ImageRef; venueManager: boolean;
  _count?: { venues: number; bookings: number };
};
export type ProfileWithVenues   = ProfileCore & { venues: Venue[] };
export type ProfileWithBookings = ProfileCore & { bookings: Booking[] | BookingWithVenue[] };
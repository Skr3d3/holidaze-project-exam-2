import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { getUser, getToken } from "../lib/auth";
import type { Venue } from "../types/holidaze";

export default function VenueUpsert() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const me = getUser<{ name: string; venueManager?: boolean }>();
  const token = getToken();
  const loadCtrl = useRef<AbortController | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [maxGuests, setMaxGuests] = useState<number | "">("");
  const [mediaInput, setMediaInput] = useState("");
  const [wifi, setWifi] = useState(false);
  const [parking, setParking] = useState(false);
  const [breakfast, setBreakfast] = useState(false);
  const [pets, setPets] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [continent, setContinent] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function parseMedia(input: string) {
    const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    return lines.map(l => {
      const [url, alt] = l.split("|").map(s => s?.trim() || "");
      return { url, alt: alt || undefined };
    });
  }

  function stringifyMedia(media?: { url: string; alt?: string }[]) {
    if (!media?.length) return "";
    return media.map(m => (m.alt ? `${m.url}|${m.alt}` : m.url)).join("\n");
  }

  useEffect(() => {
    if (!isEdit || !id || !token) return;
    loadCtrl.current?.abort();
    const ctrl = new AbortController();
    loadCtrl.current = ctrl;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const res = await api<{ data: Venue }>(`/venues/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
          cache: "no-store",
        });
        const v = (res as any).data ?? res;
        setName(v.name ?? "");
        setDescription(v.description ?? "");
        setPrice(typeof v.price === "number" ? v.price : "");
        setMaxGuests(typeof v.maxGuests === "number" ? v.maxGuests : "");
        setMediaInput(stringifyMedia(v.media));
        setWifi(Boolean(v.meta?.wifi));
        setParking(Boolean(v.meta?.parking));
        setBreakfast(Boolean(v.meta?.breakfast));
        setPets(Boolean(v.meta?.pets));
        setAddress(v.location?.address ?? "");
        setCity(v.location?.city ?? "");
        setZip(v.location?.zip ?? "");
        setCountry(v.location?.country ?? "");
        setContinent(v.location?.continent ?? "");
        setLat(typeof v.location?.lat === "number" && Number.isFinite(v.location.lat) ? String(v.location.lat) : "");
        setLng(typeof v.location?.lng === "number" && Number.isFinite(v.location.lng) ? String(v.location.lng) : "");
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e.message || "Failed to load venue");
      } finally {
        setLoading(false);
      }
    })();
    return () => loadCtrl.current?.abort();
  }, [isEdit, id, token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { setErr("Not authenticated"); return; }
    if (!name.trim()) { setErr("Name is required"); return; }
    if (!description.trim()) { setErr("Description is required"); return; }
    const p = typeof price === "string" ? Number(price) : price;
    const mg = typeof maxGuests === "string" ? Number(maxGuests) : maxGuests;
    if (!Number.isFinite(p) || p! <= 0) { setErr("Price must be a positive number"); return; }
    if (!Number.isInteger(mg) || mg! < 1) { setErr("Max guests must be an integer ≥ 1"); return; }

    const media = parseMedia(mediaInput);
    const latNum = lat ? Number(lat) : undefined;
    const lngNum = lng ? Number(lng) : undefined;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: p,
      maxGuests: mg,
      media: media.length ? media : undefined,
      meta: { wifi, parking, breakfast, pets },
      location: {
        address: address || undefined,
        city: city || undefined,
        zip: zip || undefined,
        country: country || undefined,
        continent: continent || undefined,
        lat: Number.isFinite(latNum!) ? latNum : undefined,
        lng: Number.isFinite(lngNum!) ? lngNum : undefined,
      },
    };

    setBusy(true);
    setErr(null);
    try {
      if (isEdit && id) {
        await api(`/venues/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        nav(`/my-venues/${id}`);
      } else {
        const res = await api<{ data: Venue }>(`/venues`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const created = (res as any).data ?? res;
        const vid = (created as any)?.id;
        nav(vid ? `/my-venues/${vid}` : "/manage/venues");
      }
    } catch (e: any) {
      setErr(e?.message || (isEdit ? "Failed to save venue" : "Failed to create venue"));
    } finally {
      setBusy(false);
    }
  }

  const blockMsg = !me ? "Please log in." : !me.venueManager ? "Only venue managers can access this page." : null;

  if (loading) return <div className="page">Loading…</div>;
  if (blockMsg) return <div className="page">{blockMsg}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">{isEdit ? "Edit venue" : "Create new venue"}</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Price (per night)</label>
            <input className="input" type="number" min={1} value={price} onChange={e=>setPrice(e.target.value === "" ? "" : Number(e.target.value))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Max guests</label>
            <input className="input" type="number" min={1} value={maxGuests} onChange={e=>setMaxGuests(e.target.value === "" ? "" : Number(e.target.value))} required />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea className="input h-28" value={description} onChange={e=>setDescription(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm mb-1">Media (one per line, optionally “url|alt”)</label>
          <textarea className="input h-28" placeholder={"https://…/photo1.jpg|Front view\nhttps://…/photo2.jpg"} value={mediaInput} onChange={e=>setMediaInput(e.target.value)} />
        </div>

        <fieldset className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={wifi} onChange={e=>setWifi(e.target.checked)} /> Wifi
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={parking} onChange={e=>setParking(e.target.checked)} /> Parking
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={breakfast} onChange={e=>setBreakfast(e.target.checked)} /> Breakfast
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pets} onChange={e=>setPets(e.target.checked)} /> Pets
          </label>
        </fieldset>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Address</label>
            <input className="input" value={address} onChange={e=>setAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">City</label>
            <input className="input" value={city} onChange={e=>setCity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">ZIP</label>
            <input className="input" value={zip} onChange={e=>setZip(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Country</label>
            <input className="input" value={country} onChange={e=>setCountry(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Continent</label>
            <input className="input" value={continent} onChange={e=>setContinent(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Latitude</label>
              <input className="input" value={lat} onChange={e=>setLat(e.target.value)} placeholder="e.g. 60.39" />
            </div>
            <div>
              <label className="block text-sm mb-1">Longitude</label>
              <input className="input" value={lng} onChange={e=>setLng(e.target.value)} placeholder="e.g. 5.32" />
            </div>
          </div>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex gap-3">
          <button className="btn" disabled={busy}>
            {busy ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save changes" : "Create venue")}
          </button>
          <button type="button" className="btn-secondary" onClick={()=>nav(-1)} disabled={busy}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
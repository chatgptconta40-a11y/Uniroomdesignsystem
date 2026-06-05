import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router';
import { X, Heart, GraduationCap, MapPin, Wifi, Car } from 'lucide-react';
import { ESTGV, haversineKm, walkMinutesFromDistance } from '../utils/estgv';
import { useFavorites } from '../context/FavoritesContext';
import type { Accommodation } from '../types/accommodation';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

// ─── Icons ─────────────────────────────────────────────────────────────────────

const ESTGV_ICON = L.divIcon({
  className: '',
  iconSize: [34, 42],
  iconAnchor: [17, 42],
  html: `
    <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.611 0 0 7.611 0 17c0 11.5 15 25 15.925 25.937a1.5 1.5 0 0 0 2.15 0C19 41.938 34 28.5 34 17 34 7.611 26.389 0 17 0z" fill="#f59e0b"/>
      <path d="M10 16l7-5 7 5v7H10v-7z" fill="white" opacity="0.95"/>
      <rect x="14" y="18" width="3" height="5" fill="#f59e0b"/>
      <path d="M17 11l-9 6h18l-9-6z" fill="white"/>
    </svg>`,
});

function pricePin(price: number, selected: boolean) {
  const bg = selected ? '#7c3aed' : '#ffffff';
  const color = selected ? '#ffffff' : '#111827';
  const border = selected ? '#7c3aed' : '#e5e7eb';
  const label = price >= 1000 ? `${(price / 1000).toFixed(1)}k` : `${price}`;
  return L.divIcon({
    className: '',
    iconSize: [66, 28],
    iconAnchor: [33, 14],
    html: `<div style="background:${bg};color:${color};border:1.5px solid ${border};border-radius:9999px;padding:3px 10px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.2);line-height:20px">€${label}</div>`,
  });
}

// ─── Click-away handler ────────────────────────────────────────────────────────

function MapClickAway({ onClose }: { onClose: () => void }) {
  useMapEvents({ click: onClose });
  return null;
}

// ─── Mini accommodation card ───────────────────────────────────────────────────

function MiniCard({
  acc,
  isFav,
  onFav,
  onClose,
}: {
  acc: Accommodation;
  isFav: boolean;
  onFav: () => void;
  onClose: () => void;
}) {
  const distKm = haversineKm(acc.coordinates, { lat: ESTGV.lat, lng: ESTGV.lng });
  const walkMin = walkMinutesFromDistance(distKm);

  return (
    <div className="bg-card rounded-xl shadow-xl border border-border w-72 overflow-hidden">
      <div className="relative h-36">
        {acc.images?.[0] ? (
          <img src={acc.images[0]} alt={acc.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground opacity-30" />
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onFav(); }}
          className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-400 text-red-400' : ''}`} />
        </button>
      </div>
      <div className="p-3">
        <p className="font-bold text-sm truncate text-foreground">{acc.title}</p>
        <p className="text-xs text-muted-foreground truncate">{acc.zone}, {acc.city}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />~{walkMin} min</span>
          {acc.amenities.wifi && <span className="flex items-center gap-1"><Wifi className="w-3 h-3" />WiFi</span>}
          {acc.amenities.parking && <span className="flex items-center gap-1"><Car className="w-3 h-3" />Parking</span>}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-foreground text-sm">
            €{acc.price}<span className="text-xs font-normal text-muted-foreground">/mês</span>
          </span>
          <Link
            to={`/accommodations/${acc.id}`}
            className="text-xs font-bold text-white bg-primary rounded-lg px-3 py-1 hover:bg-primary/90 transition-colors"
          >
            Ver alojamento
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface MapViewProps {
  accommodations: Accommodation[];
}

export function MapView({ accommodations }: MapViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const selected = accommodations.find(a => a.id === selectedId) ?? null;

  function getPos(acc: Accommodation): [number, number] {
    return [acc.coordinates.lat, acc.coordinates.lng];
  }

  return (
    <div className="relative h-[620px] w-full rounded-2xl overflow-hidden border border-border">
      <MapContainer
        center={[ESTGV.lat, ESTGV.lng]}
        zoom={13}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* ESTGV marker */}
        <Marker position={[ESTGV.lat, ESTGV.lng]} icon={ESTGV_ICON} />

        {/* Property markers */}
        {accommodations.map(acc => (
          <Marker
            key={acc.id}
            position={getPos(acc)}
            icon={pricePin(acc.price, acc.id === selectedId)}
            eventHandlers={{ click: () => setSelectedId(acc.id) }}
          />
        ))}

        <MapClickAway onClose={() => setSelectedId(null)} />
      </MapContainer>

      {/* ESTGV legend */}
      <div className="absolute top-3 left-3 z-[1000] rounded-xl bg-white/95 border border-border px-3 py-2 shadow-md backdrop-blur flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-xs font-bold text-foreground">{ESTGV.shortName}</span>
      </div>

      {/* Mini card popup */}
      {selected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
          <MiniCard
            acc={selected}
            isFav={isFavorite(selected.id)}
            onFav={() => toggleFavorite(selected.id)}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}

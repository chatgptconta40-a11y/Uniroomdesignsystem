import 'leaflet/dist/leaflet.css';
import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router';
import { X, Heart, Bath, Maximize, GraduationCap } from 'lucide-react';
import { ESTGV, walkMinutesFromDistance, haversineKm } from '../../utils/estgv';
import { useFavorites } from '../../context/FavoritesContext';
import { useAuth } from '../../context/AuthContext';
import type { Property, Room } from '../../types/property';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

// ─── Marker icons ──────────────────────────────────────────────────────────────

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
  const bg = selected ? '#7c3aed' : '#fff';
  const text = selected ? '#fff' : '#1f2937';
  const border = selected ? '#7c3aed' : '#e5e7eb';
  const label = price >= 1000 ? `${(price / 1000).toFixed(1)}k` : `${price}`;
  return L.divIcon({
    className: '',
    iconSize: [64, 28],
    iconAnchor: [32, 14],
    html: `<div style="background:${bg};color:${text};border:1.5px solid ${border};border-radius:9999px;padding:3px 10px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.18);line-height:20px">€${label}</div>`,
  });
}

// ─── Map click-away handler ────────────────────────────────────────────────────

function MapClickHandler({ onClose }: { onClose: () => void }) {
  useMapEvents({ click: onClose });
  return null;
}

// ─── Mini card popup ───────────────────────────────────────────────────────────

interface ResultItem {
  room: Room;
  property: Property;
  availableRooms: number;
}

function MiniCard({
  item,
  onClose,
}: {
  item: ResultItem;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(item.room.id);
  const distKm = item.property.coordinates
    ? haversineKm(item.property.coordinates, { lat: ESTGV.lat, lng: ESTGV.lng })
    : item.property.distanceToUniversity;
  const walkMin = walkMinutesFromDistance(distKm);

  return (
    <div className="bg-card rounded-xl shadow-xl border border-border w-72 overflow-hidden">
      <div className="relative h-36">
        {item.room.images?.[0] ? (
          <img
            src={item.room.images[0]}
            alt={item.room.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-muted-foreground opacity-40" />
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {user && (
          <button
            onClick={e => { e.stopPropagation(); toggleFavorite(item.room.id); }}
            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-400 text-red-400' : ''}`} />
          </button>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm truncate text-foreground">{item.room.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.property.zone}, {item.property.city}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          {item.room.size && (
            <span className="flex items-center gap-1"><Maximize className="w-3 h-3" />{item.room.size}m²</span>
          )}
          {item.room.privateBathroom && (
            <span className="flex items-center gap-1"><Bath className="w-3 h-3" />WC privativo</span>
          )}
          <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />~{walkMin} min</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-foreground text-sm">€{item.room.price}<span className="text-xs font-normal text-muted-foreground">/mês</span></span>
          <button
            onClick={() => navigate(`/rooms/${item.room.id}`)}
            className="text-xs font-bold text-white bg-primary rounded-lg px-3 py-1 hover:bg-primary/90 transition-colors"
          >
            Ver quarto
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface SearchLeafletMapProps {
  results: ResultItem[];
  heightClass?: string;
}

export function SearchLeafletMap({ results, heightClass = 'h-[520px]' }: SearchLeafletMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Group rooms by property to show one marker per property
  const groups = useMemo(() => {
    const map = new Map<string, { property: Property; rooms: Room[]; minPrice: number }>();
    for (const { property, room } of results) {
      const existing = map.get(property.id);
      if (existing) {
        existing.rooms.push(room);
        if (room.price < existing.minPrice) existing.minPrice = room.price;
      } else {
        map.set(property.id, { property, rooms: [room], minPrice: room.price });
      }
    }
    return Array.from(map.values());
  }, [results]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    const found = results.find(r => r.room.id === selectedId);
    return found ?? null;
  }, [selectedId, results]);

  // Property coordinates — fall back to Viseu centre if missing
  function getCoords(property: Property): [number, number] {
    if (property.coordinates) return [property.coordinates.lat, property.coordinates.lng];
    // Stable pseudo-random fallback within Viseu area
    let h = 0;
    for (let i = 0; i < property.id.length; i++) h = (Math.imul(31, h) + property.id.charCodeAt(i)) | 0;
    const frac1 = ((h >>> 0) % 1000) / 1000;
    const frac2 = ((h >>> 16) % 1000) / 1000;
    return [
      40.55 + frac1 * 0.2,
      -8.05 + frac2 * 0.2,
    ];
  }

  return (
    <div className={`relative ${heightClass} w-full`}>
      <MapContainer
        center={[ESTGV.lat, ESTGV.lng]}
        zoom={13}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* ESTGV marker */}
        <Marker position={[ESTGV.lat, ESTGV.lng]} icon={ESTGV_ICON} />

        {/* Property markers */}
        {groups.map(({ property, rooms, minPrice }) => {
          const isSelected = rooms.some(r => r.id === selectedId);
          return (
            <Marker
              key={property.id}
              position={getCoords(property)}
              icon={pricePin(minPrice, isSelected)}
              eventHandlers={{
                click: () => {
                  const firstAvailable = results.find(
                    r => r.property.id === property.id && r.room.status === 'available',
                  ) ?? results.find(r => r.property.id === property.id);
                  if (firstAvailable) setSelectedId(firstAvailable.room.id);
                },
              }}
            />
          );
        })}

        <MapClickHandler onClose={() => setSelectedId(null)} />
      </MapContainer>

      {/* Mini card overlay */}
      {selectedItem && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
          <MiniCard item={selectedItem} onClose={() => setSelectedId(null)} />
        </div>
      )}
    </div>
  );
}

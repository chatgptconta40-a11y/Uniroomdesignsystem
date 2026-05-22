import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MapPin, X, Heart, Navigation, Bath, Maximize } from 'lucide-react';
import { Room, Property } from '../types/property';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

interface ResultItem {
  room: Room;
  property: Property;
  availableRooms: number;
}

interface PropertyGroup {
  property: Property;
  rooms: Room[];
  availableCount: number;
}

// Bounding box around Viseu area (covers ~20km radius)
const MAP_BOUNDS = {
  minLat: 40.55,
  maxLat: 40.75,
  minLng: -8.05,
  maxLng: -7.85,
};

// Stable pseudo-random position for properties without coordinates
function stablePosition(seed: string): { lat: number; lng: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const frac1 = ((h >>> 0) % 1000) / 1000;
  const frac2 = ((h >>> 16) % 1000) / 1000;
  return {
    lat: MAP_BOUNDS.minLat + frac1 * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat),
    lng: MAP_BOUNDS.minLng + frac2 * (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng),
  };
}

function latLngToPercent(lat: number, lng: number) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(92, y)) };
}

function MiniRoomCard({ room, property, onClose }: { room: Room; property: Property; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(room.id);

  const compatTone =
    (room.compatibilityScore || 0) >= 80 ? 'text-green-600' :
    (room.compatibilityScore || 0) >= 60 ? 'text-amber-600' : 'text-muted-foreground';

  return (
    <div className="bg-card rounded-xl shadow-xl border border-border w-72 overflow-hidden">
      <div className="relative h-36">
        <img
          src={room.images[0] || property.images[0]}
          alt={room.title}
          className="w-full h-full object-cover"
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
        >
          <X className="w-3.5 h-3.5 text-foreground" />
        </button>
        {user && (
          <button
            onClick={() => toggleFavorite(room.id)}
            className="absolute top-2 left-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
        )}
        {room.compatibilityScore && (
          <div className={`absolute bottom-2 right-2 bg-white/95 px-2 py-0.5 rounded-full text-xs font-bold ${compatTone}`}>
            {room.compatibilityScore}%
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-foreground text-sm line-clamp-1 mb-1">{room.title}</h4>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0 text-primary" />
          <span className="line-clamp-1">{property.zone}, {property.city}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Navigation className="w-3 h-3" />
          <span>{property.distanceToUniversity}km da uni</span>
          {room.size && (
            <>
              <span className="text-border">·</span>
              <Maximize className="w-3 h-3" />
              <span>{room.size}m²</span>
            </>
          )}
          {room.privateBathroom && (
            <>
              <span className="text-border">·</span>
              <Bath className="w-3 h-3" />
              <span>WC priv.</span>
            </>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">€{room.price}</span>
            <span className="text-xs text-muted-foreground">/mês</span>
          </div>
          <button
            onClick={() => navigate(`/room/${room.id}`)}
            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            Ver detalhes
          </button>
        </div>
      </div>
    </div>
  );
}

export function SearchMapView({ results }: { results: ResultItem[] }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedRoomIdx, setSelectedRoomIdx] = useState(0);

  // Group rooms by property
  const groups: PropertyGroup[] = Object.values(
    results.reduce<Record<string, PropertyGroup>>((acc, { room, property, availableRooms }) => {
      if (!acc[property.id]) {
        acc[property.id] = { property, rooms: [], availableCount: availableRooms };
      }
      acc[property.id].rooms.push(room);
      return acc;
    }, {})
  );

  const selectedGroup = selectedPropertyId ? groups.find(g => g.property.id === selectedPropertyId) : null;
  const selectedRoom = selectedGroup?.rooms[selectedRoomIdx] ?? null;

  return (
    <div className="flex gap-0 h-[calc(100vh-13rem)] min-h-[500px] rounded-2xl overflow-hidden border border-border shadow-md">
      {/* Left panel: scrollable room list */}
      <div className="w-72 flex-shrink-0 bg-card border-r border-border overflow-y-auto">
        <div className="p-3 border-b border-border bg-muted/40">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {groups.length} {groups.length === 1 ? 'propriedade' : 'propriedades'}
          </p>
        </div>
        {groups.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nenhum quarto encontrado com estes filtros.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {groups.map(({ property, rooms, availableCount }) => (
              <button
                key={property.id}
                onClick={() => {
                  setSelectedPropertyId(property.id);
                  setSelectedRoomIdx(0);
                }}
                className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                  selectedPropertyId === property.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                }`}
              >
                <div className="flex gap-2.5">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground line-clamp-2 mb-1">{property.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{property.zone}, {property.city}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
                        {availableCount} livres
                      </span>
                      <span className="text-[10px] text-muted-foreground">{rooms.length} quartos</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden bg-[#e8edf3]">
        {/* Grid pattern simulating map tiles */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(100,130,180,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,130,180,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Fake roads */}
        <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="45%" x2="100%" y2="52%" stroke="#b8c4d0" strokeWidth="6" />
          <line x1="30%" y1="0" x2="38%" y2="100%" stroke="#b8c4d0" strokeWidth="4" />
          <line x1="60%" y1="0" x2="55%" y2="100%" stroke="#c5cdd9" strokeWidth="3" />
          <line x1="0" y1="70%" x2="100%" y2="65%" stroke="#c5cdd9" strokeWidth="3" />
          <line x1="10%" y1="0" x2="20%" y2="100%" stroke="#d0d7e0" strokeWidth="2" />
          <line x1="80%" y1="0" x2="75%" y2="100%" stroke="#d0d7e0" strokeWidth="2" />
        </svg>

        {/* Water/park patches */}
        <div className="absolute rounded-full bg-blue-200/50 w-16 h-10" style={{ left: '15%', top: '25%' }} />
        <div className="absolute rounded-full bg-green-200/40 w-24 h-16" style={{ left: '65%', top: '60%' }} />

        {/* Compass */}
        <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full shadow flex items-center justify-center text-xs font-bold text-foreground z-10">
          N
        </div>

        {/* Scale bar */}
        <div className="absolute bottom-3 right-3 bg-white/90 rounded px-2 py-1 text-[10px] text-muted-foreground flex items-center gap-1 z-10 shadow-sm">
          <div className="w-8 h-0.5 bg-foreground/60" />
          1km
        </div>

        {/* Property pins */}
        {groups.map(({ property, rooms, availableCount }) => {
          const coords = property.coordinates ?? stablePosition(property.id);
          const { x, y } = latLngToPercent(coords.lat, coords.lng);
          const isSelected = selectedPropertyId === property.id;
          const minPrice = Math.min(...rooms.map(r => r.price));

          return (
            <div
              key={property.id}
              className="absolute z-20"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -100%)' }}
            >
              <button
                onClick={() => {
                  setSelectedPropertyId(isSelected ? null : property.id);
                  setSelectedRoomIdx(0);
                }}
                className={`flex flex-col items-center group transition-transform ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
              >
                <div className={`px-2.5 py-1.5 rounded-full shadow-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-primary text-white'
                    : 'bg-white text-foreground hover:bg-primary hover:text-white'
                }`}>
                  €{minPrice}+
                  {availableCount > 0 && (
                    <span className={`ml-1.5 px-1 py-0.5 rounded-full text-[9px] ${
                      isSelected ? 'bg-white/20' : 'bg-green-100 text-green-700 group-hover:bg-white/20 group-hover:text-white'
                    }`}>
                      {availableCount}
                    </span>
                  )}
                </div>
                <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${isSelected ? 'bg-primary' : 'bg-white border-2 border-primary'}`} />
              </button>

              {/* Mini card popup */}
              {isSelected && selectedRoom && selectedGroup && (
                <div
                  className="absolute z-30"
                  style={{ bottom: '120%', left: '50%', transform: 'translateX(-50%)' }}
                  onClick={e => e.stopPropagation()}
                >
                  <MiniRoomCard
                    room={selectedRoom}
                    property={selectedGroup.property}
                    onClose={() => setSelectedPropertyId(null)}
                  />
                  {selectedGroup.rooms.length > 1 && (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {selectedGroup.rooms.map((r, i) => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRoomIdx(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === selectedRoomIdx ? 'bg-primary' : 'bg-white/70 border border-border'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state overlay */}
        {groups.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 rounded-xl p-6 text-center shadow-lg max-w-xs">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">Sem resultados no mapa</p>
              <p className="text-xs text-muted-foreground">Ajusta os filtros para ver propriedades.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

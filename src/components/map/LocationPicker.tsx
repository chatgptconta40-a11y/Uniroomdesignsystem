import 'leaflet/dist/leaflet.css';
import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { ESTGV, type LatLng } from '../../utils/estgv';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

const DRAGGABLE_PIN = L.divIcon({
  className: '',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
  html: `
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10.777 14 24 14.95 24.938a1.5 1.5 0 0 0 2.1 0C18 39.938 32 26.777 32 16 32 7.163 24.837 0 16 0z"
        fill="#7c3aed" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="5" fill="white"/>
    </svg>`,
});

// Pans map to center on the marker when value changes from outside (e.g., geocode result)
function MapPanner({ coords }: { coords: LatLng | null }) {
  const map = useMap();
  const prev = useRef<LatLng | null>(null);

  useEffect(() => {
    if (!coords) return;
    if (prev.current?.lat === coords.lat && prev.current?.lng === coords.lng) return;
    prev.current = coords;
    map.panTo([coords.lat, coords.lng], { animate: true });
  }, [coords, map]);

  return null;
}

// Allows clicking the map to place/move the pin
function ClickHandler({ onChange }: { onChange: (c: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (coords: LatLng) => void;
  heightClass?: string;
}

export function LocationPicker({ value, onChange, heightClass = 'h-64' }: LocationPickerProps) {
  const center: [number, number] = value
    ? [value.lat, value.lng]
    : [ESTGV.lat, ESTGV.lng];

  return (
    <div className="space-y-2">
      <div className={`relative ${heightClass} w-full overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-muted`}>
        <MapContainer
          center={center}
          zoom={15}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
          zoomControl
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={DRAGGABLE_PIN}
              draggable
              eventHandlers={{
                dragend(e) {
                  const ll = (e.target as L.Marker).getLatLng();
                  onChange({ lat: ll.lat, lng: ll.lng });
                },
              }}
            />
          )}

          <MapPanner coords={value} />
          <ClickHandler onChange={onChange} />
        </MapContainer>

        {/* Overlay instruction when no pin placed */}
        {!value && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/10">
            <div className="rounded-xl bg-white/95 px-4 py-3 text-center shadow-lg backdrop-blur">
              <MapPin className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-sm font-bold text-foreground">Clica no mapa para marcar a localização</p>
              <p className="text-xs text-muted-foreground">Ou arrasta o pin depois de colocar</p>
            </div>
          </div>
        )}
      </div>

      {/* Status row */}
      {value ? (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-xs">
          <MapPin className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <span className="text-green-700 font-medium">
            Pin colocado — arrasta para ajustar a posição
          </span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground px-1">
          Clica no mapa para marcar a localização, ou usa o botão de pesquisa acima.
        </p>
      )}
    </div>
  );
}

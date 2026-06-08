import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ESTGV, type LatLng } from '../../utils/estgv';
import type { RouteResult } from '../../utils/openroute';

// Flies to property coords whenever focusTrigger increments.
function MapFocuser({ coords, trigger }: { coords: LatLng; trigger: number }) {
  const map = useMap();
  const prevTrigger = useRef(-1);
  useEffect(() => {
    if (trigger === 0 || trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;
    map.flyTo([coords.lat, coords.lng], Math.max(map.getZoom(), 15), { animate: true, duration: 0.8 });
  }, [trigger, coords.lat, coords.lng, map]);
  return null;
}

// Leaflet's default icon URLs break in Vite — we use DivIcon with inline SVG instead.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

const routeColors: Record<string, string> = {
  walking: '#3b82f6',
  driving: '#16a34a',
  cycling: '#f97316',
};

function makePin(color: string, dashed = false) {
  return L.divIcon({
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
    html: `
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 12.337 21.225 13.35 22.188a.93.93 0 0 0 1.3 0C15.663 35.225 28 23.625 28 14 28 6.268 21.732 0 14 0z"
          fill="${color}" ${dashed ? `stroke="#fff" stroke-width="2" stroke-dasharray="4 2"` : ''}/>
        <circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/>
      </svg>`,
  });
}

const ESTGV_PIN = L.divIcon({
  className: '',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
  html: `
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10.777 14 24 14.95 24.938a1.5 1.5 0 0 0 2.1 0C18 39.938 32 26.777 32 16 32 7.163 24.837 0 16 0z"
        fill="#f59e0b"/>
      <path d="M9 15l7-5 7 5v7H9v-7z" fill="white" opacity="0.9"/>
      <rect x="13" y="17" width="3" height="5" fill="#f59e0b"/>
      <path d="M16 10l-8 6h16l-8-6z" fill="white"/>
    </svg>`,
});

const APPROX_PIN = L.divIcon({
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
  html: `
    <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="20" fill="rgba(124,58,237,0.12)" stroke="#7c3aed" stroke-width="2" stroke-dasharray="5 3"/>
      <circle cx="22" cy="22" r="6" fill="#7c3aed" opacity="0.6"/>
    </svg>`,
});

// Adjusts map viewport to contain all given points with padding
function BoundsFitter({
  polyline,
  propertyCoords,
  fitTrigger = 0,
}: {
  polyline: [number, number][] | null;
  propertyCoords: LatLng;
  fitTrigger?: number;
}) {
  const map = useMap();
  const prevKeyRef = useRef<string>('');

  useEffect(() => {
    const key = polyline
      ? `route-${polyline.length}`
      : `pair-${propertyCoords.lat}-${propertyCoords.lng}-${fitTrigger}`;
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    const points: [number, number][] = polyline ?? [
      [propertyCoords.lat, propertyCoords.lng],
      [ESTGV.lat, ESTGV.lng],
    ];

    const bounds = L.latLngBounds(points);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
    }
  });

  return null;
}

interface PropertyRouteMapProps {
  coords: LatLng;
  isApproximate?: boolean;
  routeResult?: RouteResult | null;
  heightClass?: string;
  /** Increment this number to trigger an animated flyTo on the property pin. */
  focusTrigger?: number;
  /** When true, draw a dashed straight line between the property and ESTGV. */
  showEstimatedLine?: boolean;
  /** Increment this number to re-fit the map to property + ESTGV bounds. */
  fitTrigger?: number;
}

export function PropertyRouteMap({
  coords,
  isApproximate = false,
  routeResult,
  heightClass = 'h-52 lg:min-h-[180px] lg:h-full',
  focusTrigger = 0,
  showEstimatedLine = false,
  fitTrigger = 0,
}: PropertyRouteMapProps) {
  const center: [number, number] = [
    (coords.lat + ESTGV.lat) / 2,
    (coords.lng + ESTGV.lng) / 2,
  ];

  const propertyPin = isApproximate ? APPROX_PIN : makePin('#7c3aed');
  const routeColor = routeResult ? routeColors[routeResult.mode] ?? '#7c3aed' : '#7c3aed';

  return (
    <div className={`${heightClass} w-full overflow-hidden rounded-2xl border border-border bg-muted`}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Property marker */}
        <Marker position={[coords.lat, coords.lng]} icon={propertyPin} />

        {/* ESTGV destination marker */}
        <Marker position={[ESTGV.lat, ESTGV.lng]} icon={ESTGV_PIN} />

        {/* Route polyline when available */}
        {routeResult && (
          <Polyline
            positions={routeResult.polyline}
            pathOptions={{ color: routeColor, weight: 5, opacity: 0.85 }}
          />
        )}

        {/* Estimated (straight, dashed) line — only when no real route is drawn */}
        {!routeResult && showEstimatedLine && (
          <Polyline
            positions={[
              [coords.lat, coords.lng],
              [ESTGV.lat, ESTGV.lng],
            ]}
            pathOptions={{
              color: '#7c3aed',
              weight: 4,
              opacity: 0.85,
              dashArray: '8 6',
            }}
          />
        )}

        <BoundsFitter
          polyline={routeResult?.polyline ?? null}
          propertyCoords={coords}
          fitTrigger={fitTrigger}
        />
        <MapFocuser coords={coords} trigger={focusTrigger} />
      </MapContainer>
    </div>
  );
}

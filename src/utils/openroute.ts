import { ESTGV, type LatLng } from './estgv';

const ORS_BASE = 'https://api.heigit.org/openrouteservice';

/** True when VITE_ORS_API_KEY is present in the build environment. */
export const ORS_KEY_CONFIGURED = !!(import.meta.env.VITE_ORS_API_KEY as string | undefined);

export type ORSMode = 'walking' | 'driving' | 'cycling';

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  /** [lat, lng] pairs — already flipped from ORS's native [lng, lat] format */
  polyline: [number, number][];
  confidence: 'route';
  mode: ORSMode;
}

function orsProfile(mode: ORSMode): string {
  if (mode === 'walking') return 'foot-walking';
  if (mode === 'driving') return 'driving-car';
  return 'cycling-regular';
}

export async function getRouteToUniversity(
  origin: LatLng,
  mode: ORSMode,
  signal?: AbortSignal,
): Promise<RouteResult> {
  const apiKey = (import.meta.env.VITE_ORS_API_KEY ?? '') as string;
  if (!apiKey) throw new Error('VITE_ORS_API_KEY não está configurado');

  const profile = orsProfile(mode);
  const url =
    `${ORS_BASE}/v2/directions/${profile}` +
    `?api_key=${encodeURIComponent(apiKey)}` +
    `&start=${origin.lng},${origin.lat}` +
    `&end=${ESTGV.lng},${ESTGV.lat}`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ORS ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  const feature = json.features?.[0];
  if (!feature) throw new Error('ORS: sem features na resposta');

  const seg = feature.properties?.segments?.[0];
  if (!seg) throw new Error('ORS: sem segmentos na rota');

  // ORS coords are [lng, lat]; Leaflet expects [lat, lng]
  const polyline = (feature.geometry.coordinates as [number, number][]).map(
    ([lng, lat]) => [lat, lng] as [number, number],
  );

  return {
    distanceKm: seg.distance / 1000,
    durationMinutes: Math.round(seg.duration / 60),
    polyline,
    confidence: 'route',
    mode,
  };
}

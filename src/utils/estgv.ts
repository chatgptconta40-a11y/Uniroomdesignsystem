// ESTGV (Escola Superior de Tecnologia e Gestão de Viseu) – primary university
// destination for the UniRoom commute UX. Future work: replace heuristics with
// real route data (e.g. a future `route_to_university` / `transport_info` table).

export const ESTGV = {
  lat: 40.6577,
  lng: -7.9097,
  name: 'ESTGV — Instituto Politécnico de Viseu',
  shortName: 'ESTGV — IPV',
  city: 'Viseu',
} as const;

export type LatLng = { lat: number; lng: number };
export type LocationLevel = 'public' | 'approximate' | 'precise' | 'full';
export type TransportConfidence = 'route' | 'estimate' | 'unconfirmed';

export interface TransportMode {
  key: 'walk' | 'transit' | 'car' | 'bike';
  label: string;
  timeMinutes: number | null;
  distanceKm: number;
  confidence: TransportConfidence;
  confidenceLabel: string;
  text: string;
}

// Haversine distance in km between two lat/lng points.
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function confidenceLabel(c: TransportConfidence): string {
  if (c === 'route') return 'calculado por rota';
  if (c === 'estimate') return 'estimativa';
  return 'por confirmar';
}

// Heuristic transport-time estimates based on straight-line distance.
// All values are approximations — replace once we ingest real routing data.
export function transportEstimates(distanceKm: number): TransportMode[] {
  const walkMin = Math.round(distanceKm * 12);
  const bikeMin = Math.max(2, Math.round(distanceKm * 4));
  const carMin = Math.max(3, Math.round(distanceKm * 3 + 2));

  const modes: TransportMode[] = [];

  if (walkMin <= 60) {
    modes.push({
      key: 'walk',
      label: 'A pé',
      timeMinutes: walkMin,
      distanceKm,
      confidence: 'estimate',
      confidenceLabel: confidenceLabel('estimate'),
      text: `~${walkMin} min a pé`,
    });
  } else {
    modes.push({
      key: 'walk',
      label: 'A pé',
      timeMinutes: null,
      distanceKm,
      confidence: 'estimate',
      confidenceLabel: confidenceLabel('estimate'),
      text: 'Demasiado longe a pé',
    });
  }

  modes.push({
    key: 'transit',
    label: 'Transporte público',
    timeMinutes: null,
    distanceKm,
    confidence: 'unconfirmed',
    confidenceLabel: 'Horários por confirmar',
    text: 'Ver horários no Google Maps',
  });

  modes.push({
    key: 'car',
    label: 'Carro',
    timeMinutes: carMin,
    distanceKm,
    confidence: 'estimate',
    confidenceLabel: confidenceLabel('estimate'),
    text: `~${carMin} min de carro`,
  });

  modes.push({
    key: 'bike',
    label: 'Bicicleta',
    timeMinutes: bikeMin,
    distanceKm,
    confidence: 'estimate',
    confidenceLabel: confidenceLabel('estimate'),
    text: `~${bikeMin} min de bicicleta`,
  });

  return modes;
}

export function walkMinutesFromDistance(distanceKm: number): number {
  return Math.round(distanceKm * 12);
}

export function carMinutesFromDistance(distanceKm: number): number {
  return Math.max(3, Math.round(distanceKm * 3 + 2));
}

export interface MapsTargets {
  view: string;
  directions: string;
  route: string;
  embed: string;
}

export interface PropertyLike {
  address?: string;
  zone?: string;
  city?: string;
  coordinates?: LatLng;
}

// Returns google maps URLs respecting the visible location level.
// When level !== 'full', uses zone/city instead of street address.
export function googleMapsUrls(p: PropertyLike, level: LocationLevel): MapsTargets {
  const useFull = level === 'full';
  const labelParts = useFull
    ? [p.address, p.zone, p.city, 'Portugal']
    : [p.zone, p.city, 'Portugal'];
  const label = labelParts.filter(Boolean).join(', ');
  const labelQ = encodeURIComponent(label || 'Viseu, Portugal');

  // Origin: prefer coords for accuracy when allowed/available; otherwise the label query.
  const origin = useFull && p.coordinates
    ? `${p.coordinates.lat},${p.coordinates.lng}`
    : (p.coordinates && level !== 'public'
      ? `${p.coordinates.lat},${p.coordinates.lng}`
      : label);
  const originQ = encodeURIComponent(origin || label || 'Viseu');
  const destQ = `${ESTGV.lat},${ESTGV.lng}`;

  const view = `https://www.google.com/maps/search/?api=1&query=${labelQ}`;
  const directions = `https://www.google.com/maps/dir/?api=1&origin=${originQ}&destination=${destQ}&travelmode=walking`;
  const route = `https://www.google.com/maps?saddr=${originQ}&daddr=${destQ}&output=embed`;

  // Embed: when we have coords (and level allows precise position) use a route
  // embed so the line is drawn; otherwise fall back to a label search embed.
  const hasCoords = !!p.coordinates && level !== 'public';
  const embed = hasCoords
    ? `https://www.google.com/maps?saddr=${p.coordinates!.lat},${p.coordinates!.lng}&daddr=${destQ}&output=embed`
    : `https://www.google.com/maps?q=${labelQ}&output=embed`;

  return { view, directions, route, embed };
}

export interface CommuteContext {
  key: 'walkable' | 'transport' | 'check';
  label: string;
  tone: 'green' | 'amber' | 'orange';
}

export function commuteContext(walkMinutes: number): CommuteContext {
  if (walkMinutes <= 15) return { key: 'walkable', label: 'Bom para ir a pé', tone: 'green' };
  if (walkMinutes <= 35) return { key: 'transport', label: 'Precisa de transporte', tone: 'amber' };
  return { key: 'check', label: 'Confirmar horários antes da visita', tone: 'orange' };
}

// Stable pseudo-random small offset around real coordinates (~ up to ~400m).
// Used when the viewer should only see an approximate position.
export function approximateCoords(seed: string, real?: LatLng): LatLng | undefined {
  if (!real) return undefined;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const r1 = ((h >>> 0) % 1000) / 1000 - 0.5;
  const r2 = ((h >>> 16) % 1000) / 1000 - 0.5;
  return {
    lat: real.lat + r1 * 0.006, // ~ ±330m
    lng: real.lng + r2 * 0.006,
  };
}

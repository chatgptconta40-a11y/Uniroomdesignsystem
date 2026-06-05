import { useMemo, useRef, useCallback } from 'react';
import {
  GraduationCap,
  MapPin,
  Navigation,
  Footprints,
  Bus,
  Car,
  Bike,
  ExternalLink,
  Lock,
  Info,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { PropertyRouteMap } from './map/PropertyRouteMap';
import { useLocationAccess } from '../hooks/useLocationAccess';
import { useRoute, type TravelMode } from '../hooks/useRoute';
import { ORS_KEY_CONFIGURED } from '../utils/openroute';
import {
  ESTGV,
  commuteContext,
  googleMapsUrls,
  haversineKm,
  approximateCoords,
  walkMinutesFromDistance,
  type LatLng,
} from '../utils/estgv';

/** Rejects {lat:0,lng:0}, values out of range, and nullish inputs. */
function isValidCoords(c: { lat: number; lng: number } | undefined | null): c is { lat: number; lng: number } {
  if (!c) return false;
  if (c.lat === 0 && c.lng === 0) return false;
  if (c.lat < -90 || c.lat > 90) return false;
  if (c.lng < -180 || c.lng > 180) return false;
  return true;
}

export interface ESTGVPropertyLike {
  id: string;
  landlordId?: string;
  title?: string;
  address?: string;
  zone?: string;
  city?: string;
  distanceToUniversity?: number;
  coordinates?: { lat: number; lng: number };
  publicAddress?: boolean;
}

interface ESTGVRouteSectionProps {
  property: ESTGVPropertyLike;
  room?: { id: string; title?: string };
  mapHeightClass?: string;
}

// ─── Mode config ───────────────────────────────────────────────────────────────

interface ModeConfig {
  key: TravelMode;
  label: string;
  Icon: React.ElementType;
  routeColor: string;
}

const MODES: ModeConfig[] = [
  { key: 'walking', label: 'A pé', Icon: Footprints, routeColor: '#3b82f6' },
  { key: 'transit', label: 'Transporte público', Icon: Bus, routeColor: '' },
  { key: 'driving', label: 'Carro', Icon: Car, routeColor: '#16a34a' },
  { key: 'cycling', label: 'Bicicleta', Icon: Bike, routeColor: '#f97316' },
];

// ─── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ type }: { type: 'route' | 'estimate' | 'unconfirmed' }) {
  const styles =
    type === 'route'
      ? 'bg-green-50 text-green-700 border-green-200'
      : type === 'estimate'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-orange-50 text-orange-700 border-orange-200';
  const label =
    type === 'route' ? 'calculado por rota' : type === 'estimate' ? 'estimativa' : 'por confirmar';
  return (
    <span className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${styles}`}>
      <Info className="h-2.5 w-2.5 shrink-0" />
      {label}
    </span>
  );
}

// ─── Single transport card ─────────────────────────────────────────────────────

interface TransportCardProps {
  mode: ModeConfig;
  selected: boolean;
  distanceKm: number;
  routeResult: ReturnType<typeof useRoute>['routeResult'];
  routeLoading: boolean;
  routeError: string | null;
  isSelectedMode: boolean;
  transitUrl: string;
  onSelect: () => void;
}

function TransportCard({
  mode,
  selected,
  distanceKm,
  routeResult,
  routeLoading,
  routeError,
  isSelectedMode,
  transitUrl,
  onSelect,
}: TransportCardProps) {
  const { key, label, Icon } = mode;
  const isTransit = key === 'transit';

  // Only show ORS result when a real route was actually calculated
  const showRoute = isSelectedMode && !isTransit && !!routeResult && ORS_KEY_CONFIGURED;
  const showLoading = isSelectedMode && !isTransit && routeLoading && ORS_KEY_CONFIGURED;
  const showError = isSelectedMode && !isTransit && !!routeError && ORS_KEY_CONFIGURED;

  // Heuristic fallback times (km-based estimates)
  const fallbackMin =
    key === 'walking'
      ? Math.round(distanceKm * 12)
      : key === 'driving'
        ? Math.max(3, Math.round(distanceKm * 3 + 2))
        : Math.max(2, Math.round(distanceKm * 4));

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
        selected
          ? 'border-primary/50 bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30'
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
            selected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <p className="text-xs font-bold text-foreground leading-tight">{label}</p>
            {isTransit ? (
              <ConfidenceBadge type="unconfirmed" />
            ) : showRoute ? (
              <ConfidenceBadge type="route" />
            ) : (
              <ConfidenceBadge type="estimate" />
            )}
          </div>

          {isTransit ? (
            <div className="mt-0.5 space-y-0.5">
              <p className="text-[11px] text-muted-foreground leading-tight">Horários por confirmar</p>
              <a
                href={transitUrl}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline"
              >
                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                Ver no Google Maps
              </a>
            </div>
          ) : showLoading ? (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              A calcular…
            </p>
          ) : showError ? (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-red-500">
              <AlertCircle className="h-2.5 w-2.5 shrink-0" />
              Percurso indisponível
            </p>
          ) : showRoute ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
              <span className="font-semibold text-foreground">~{routeResult!.durationMinutes} min</span>
              {' · '}{routeResult!.distanceKm.toFixed(1)} km
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
              <span className="font-semibold text-foreground">~{fallbackMin} min</span>
              {' · '}{distanceKm.toFixed(1)} km
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Main section ──────────────────────────────────────────────────────────────

export function ESTGVRouteSection({ property, room }: ESTGVRouteSectionProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const access = useLocationAccess({
    id: property.id,
    landlordId: property.landlordId,
    publicAddress: property.publicAddress,
  });

  const hasCoords = isValidCoords(property.coordinates);

  const distanceKm = useMemo(() => {
    if (hasCoords) {
      return haversineKm(property.coordinates!, { lat: ESTGV.lat, lng: ESTGV.lng });
    }
    return property.distanceToUniversity ?? 0;
  }, [hasCoords, property.coordinates, property.distanceToUniversity]);

  // Coordinates to render on the map, respecting the access/privacy level
  const mapCoords = useMemo((): LatLng | null => {
    if (!hasCoords) return null;
    if (access.showFullAddress) return property.coordinates!;
    // Approximate: stable small offset so the pin doesn't reveal the exact address
    return approximateCoords(property.id, property.coordinates!) ?? property.coordinates!;
  }, [hasCoords, property.coordinates, property.id, access.showFullAddress]);

  const isApproximate = !!mapCoords && !access.showFullAddress;

  // ORS routes: key + any valid coords (mapCoords already applies privacy masking).
  // We do NOT require showFullAddress — routing from approximate coords is safe
  // because it doesn't reveal the exact address beyond what the pin already shows.
  const orsOrigin = ORS_KEY_CONFIGURED && mapCoords ? mapCoords : null;

  const { selectedMode, routeResult, routeLoading, routeError, setMode } = useRoute(orsOrigin);

  const walkMin = walkMinutesFromDistance(distanceKm);
  const context = room ? commuteContext(walkMin) : null;

  const urls = useMemo(
    () =>
      googleMapsUrls(
        {
          address: property.address,
          zone: property.zone,
          city: property.city,
          coordinates: property.coordinates,
        },
        access.level,
      ),
    [property.address, property.zone, property.city, property.coordinates, access.level],
  );

  const showFull = access.showFullAddress;
  const displayLabel = showFull && property.address
    ? property.address
    : [property.zone, property.city].filter(Boolean).join(', ');

  const contextTone =
    context?.tone === 'green'
      ? 'bg-green-50 text-green-700 border-green-200'
      : context?.tone === 'amber'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-orange-50 text-orange-700 border-orange-200';

  // Route to show on the map (only for non-transit modes)
  const mapRoute = selectedMode !== 'transit' ? routeResult : null;

  // Clicking "Ver percurso" scrolls to the Leaflet map and ensures a routable
  // mode is active. Falls back to opening Google Maps when ORS is not configured.
  const handleVerPercurso = useCallback(() => {
    if (ORS_KEY_CONFIGURED && mapCoords) {
      if (selectedMode === 'transit') setMode('walking');
      mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.open(urls.directions, '_blank', 'noreferrer');
    }
  }, [mapCoords, selectedMode, setMode, urls.directions]);

  return (
    <section className="space-y-4 min-w-0 overflow-hidden">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground">Localização e percurso até à ESTGV</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Quanto demoras desde {showFull ? 'a casa' : 'a zona'} até à universidade.
          </p>
        </div>
        {context && (
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${contextTone}`}>
            <Navigation className="h-3.5 w-3.5" />
            {context.label}
          </span>
        )}
      </header>

      {/* ORS notice — shown once, unobtrusively, only when key is missing */}
      {!ORS_KEY_CONFIGURED && hasCoords && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            Configure <code className="font-mono font-semibold">VITE_ORS_API_KEY</code> para rotas reais.
            Os tempos abaixo são estimativas.
          </span>
        </div>
      )}

      {/* Map + destination summary side-by-side on lg */}
      <div ref={mapContainerRef} className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
        {mapCoords ? (
          <PropertyRouteMap
            coords={mapCoords}
            isApproximate={isApproximate}
            routeResult={mapRoute}
            heightClass="h-52 lg:h-full lg:min-h-[200px]"
          />
        ) : (
          <div className="h-52 lg:h-full lg:min-h-[200px] rounded-2xl border border-border bg-muted flex items-center justify-center">
            <div className="text-center px-4">
              <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Localização não disponível</p>
            </div>
          </div>
        )}

        {/* Destination summary — stacked vertically */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Destino</p>
              <p className="truncate text-sm font-bold text-foreground">{ESTGV.shortName}</p>
              <p className="text-xs text-muted-foreground">{ESTGV.city}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
              {showFull ? <MapPin className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {room ? 'Quarto' : 'Casa'}
              </p>
              <p className="truncate text-sm font-bold text-foreground">{displayLabel || 'Viseu'}</p>
              <p className="text-xs text-muted-foreground">
                {distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : '—'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Transport mode cards */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {MODES.map(mode => (
          <TransportCard
            key={mode.key}
            mode={mode}
            selected={selectedMode === mode.key}
            distanceKm={distanceKm}
            routeResult={routeResult}
            routeLoading={routeLoading}
            routeError={routeError}
            isSelectedMode={selectedMode === mode.key}
            transitUrl={urls.directions}
            onSelect={() => setMode(mode.key)}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <a
          href={urls.view}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Abrir no mapa
        </a>
        <a
          href={urls.directions}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
        >
          <Navigation className="h-4 w-4 shrink-0" />
          Obter direções
        </a>
        <button
          type="button"
          onClick={handleVerPercurso}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90 sm:col-span-2 lg:col-span-1"
        >
          <GraduationCap className="h-4 w-4 shrink-0" />
          Ver percurso até à ESTGV
        </button>
      </div>

      {/* Approximate location notice */}
      {isApproximate && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            A localização exata está protegida. O pin no mapa é aproximado.
            {access.notice ? ` ${access.notice}` : ''}
          </span>
        </div>
      )}

      {/* Privacy notice from access hook */}
      {!isApproximate && access.notice && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{access.notice}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground italic">
        Os tempos podem variar conforme trânsito, horários e ritmo a pé.
      </p>
    </section>
  );
}

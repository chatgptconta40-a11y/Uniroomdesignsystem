import { useMemo, useRef, useCallback, useState } from 'react';
import {
  GraduationCap,
  MapPin,
  Navigation,
  Footprints,
  Bus,
  Car,
  Bike,
  ExternalLink,
  Info,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { PropertyRouteMap } from './map/PropertyRouteMap';
import { useRoute, type TravelMode } from '../hooks/useRoute';
import {
  ESTGV,
  commuteContext,
  googleMapsUrls,
  haversineKm,
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
  const showRoute = isSelectedMode && !isTransit && !!routeResult;
  const showLoading = isSelectedMode && !isTransit && routeLoading;
  const showError = isSelectedMode && !isTransit && !!routeError;

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

  const hasCoords = isValidCoords(property.coordinates);

  const distanceKm = useMemo(() => {
    if (hasCoords) {
      return haversineKm(property.coordinates!, { lat: ESTGV.lat, lng: ESTGV.lng });
    }
    return property.distanceToUniversity ?? 0;
  }, [hasCoords, property.coordinates, property.distanceToUniversity]);

  // Map always uses the real property coordinates
  const mapCoords = useMemo((): LatLng | null => {
    if (!hasCoords) return null;
    return property.coordinates!;
  }, [hasCoords, property.coordinates]);

  const { selectedMode, routeResult, routeLoading, routeError, setMode } = useRoute(mapCoords);

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
        'full',
      ),
    [property.address, property.zone, property.city, property.coordinates],
  );

  const displayLabel = property.address
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

  // focusTrigger: incrementing causes PropertyRouteMap to flyTo the property pin.
  const [focusTrigger, setFocusTrigger] = useState(0);
  // fitTrigger: incrementing causes PropertyRouteMap to fit property + ESTGV bounds.
  const [fitTrigger, setFitTrigger] = useState(0);
  // Whether the dashed estimated line between property and ESTGV is shown.
  const [showEstimatedLine, setShowEstimatedLine] = useState(false);
  // Brief inline notice when coords are missing.
  const [noCoordNotice, setNoCoordNotice] = useState(false);

  function showNoticeFor(setter: (v: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 3500);
  }

  // "Centrar no mapa": centers the internal Leaflet map on the property pin.
  const handleAbrirNoMapa = useCallback(() => {
    if (!mapCoords) {
      showNoticeFor(setNoCoordNotice);
      return;
    }
    mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFocusTrigger(n => n + 1);
  }, [mapCoords]);

  // "Ver percurso no mapa": reveal dashed line and fit both pins inside the Leaflet map.
  const handleVerPercurso = useCallback(() => {
    if (!mapCoords) {
      showNoticeFor(setNoCoordNotice);
      return;
    }
    mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setShowEstimatedLine(true);
    setFitTrigger(n => n + 1);
  }, [mapCoords]);


  return (
    <section className="space-y-4 min-w-0 overflow-hidden">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground">Localização e percurso até à ESTGV</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Os tempos são estimativas. Confirma o percurso real antes da visita.
          </p>
        </div>
        {context && (
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${contextTone}`}>
            <Navigation className="h-3.5 w-3.5" />
            {context.label}
          </span>
        )}
      </header>

      {/* Map + destination summary side-by-side on lg */}
      <div ref={mapContainerRef} className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
        {mapCoords ? (
          <PropertyRouteMap
            coords={mapCoords}
            isApproximate={false}
            routeResult={mapRoute}
            heightClass="h-52 lg:h-full lg:min-h-[200px]"
            focusTrigger={focusTrigger}
            fitTrigger={fitTrigger}
            showEstimatedLine={showEstimatedLine}
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
              <MapPin className="h-4 w-4" />
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

      {/* Inline notices for edge cases */}
      {noCoordNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-muted bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          Localização ainda não disponível para esta propriedade.
        </div>
      )}
      {/* Action buttons */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* Primary CTA: draws estimated line inside the internal Leaflet map */}
        <button
          type="button"
          onClick={handleVerPercurso}
          disabled={!mapCoords}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Navigation className="h-4 w-4 shrink-0" />
          Ver percurso no mapa
        </button>

        {/* Focuses the internal Leaflet map on the property pin */}
        <button
          type="button"
          onClick={handleAbrirNoMapa}
          disabled={!mapCoords}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MapPin className="h-4 w-4 shrink-0" />
          Centrar no mapa
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground italic">
          Ligação visual estimada. Confirma o percurso real antes da visita.
        </p>
        {/* Discreet external fallback */}
        <a
          href={urls.directions}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          Confirmar externamente
        </a>
      </div>
    </section>
  );
}

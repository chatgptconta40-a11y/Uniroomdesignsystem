import { useState, useEffect, useCallback, useRef } from 'react';
import { getRouteToUniversity, ORS_KEY_CONFIGURED, type RouteResult, type ORSMode } from '../utils/openroute';
import type { LatLng } from '../utils/estgv';

export type TravelMode = 'walking' | 'driving' | 'cycling' | 'transit';

export interface RouteState {
  selectedMode: TravelMode;
  routeResult: RouteResult | null;
  routeLoading: boolean;
  routeError: string | null;
  setMode: (m: TravelMode) => void;
}

/**
 * Fetches a real route from OpenRouteService when:
 *   - VITE_ORS_API_KEY is configured
 *   - origin is a valid LatLng (not null / {0,0})
 *   - mode is not 'transit'
 *
 * Otherwise returns idle state (null result, no loading, no error) so the
 * component can fall back to heuristic estimates without showing an error.
 */
export function useRoute(origin: LatLng | undefined | null): RouteState {
  const [selectedMode, setSelectedMode] = useState<TravelMode>('walking');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRoute = useCallback(async (mode: TravelMode, coords: LatLng) => {
    // Transit has no ORS route — always idle
    if (mode === 'transit') {
      abortRef.current?.abort();
      setRouteResult(null);
      setRouteError(null);
      setRouteLoading(false);
      return;
    }

    // No API key — show heuristics silently, never attempt the call
    if (!ORS_KEY_CONFIGURED) {
      abortRef.current?.abort();
      setRouteResult(null);
      setRouteError(null);
      setRouteLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setRouteLoading(true);
    setRouteError(null);
    setRouteResult(null);

    try {
      const result = await getRouteToUniversity(coords, mode as ORSMode, ctrl.signal);
      if (!ctrl.signal.aborted) {
        setRouteResult(result);
        setRouteLoading(false);
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        console.warn('[useRoute]', err);
        setRouteError('Não foi possível calcular o percurso');
        setRouteLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!origin) {
      // Clear any stale state when coordinates become unavailable
      abortRef.current?.abort();
      setRouteResult(null);
      setRouteError(null);
      setRouteLoading(false);
      return;
    }
    fetchRoute(selectedMode, origin);
    return () => { abortRef.current?.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode, origin?.lat, origin?.lng, fetchRoute]);

  const setMode = useCallback((mode: TravelMode) => {
    setSelectedMode(mode);
  }, []);

  return { selectedMode, routeResult, routeLoading, routeError, setMode };
}

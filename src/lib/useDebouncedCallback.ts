import { useEffect, useMemo, useRef } from 'react';

/**
 * Returns a stable debounced wrapper around `fn`. Multiple calls within
 * `delay` ms collapse into a single trailing invocation.
 *
 * Used to coalesce bursts of Realtime events into one `refresh()` call when a
 * hook depends on joins/enrichment and can't cheaply upsert a single row from
 * the payload. The pending timer is always cleared on unmount.
 */
export function useDebouncedCallback(fn: () => void, delay = 500): () => void {
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; }, [fn]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debounced = useMemo(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { fnRef.current(); }, delay);
    },
    [delay],
  );

  useEffect(
    () => () => { if (timerRef.current) clearTimeout(timerRef.current); },
    [],
  );

  return debounced;
}

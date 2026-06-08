import type { LocationLevel } from '../utils/estgv';

export interface LocationAccessTarget {
  id?: string;
  landlordId?: string;
  publicAddress?: boolean;
}

export interface LocationAccess {
  level: LocationLevel;
  showFullAddress: boolean;
  notice: string | null;
}

/**
 * Location address is always public for students browsing listings:
 * full address and real coordinates are shown before applying.
 */
export function useLocationAccess(_target?: LocationAccessTarget | null): LocationAccess {
  return { level: 'full', showFullAddress: true, notice: null };
}

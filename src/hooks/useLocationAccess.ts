import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApplications } from './useDb';
import { useVisitRequests } from './useVisitRequests';
import type { LocationLevel } from '../utils/estgv';

export interface LocationAccessTarget {
  id?: string;
  landlordId?: string;
  // Optional future flag — when true, full address is always public.
  publicAddress?: boolean;
}

export interface LocationAccess {
  level: LocationLevel;
  showFullAddress: boolean;
  notice: string | null;
}

/**
 * Resolve the level of location detail that should be exposed for a property/room.
 *
 * Rules (see maps UX spec):
 *  - Landlord (owner) or admin → full
 *  - publicAddress flag → full
 *  - Anonymous → approximate, notice about authentication
 *  - Authenticated student with no application/visit → approximate
 *  - Application pending/under_review → precise
 *  - Application accepted/confirmed OR visit accepted/scheduled/completed → full
 */
export function useLocationAccess(target: LocationAccessTarget | null | undefined): LocationAccess {
  const { user } = useAuth();
  const { applications } = useApplications({ scope: 'student' });
  const { visitRequests } = useVisitRequests();

  return useMemo<LocationAccess>(() => {
    // Public flag bypass (future-proofing).
    if (target?.publicAddress) {
      return { level: 'full', showFullAddress: true, notice: null };
    }

    // Admin sees everything.
    if (user?.type === 'admin') {
      return { level: 'full', showFullAddress: true, notice: null };
    }

    // Landlord owner sees full info.
    if (user && target?.landlordId && user.id === target.landlordId) {
      return { level: 'full', showFullAddress: true, notice: null };
    }

    // Anonymous viewer.
    if (!user) {
      return {
        level: 'approximate',
        showFullAddress: false,
        notice: 'Morada completa disponível após autenticação e candidatura.',
      };
    }

    // For students, check applications/visits tied to this property/room.
    const propertyId = target?.id;
    if (user.type === 'student' && propertyId) {
      const relatedApps = (applications ?? []).filter(
        a => a.propertyId === propertyId || a.accommodationId === propertyId || a.roomId === propertyId,
      );
      const relatedVisits = (visitRequests ?? []).filter(
        v => v.propertyId === propertyId || v.roomId === propertyId,
      );

      const hasFullAccess =
        relatedApps.some(a => a.status === 'accepted' || a.status === 'confirmed') ||
        relatedVisits.some(v => v.status === 'accepted' || v.status === 'completed');

      if (hasFullAccess) {
        return { level: 'full', showFullAddress: true, notice: null };
      }

      const hasPreciseAccess =
        relatedApps.some(a => a.status === 'pending' || a.status === 'under_review') ||
        relatedVisits.some(v => v.status === 'pending' || v.status === 'counter_proposed');

      if (hasPreciseAccess) {
        return {
          level: 'precise',
          showFullAddress: false,
          notice:
            'Localização aproximada. Morada completa quando a candidatura for aceite ou a visita confirmada.',
        };
      }
    }

    // Authenticated but without any application/visit relationship.
    return {
      level: 'approximate',
      showFullAddress: false,
      notice:
        'Mostramos zona aproximada. Morada completa após candidatura aceite ou visita marcada.',
    };
  }, [user, target?.id, target?.landlordId, target?.publicAddress, applications, visitRequests]);
}

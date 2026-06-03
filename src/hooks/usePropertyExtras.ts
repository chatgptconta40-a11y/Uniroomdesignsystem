import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface RoommateBasic {
  id: string;
  name: string;
  course: string;
  institution: string;
  avatarUrl: string | undefined;
}

export interface PropertyHouseRules {
  smokingAllowed: boolean;
  petsAllowed: boolean;
  partiesAllowed: boolean;
  studentsOnly: boolean;
  quietHours: string | undefined;
  cleaningPolicy: string | undefined;
  visitorsPolicy: string | undefined;
  preferredGender: 'any' | 'male' | 'female' | undefined;
}

interface PropertyExtras {
  roommates: RoommateBasic[];
  houseRules: PropertyHouseRules | null;
  loading: boolean;
}

export function usePropertyExtras(propertyId: string | undefined): PropertyExtras {
  const [roommates, setRoommates] = useState<RoommateBasic[]>([]);
  const [houseRules, setHouseRules] = useState<PropertyHouseRules | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!propertyId) {
      setRoommates([]);
      setHouseRules(null);
      return;
    }
    setLoading(true);
    try {
      const [homesRes, propRes] = await Promise.all([
        supabase
          .from('active_homes')
          .select('id, student_id')
          .eq('property_id', propertyId),
        supabase
          .from('properties')
          .select('house_rules')
          .eq('id', propertyId)
          .maybeSingle(),
      ]);

      // House rules
      const rawRules = propRes.data?.house_rules;
      if (rawRules && typeof rawRules === 'object') {
        setHouseRules({
          smokingAllowed: !!rawRules.smoking,
          petsAllowed: !!rawRules.pets,
          partiesAllowed: !!rawRules.parties,
          studentsOnly: !!rawRules.studentsOnly,
          quietHours: rawRules.quietHours ?? undefined,
          cleaningPolicy: rawRules.cleaningPolicy ?? undefined,
          visitorsPolicy: rawRules.visitorsPolicy ?? undefined,
          preferredGender: rawRules.preferredGender ?? undefined,
        });
      } else {
        setHouseRules(null);
      }

      // Roommates
      const homes = homesRes.data ?? [];
      if (homes.length === 0) {
        setRoommates([]);
        setLoading(false);
        return;
      }

      const studentIds = homes.map(h => h.student_id).filter(Boolean);
      const [profilesRes, personalRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', studentIds),
        supabase
          .from('personal_profiles')
          .select('user_id, course, institution')
          .in('user_id', studentIds),
      ]);

      const profileMap = new Map(
        (profilesRes.data ?? []).map(p => [p.id, p]),
      );
      const personalMap = new Map(
        (personalRes.data ?? []).map(p => [p.user_id, p]),
      );

      setRoommates(
        homes.map(h => {
          const profile = profileMap.get(h.student_id);
          const personal = personalMap.get(h.student_id);
          return {
            id: h.id,
            name: profile?.full_name ?? 'Estudante',
            course: personal?.course ?? '',
            institution: personal?.institution ?? '',
            avatarUrl: profile?.avatar_url ?? undefined,
          };
        }),
      );
    } catch (err) {
      console.error('[usePropertyExtras]', err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { roommates, houseRules, loading };
}

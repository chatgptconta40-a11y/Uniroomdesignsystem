import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ProfileSummary {
  id: string;
  name: string;
  avatarUrl: string | undefined;
  type: string | undefined;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) { setProfile(null); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, type')
      .eq('id', userId)
      .maybeSingle();
    setLoading(false);
    if (error) { console.error('[useProfile]', error.message); return; }
    if (data) {
      setProfile({
        id: data.id,
        name: data.full_name ?? 'Utilizador',
        avatarUrl: data.avatar_url ?? undefined,
        type: data.type ?? undefined,
      });
    } else {
      setProfile(null);
    }
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { profile, loading, refresh };
}

// Fetches a batch of profile names keyed by user ID.
export function useProfileNames(userIds: string[]) {
  const [names, setNames] = useState<Map<string, string>>(new Map());

  const key = useMemo(() => userIds.slice().sort().join(','), [userIds]);

  useEffect(() => {
    if (userIds.length === 0) { setNames(new Map()); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      if (cancelled) return;
      if (error) { console.error('[useProfileNames]', error.message); return; }
      const map = new Map<string, string>();
      (data ?? []).forEach(p => { if (p.full_name) map.set(p.id, p.full_name); });
      setNames(map);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return names;
}

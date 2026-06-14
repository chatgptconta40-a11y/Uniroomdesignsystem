import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UserRestrictions {
  isSuspended: boolean;
  isBlocked: boolean;
  isBlockedFromPublishing: boolean;
  reason: string | undefined;
  status: string;
  verificationRequired: boolean;
  verified: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DEFAULTS = {
  isSuspended: false,
  isBlocked: false,
  isBlockedFromPublishing: false,
  reason: undefined as string | undefined,
  status: 'active',
  verificationRequired: false,
  verified: false,
};

function rowToRestrictions(row: any) {
  const isSuspended = row.status === 'suspended';
  const isBlocked = row.status === 'blocked';
  const isBlockedFromPublishing = isBlocked || !!row.blocked_from_publishing;
  return {
    isSuspended,
    isBlocked,
    isBlockedFromPublishing,
    reason: row.admin_reason ?? undefined,
    status: row.status ?? 'active',
    verificationRequired: !!row.verification_required,
    verified: !!row.verified,
  };
}

export function useUserRestrictions(userId: string | undefined): UserRestrictions {
  const [data, setData] = useState({ ...DEFAULTS });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) { setData({ ...DEFAULTS }); return; }
    setLoading(true);
    const { data: row, error } = await supabase
      .from('profiles')
      .select('id, status, blocked_from_publishing, admin_reason, verification_required, verified, type')
      .eq('id', userId)
      .maybeSingle();
    setLoading(false);
    if (error) { console.error('[useUserRestrictions]', error.message); return; }
    setData(row ? rowToRestrictions(row) : { ...DEFAULTS });
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { ...data, loading, refresh };
}

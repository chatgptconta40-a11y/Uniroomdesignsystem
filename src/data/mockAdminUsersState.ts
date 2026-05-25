// Admin-controlled user state — backed by Supabase profiles table.
// Keeps the original synchronous API via an in-memory cache that hydrates
// on first import. Writes update the cache immediately and persist async to DB.

import { supabase } from '../lib/supabase';

export interface AdminUserState {
  userId: string;
  suspended: boolean;
  blockedFromPublishing: boolean;
  verificationRequired: boolean;
  reason?: string;
  updatedAt: string;
}

const cache = new Map<string, AdminUserState>();
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function rowToState(row: any): AdminUserState {
  return {
    userId: row.id,
    suspended: row.status === 'suspended',
    blockedFromPublishing: !!row.blocked_from_publishing,
    verificationRequired: !!row.verification_required,
    reason: row.admin_reason ?? undefined,
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    // Try full schema first; fall back if extra columns aren't present yet.
    let { data, error } = await supabase
      .from('profiles')
      .select('id, status, blocked_from_publishing, verification_required, admin_reason, updated_at');
    if (error) {
      const fallback = await supabase.from('profiles').select('id, status, updated_at');
      if (fallback.error) { console.error('AdminUsersState hydrate error:', fallback.error.message); return; }
      data = fallback.data;
    }
    cache.clear();
    (data ?? []).forEach(r => cache.set(r.id, rowToState(r)));
    hydrated = true;
  })();
  return hydratePromise;
}

// Kick off hydration on module load
void hydrate();

function ensureCached(userId: string): AdminUserState {
  const existing = cache.get(userId);
  if (existing) return existing;
  const fresh: AdminUserState = {
    userId,
    suspended: false,
    blockedFromPublishing: false,
    verificationRequired: false,
    updatedAt: new Date().toISOString(),
  };
  cache.set(userId, fresh);
  return fresh;
}

async function persist(userId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (!error) return;
  // Retry without optional columns if schema hasn't been migrated yet.
  const safe: Record<string, unknown> = {};
  if ('status' in patch) safe.status = patch.status;
  if (Object.keys(safe).length === 0) {
    console.error('AdminUsersState persist error:', error.message);
    return;
  }
  const retry = await supabase.from('profiles').update(safe).eq('id', userId);
  if (retry.error) console.error('AdminUsersState persist error:', retry.error.message);
}

// ─── Read helpers (sync, from cache) ──────────────────────────────────────────

export function getUserState(userId: string): AdminUserState | null {
  return cache.get(userId) ?? null;
}

export function getAllUserStates(): AdminUserState[] {
  return Array.from(cache.values());
}

export function isUserSuspended(userId: string): boolean {
  return cache.get(userId)?.suspended ?? false;
}

export function isUserBlockedFromPublishing(userId: string): boolean {
  return cache.get(userId)?.blockedFromPublishing ?? false;
}

export function isVerificationRequired(userId: string): boolean {
  return cache.get(userId)?.verificationRequired ?? false;
}

// ─── Write helpers (sync cache + async DB write) ──────────────────────────────

export function setUserSuspended(userId: string, suspended: boolean, reason?: string): AdminUserState {
  const state = ensureCached(userId);
  const next: AdminUserState = {
    ...state,
    suspended,
    reason: reason ?? state.reason,
    updatedAt: new Date().toISOString(),
  };
  cache.set(userId, next);
  const dbStatus = suspended ? 'suspended' : (next.blockedFromPublishing ? 'blocked' : 'active');
  persist(userId, { status: dbStatus, admin_reason: next.reason ?? null });
  return next;
}

export function setUserBlockedFromPublishing(userId: string, blocked: boolean, reason?: string): AdminUserState {
  const state = ensureCached(userId);
  const next: AdminUserState = {
    ...state,
    blockedFromPublishing: blocked,
    reason: reason ?? state.reason,
    updatedAt: new Date().toISOString(),
  };
  cache.set(userId, next);
  const dbStatus = next.suspended ? 'suspended' : (blocked ? 'blocked' : 'active');
  persist(userId, { status: dbStatus, blocked_from_publishing: blocked, admin_reason: next.reason ?? null });
  return next;
}

export function setVerificationRequired(userId: string, required: boolean): AdminUserState {
  const state = ensureCached(userId);
  const next: AdminUserState = {
    ...state,
    verificationRequired: required,
    updatedAt: new Date().toISOString(),
  };
  cache.set(userId, next);
  persist(userId, { verification_required: required });
  return next;
}

// ─── Granular lift functions ──────────────────────────────────────────────────

export function liftUserSuspension(userId: string): AdminUserState {
  return setUserSuspended(userId, false);
}

export function unblockUserPublishing(userId: string): AdminUserState {
  return setUserBlockedFromPublishing(userId, false);
}

export function clearVerificationRequirement(userId: string): AdminUserState {
  return setVerificationRequired(userId, false);
}

// ─── Full reset ───────────────────────────────────────────────────────────────

export function clearUserRestrictions(userId: string): AdminUserState {
  const next: AdminUserState = {
    userId,
    suspended: false,
    blockedFromPublishing: false,
    verificationRequired: false,
    updatedAt: new Date().toISOString(),
  };
  cache.set(userId, next);
  persist(userId, {
    status: 'active',
    blocked_from_publishing: false,
    verification_required: false,
    admin_reason: null,
  });
  return next;
}

export async function refreshAdminUsersState(): Promise<void> {
  hydrated = false;
  hydratePromise = null;
  await hydrate();
}

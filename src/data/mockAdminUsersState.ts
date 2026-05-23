// Admin-controlled user state — suspension, blocking, verification flags.
// Persisted in localStorage, structured for future Supabase migration.
// Each flag is independent: suspension ≠ blocking ≠ verification requirement.

export interface AdminUserState {
  userId: string;
  suspended: boolean;
  blockedFromPublishing: boolean;
  verificationRequired: boolean;
  reason?: string;
  updatedAt: string; // ISO date string
}

const STORAGE_KEY = 'uniroom_admin_users_state';
const DATA_VERSION_KEY = 'uniroom_admin_users_state_version';
const CURRENT_VERSION = '2026-05-v2';

const INITIAL_STATE: AdminUserState[] = [];

function initStorage(): AdminUserState[] {
  const version = localStorage.getItem(DATA_VERSION_KEY);
  if (version !== CURRENT_VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
    return INITIAL_STATE;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
    return INITIAL_STATE;
  }
  try {
    return JSON.parse(stored) as AdminUserState[];
  } catch {
    return INITIAL_STATE;
  }
}

function saveAll(states: AdminUserState[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

function getOrCreate(userId: string): { all: AdminUserState[]; state: AdminUserState; idx: number } {
  const all = initStorage();
  const idx = all.findIndex(s => s.userId === userId);
  if (idx >= 0) return { all, state: all[idx], idx };
  const newState: AdminUserState = {
    userId,
    suspended: false,
    blockedFromPublishing: false,
    verificationRequired: false,
    updatedAt: new Date().toISOString(),
  };
  all.push(newState);
  return { all, state: newState, idx: all.length - 1 };
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

export function getUserState(userId: string): AdminUserState | null {
  const all = initStorage();
  return all.find(s => s.userId === userId) ?? null;
}

export function getAllUserStates(): AdminUserState[] {
  return initStorage();
}

export function isUserSuspended(userId: string): boolean {
  return getUserState(userId)?.suspended ?? false;
}

export function isUserBlockedFromPublishing(userId: string): boolean {
  return getUserState(userId)?.blockedFromPublishing ?? false;
}

export function isVerificationRequired(userId: string): boolean {
  return getUserState(userId)?.verificationRequired ?? false;
}

// ─── Write helpers (each touches only its own flag) ───────────────────────────

/** Suspends or unsuspends the account. Does NOT affect blockedFromPublishing. */
export function setUserSuspended(userId: string, suspended: boolean, reason?: string): AdminUserState {
  const { all, state, idx } = getOrCreate(userId);
  all[idx] = {
    ...state,
    suspended,
    reason: reason ?? state.reason,
    updatedAt: new Date().toISOString(),
  };
  saveAll(all);
  return all[idx];
}

/** Blocks or unblocks publishing. Does NOT affect suspended. */
export function setUserBlockedFromPublishing(userId: string, blocked: boolean, reason?: string): AdminUserState {
  const { all, state, idx } = getOrCreate(userId);
  all[idx] = {
    ...state,
    blockedFromPublishing: blocked,
    reason: reason ?? state.reason,
    updatedAt: new Date().toISOString(),
  };
  saveAll(all);
  return all[idx];
}

/** Sets or clears the verification requirement flag only. */
export function setVerificationRequired(userId: string, required: boolean): AdminUserState {
  const { all, state, idx } = getOrCreate(userId);
  all[idx] = { ...state, verificationRequired: required, updatedAt: new Date().toISOString() };
  saveAll(all);
  return all[idx];
}

// ─── Granular lift functions ──────────────────────────────────────────────────

/** Lifts account suspension only. blockedFromPublishing remains unchanged. */
export function liftUserSuspension(userId: string): AdminUserState {
  return setUserSuspended(userId, false);
}

/** Removes publishing block only. suspended remains unchanged. */
export function unblockUserPublishing(userId: string): AdminUserState {
  return setUserBlockedFromPublishing(userId, false);
}

/** Clears verification requirement only. Suspension and block remain unchanged. */
export function clearVerificationRequirement(userId: string): AdminUserState {
  return setVerificationRequired(userId, false);
}

// ─── Full reset (wipes all restrictions at once) ──────────────────────────────

export function clearUserRestrictions(userId: string): AdminUserState {
  const { all, idx } = getOrCreate(userId);
  all[idx] = {
    userId,
    suspended: false,
    blockedFromPublishing: false,
    verificationRequired: false,
    updatedAt: new Date().toISOString(),
  };
  saveAll(all);
  return all[idx];
}

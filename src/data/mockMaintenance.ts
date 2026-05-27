// Maintenance requests — localStorage first + Supabase background.
// Keeps the same synchronous API, but guarantees that requests created by the
// student appear to the landlord after refresh in Figma Make.

import { MaintenanceRequest, MaintenanceStatus } from '../types/maintenance';
import { supabase } from '../lib/supabase';

const MAINTENANCE_STORAGE_KEY = 'uniroom_maintenance_requests';

const cache = new Map<string, MaintenanceRequest>();
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function readLocal(): MaintenanceRequest[] {
  return safeParse<any[]>(localStorage.getItem(MAINTENANCE_STORAGE_KEY), [])
    .filter(item => item?.id)
    .map(normalizeRequest);
}

function writeLocal(): void {
  localStorage.setItem(
    MAINTENANCE_STORAGE_KEY,
    JSON.stringify(Array.from(cache.values())),
  );
}

function toDate(value: unknown, fallback = new Date()): Date {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function normalizeRequest(value: any): MaintenanceRequest {
  return {
    id: String(value.id),
    userId: String(value.userId ?? value.user_id ?? ''),
    accommodationId: String(value.accommodationId ?? value.accommodation_id ?? value.property_id ?? ''),
    landlordId: String(value.landlordId ?? value.landlord_id ?? ''),
    category: value.category ?? 'other',
    title: value.title ?? '',
    description: value.description ?? '',
    urgency: value.urgency ?? 'medium',
    status: value.status ?? 'pending',
    photoUrl: value.photoUrl ?? value.photo_url ?? undefined,
    createdAt: toDate(value.createdAt ?? value.created_at),
    updatedAt: toDate(value.updatedAt ?? value.updated_at),
    resolvedAt: value.resolvedAt || value.resolved_at ? toDate(value.resolvedAt ?? value.resolved_at) : undefined,
  };
}

function rowToRequest(row: any): MaintenanceRequest {
  return normalizeRequest({
    id: row.id,
    userId: row.user_id,
    accommodationId: row.accommodation_id ?? row.property_id ?? '',
    landlordId: row.landlord_id,
    category: row.category,
    title: row.title,
    description: row.description,
    urgency: row.urgency,
    status: row.status,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
  });
}

function requestToRow(request: MaintenanceRequest): Record<string, unknown> {
  return {
    id: request.id,
    user_id: request.userId,
    property_id: request.accommodationId || null,
    accommodation_id: request.accommodationId || null,
    landlord_id: request.landlordId,
    category: request.category,
    title: request.title,
    description: request.description,
    urgency: request.urgency,
    status: request.status,
    photo_url: request.photoUrl ?? null,
    resolved_at: request.resolvedAt ? request.resolvedAt.toISOString() : null,
  };
}

function loadLocalState(): void {
  cache.clear();

  readLocal().forEach(request => {
    cache.set(request.id, request);
  });
}

function mergeRequest(request: MaintenanceRequest): void {
  const current = cache.get(request.id);

  if (!current || request.updatedAt >= current.updatedAt) {
    cache.set(request.id, request);
  }
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    loadLocalState();

    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*');

    if (error) {
      console.warn('Maintenance hydrate:', error.message);
      hydrated = true;
      return;
    }

    (data ?? []).forEach(row => {
      mergeRequest(rowToRequest(row));
    });

    writeLocal();
    hydrated = true;
  })();

  return hydratePromise;
}

loadLocalState();
void hydrate();

export function getMaintenanceRequests(userId: string): MaintenanceRequest[] {
  loadLocalState();

  return Array.from(cache.values())
    .filter(request => request.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getMaintenanceRequestsForLandlord(landlordId: string): MaintenanceRequest[] {
  loadLocalState();

  return Array.from(cache.values())
    .filter(request => request.landlordId === landlordId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function createMaintenanceRequest(
  userId: string,
  accommodationId: string,
  landlordId: string,
  category: string,
  title: string,
  description: string,
  urgency: string,
  photoUrl?: string,
): MaintenanceRequest {
  loadLocalState();

  const id = `maint_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const request: MaintenanceRequest = {
    id,
    userId,
    accommodationId,
    landlordId,
    category: category as any,
    title,
    description,
    urgency: urgency as any,
    status: 'pending',
    photoUrl,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  cache.set(id, request);
  writeLocal();

  void supabase
    .from('maintenance_requests')
    .insert(requestToRow(request))
    .then(({ error }) => {
      if (error) console.warn('Maintenance insert error:', error.message);
    });

  return request;
}

export function updateMaintenanceStatus(requestId: string, status: MaintenanceStatus): boolean {
  loadLocalState();

  const request = cache.get(requestId);
  if (!request) return false;

  const resolvedAt = status === 'resolved' || status === 'closed'
    ? new Date()
    : request.resolvedAt;

  const updated: MaintenanceRequest = {
    ...request,
    status,
    updatedAt: new Date(),
    resolvedAt,
  };

  cache.set(requestId, updated);
  writeLocal();

  const patch: Record<string, unknown> = {
    status,
  };

  if (status === 'resolved' || status === 'closed') {
    patch.resolved_at = resolvedAt!.toISOString();
  }

  void supabase
    .from('maintenance_requests')
    .update(patch)
    .eq('id', requestId)
    .then(({ error }) => {
      if (error) console.warn('Maintenance update error:', error.message);
    });

  return true;
}

export function getMaintenanceStats(landlordId: string) {
  const all = getMaintenanceRequestsForLandlord(landlordId);

  return {
    total: all.length,
    pending: all.filter(request => request.status === 'pending').length,
    inProgress: all.filter(request => request.status === 'in_progress').length,
    resolved: all.filter(request => request.status === 'resolved').length,
    highUrgency: all.filter(
      request =>
        request.urgency === 'high' &&
        request.status !== 'resolved' &&
        request.status !== 'closed',
    ).length,
  };
}

export async function refreshMaintenanceState(): Promise<void> {
  hydrated = false;
  hydratePromise = null;
  await hydrate();
}

// Maintenance requests — backed by Supabase via cache+async-persist pattern.

import { MaintenanceRequest, MaintenanceStatus } from '../types/maintenance';
import { supabase } from '../lib/supabase';

const cache = new Map<string, MaintenanceRequest>();
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function rowToRequest(row: any): MaintenanceRequest {
  return {
    id: row.id,
    userId: row.user_id,
    accommodationId: row.property_id ?? '',
    landlordId: row.landlord_id,
    category: row.category,
    title: row.title,
    description: row.description ?? '',
    urgency: row.urgency,
    status: row.status,
    photoUrl: row.photo_url ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
  };
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    const { data, error } = await supabase.from('maintenance_requests').select('*');
    if (error) { console.error('Maintenance hydrate:', error.message); return; }
    cache.clear();
    (data ?? []).forEach(r => cache.set(r.id, rowToRequest(r)));
    hydrated = true;
  })();
  return hydratePromise;
}

void hydrate();

export function getMaintenanceRequests(userId: string): MaintenanceRequest[] {
  return Array.from(cache.values())
    .filter(r => r.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getMaintenanceRequestsForLandlord(landlordId: string): MaintenanceRequest[] {
  return Array.from(cache.values())
    .filter(r => r.landlordId === landlordId)
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
  const id = `maint_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const req: MaintenanceRequest = {
    id, userId, accommodationId, landlordId,
    category: category as any, title, description,
    urgency: urgency as any, status: 'pending', photoUrl,
    createdAt: new Date(), updatedAt: new Date(),
  };
  cache.set(id, req);
  void supabase.from('maintenance_requests').insert({
    id, user_id: userId, property_id: accommodationId || null,
    landlord_id: landlordId, category, title, description,
    urgency, status: 'pending', photo_url: photoUrl ?? null,
  }).then(({ error }) => {
    if (error) console.error('Maintenance insert error:', error.message);
  });
  return req;
}

export function updateMaintenanceStatus(requestId: string, status: MaintenanceStatus): boolean {
  const r = cache.get(requestId);
  if (!r) return false;
  const resolvedAt = (status === 'resolved' || status === 'closed') ? new Date() : r.resolvedAt;
  cache.set(requestId, { ...r, status, updatedAt: new Date(), resolvedAt });

  const patch: Record<string, unknown> = { status };
  if (status === 'resolved' || status === 'closed') patch.resolved_at = resolvedAt!.toISOString();
  void supabase.from('maintenance_requests').update(patch).eq('id', requestId).then(({ error }) => {
    if (error) console.error('Maintenance update error:', error.message);
  });
  return true;
}

export function getMaintenanceStats(landlordId: string) {
  const all = getMaintenanceRequestsForLandlord(landlordId);
  return {
    total: all.length,
    pending: all.filter(r => r.status === 'pending').length,
    inProgress: all.filter(r => r.status === 'in_progress').length,
    resolved: all.filter(r => r.status === 'resolved').length,
    highUrgency: all.filter(r => r.urgency === 'high' && r.status !== 'resolved' && r.status !== 'closed').length,
  };
}

export async function refreshMaintenanceState(): Promise<void> {
  hydrated = false;
  hydratePromise = null;
  await hydrate();
}

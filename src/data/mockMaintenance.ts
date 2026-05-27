// Maintenance requests — localStorage only.
// Student reports are persisted locally and shown to the landlord through the same localStorage key.

import { MaintenanceRequest, MaintenanceStatus } from '../types/maintenance';

const MAINTENANCE_STORAGE_KEY = 'uniroom_maintenance_requests';

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function toDate(value: unknown, fallback = new Date()): Date {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function normalizeRequest(value: any): MaintenanceRequest {
  return {
    id: String(value.id),
    userId: String(value.userId ?? ''),
    accommodationId: String(value.accommodationId ?? ''),
    landlordId: String(value.landlordId ?? ''),
    category: value.category ?? 'other',
    title: value.title ?? '',
    description: value.description ?? '',
    urgency: value.urgency ?? 'medium',
    status: value.status ?? 'pending',
    photoUrl: value.photoUrl ?? undefined,
    createdAt: toDate(value.createdAt),
    updatedAt: toDate(value.updatedAt),
    resolvedAt: value.resolvedAt ? toDate(value.resolvedAt) : undefined,
  };
}

function readLocal(): MaintenanceRequest[] {
  const stored = safeParse<any[]>(localStorage.getItem(MAINTENANCE_STORAGE_KEY), []);

  if (!Array.isArray(stored)) return [];

  return stored
    .filter(item => item?.id)
    .map(normalizeRequest);
}

function writeLocal(requests: MaintenanceRequest[]): void {
  localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(requests));
}

export function getMaintenanceRequests(userId: string): MaintenanceRequest[] {
  return readLocal()
    .filter(request => request.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getMaintenanceRequestsForLandlord(landlordId: string): MaintenanceRequest[] {
  return readLocal()
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
  const all = readLocal();

  const request: MaintenanceRequest = {
    id: `maint_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
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

  writeLocal([request, ...all]);

  return request;
}

export function updateMaintenanceStatus(requestId: string, status: MaintenanceStatus): boolean {
  const all = readLocal();
  const index = all.findIndex(request => request.id === requestId);

  if (index < 0) return false;

  const resolvedAt = status === 'resolved' || status === 'closed'
    ? new Date()
    : all[index].resolvedAt;

  all[index] = {
    ...all[index],
    status,
    updatedAt: new Date(),
    resolvedAt,
  };

  writeLocal(all);

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
  return Promise.resolve();
}

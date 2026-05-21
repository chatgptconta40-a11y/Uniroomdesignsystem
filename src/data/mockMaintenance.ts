import { MaintenanceRequest, MaintenanceStatus } from '../types/maintenance';

const MAINTENANCE_STORAGE_KEY = 'uniroom_maintenance';

const initialRequests: MaintenanceRequest[] = [
  {
    id: 'maint_1',
    userId: 'estudante',
    accommodationId: '2',
    landlordId: '2',
    category: 'heating',
    title: 'Esquentador avariado',
    description: 'O esquentador não está a aquecer a água. Desde ontem que só sai água fria.',
    urgency: 'high',
    status: 'in_progress',
    createdAt: new Date('2026-05-01T09:00:00'),
    updatedAt: new Date('2026-05-02T10:30:00'),
  },
  {
    id: 'maint_2',
    userId: 'estudante',
    accommodationId: '2',
    landlordId: '2',
    category: 'internet',
    title: 'Internet lenta',
    description: 'A internet está muito lenta há alguns dias. Dificuldade em assistir aulas online.',
    urgency: 'medium',
    status: 'resolved',
    createdAt: new Date('2026-04-25T14:20:00'),
    updatedAt: new Date('2026-04-28T16:00:00'),
    resolvedAt: new Date('2026-04-28T16:00:00'),
  },
];

// Initialize localStorage
function initializeStorage() {
  if (!localStorage.getItem(MAINTENANCE_STORAGE_KEY)) {
    localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(initialRequests));
  }
}

initializeStorage();

export function getMaintenanceRequests(userId: string): MaintenanceRequest[] {
  const stored = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
  const all: MaintenanceRequest[] = stored ? JSON.parse(stored) : [];
  return all
    .filter(req => req.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMaintenanceRequestsForLandlord(landlordId: string): MaintenanceRequest[] {
  const stored = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
  const all: MaintenanceRequest[] = stored ? JSON.parse(stored) : [];
  return all
    .filter(req => req.landlordId === landlordId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createMaintenanceRequest(
  userId: string,
  accommodationId: string,
  landlordId: string,
  category: string,
  title: string,
  description: string,
  urgency: string,
  photoUrl?: string
): MaintenanceRequest {
  const stored = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
  const all: MaintenanceRequest[] = stored ? JSON.parse(stored) : [];

  const newRequest: MaintenanceRequest = {
    id: `maint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

  all.push(newRequest);
  localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(all));

  return newRequest;
}

export function updateMaintenanceStatus(
  requestId: string,
  status: MaintenanceStatus
): boolean {
  const stored = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
  const all: MaintenanceRequest[] = stored ? JSON.parse(stored) : [];

  const index = all.findIndex(r => r.id === requestId);
  if (index >= 0) {
    all[index].status = status;
    all[index].updatedAt = new Date();

    if (status === 'resolved' || status === 'closed') {
      all[index].resolvedAt = new Date();
    }

    localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(all));
    return true;
  }

  return false;
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

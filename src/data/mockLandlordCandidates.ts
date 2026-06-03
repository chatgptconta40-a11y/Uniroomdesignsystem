// DEPRECATED: Este ficheiro está deprecated para uso geral.
// Apenas usado por AdminProperties.tsx e AdminDashboard.tsx para visualização admin.
// Para candidaturas do senhorio, usar useLandlordApplications de hooks/useDb.ts

import { updateApplicationStatus, syncVisitData } from './mockApplications';

export type CandidateStatus = 'pending' | 'under_review' | 'accepted' | 'rejected';

export interface LandlordApplication {
  id: string;
  propertyId: string;
  roomId: string;
  studentId: string;
  studentName: string;
  initials: string;
  avatarColor: string;
  university: string;
  course: string;
  year: number;
  isStudent: boolean;
  compatibilityScore: number;
  message: string;
  status: CandidateStatus;
  appliedAt: string;
  visitDate?: string;
  visitFormat?: 'presencial' | 'videochamada';
  visitNote?: string;
  linkedStudentAppId?: string;
}

const STORAGE_KEY = 'uniroom_landlord_applications';

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function normalizeApplication(value: any): LandlordApplication | null {
  if (!value?.id || !value?.propertyId || !value?.roomId || !value?.studentId) {
    return null;
  }

  const name = value.studentName || 'Estudante';

  return {
    id: String(value.id),
    propertyId: String(value.propertyId),
    roomId: String(value.roomId),
    studentId: String(value.studentId),
    studentName: name,
    initials: value.initials || name.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase(),
    avatarColor: value.avatarColor || 'from-blue-500 to-indigo-500',
    university: value.university || '',
    course: value.course || '',
    year: Number(value.year || 0),
    isStudent: value.isStudent !== false,
    compatibilityScore: Number(value.compatibilityScore || 0),
    message: value.message || '',
    status: value.status || 'pending',
    appliedAt: value.appliedAt || new Date().toISOString().slice(0, 10),
    visitDate: value.visitDate,
    visitFormat: value.visitFormat,
    visitNote: value.visitNote,
    linkedStudentAppId: value.linkedStudentAppId,
  };
}

function initStorage(): LandlordApplication[] {
  const stored = safeParse<any[]>(localStorage.getItem(STORAGE_KEY), []);

  if (!Array.isArray(stored)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  }

  const normalized = stored
    .map(normalizeApplication)
    .filter((item): item is LandlordApplication => Boolean(item));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

  return normalized;
}

function saveAll(apps: LandlordApplication[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

function isActiveCandidate(status: CandidateStatus): boolean {
  return status === 'pending' || status === 'under_review';
}

export function getAllApplications(): LandlordApplication[] {
  return initStorage().sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
  );
}

export function getApplicationsByProperty(propertyId: string): LandlordApplication[] {
  return getAllApplications().filter(app => app.propertyId === propertyId);
}

export function getApplicationsByRoom(propertyId: string, roomId: string): LandlordApplication[] {
  return getAllApplications().filter(app => app.propertyId === propertyId && app.roomId === roomId);
}

export function getPendingCountForLandlord(_landlordId: string, propertyIds: string[]): number {
  return initStorage().filter(
    app => propertyIds.includes(app.propertyId) && isActiveCandidate(app.status),
  ).length;
}

export function updateCandidateStatus(
  applicationId: string,
  status: CandidateStatus,
): LandlordApplication | null {
  const all = initStorage();
  const idx = all.findIndex(app => app.id === applicationId);

  if (idx < 0) return null;

  const target = all[idx];

  if (status === 'accepted') {
    const updated = all.map(app => {
      if (app.id === applicationId) {
        return { ...app, status: 'accepted' as CandidateStatus };
      }

      const sameRoom =
        app.propertyId === target.propertyId &&
        app.roomId === target.roomId;

      if (sameRoom && isActiveCandidate(app.status)) {
        return { ...app, status: 'rejected' as CandidateStatus };
      }

      return app;
    });

    saveAll(updated);

    if (target.linkedStudentAppId) {
      updateApplicationStatus(
        target.linkedStudentAppId,
        'accepted',
        'O senhorio aceitou a tua candidatura. Confirma a estadia para garantir o quarto.',
      );
    }

    updated
      .filter(app =>
        app.id !== applicationId &&
        app.propertyId === target.propertyId &&
        app.roomId === target.roomId &&
        app.status === 'rejected' &&
        !!app.linkedStudentAppId,
      )
      .forEach(app => {
        updateApplicationStatus(
          app.linkedStudentAppId as string,
          'rejected',
          'O quarto foi reservado por outro candidato.',
        );
      });

    return updated.find(app => app.id === applicationId) ?? null;
  }

  all[idx] = { ...target, status };
  saveAll(all);

  if (target.linkedStudentAppId) {
    updateApplicationStatus(target.linkedStudentAppId, status);
  }

  return all[idx];
}

export function addApplication(app: LandlordApplication): void {
  const all = initStorage();

  const alreadyExists = all.some(existing =>
    existing.studentId === app.studentId &&
    existing.roomId === app.roomId &&
    existing.propertyId === app.propertyId &&
    existing.status !== 'rejected',
  );

  if (alreadyExists) return;

  saveAll([...all, app]);
}

export function scheduleVisit(
  applicationId: string,
  visitDate: string,
  visitFormat: 'presencial' | 'videochamada' = 'presencial',
  visitNote?: string,
): LandlordApplication | null {
  const all = initStorage();
  const idx = all.findIndex(app => app.id === applicationId);

  if (idx < 0) return null;

  const nextStatus = all[idx].status === 'pending'
    ? 'under_review'
    : all[idx].status;

  all[idx] = {
    ...all[idx],
    visitDate,
    visitFormat,
    visitNote: visitNote || undefined,
    status: nextStatus,
  };

  saveAll(all);

  if (all[idx].linkedStudentAppId) {
    syncVisitData(all[idx].linkedStudentAppId, visitDate, visitFormat, visitNote);
  }

  return all[idx];
}

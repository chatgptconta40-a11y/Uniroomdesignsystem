// Unified application layer.
// This is the only place that should create/cancel an application across
// the student-side application list and the landlord-side candidate queue.

import {
  createApplication,
  updateApplicationLinkCandidateId,
  withdrawApplication,
  getApplicationById,
  getExistingApplicationForRoom,
} from './mockApplications';
import { addApplication, LandlordApplication } from './mockLandlordCandidates';
import { getProperty, getRoom } from './mockProperties';
import { Application } from '../types/accommodation';

export { getExistingApplicationForRoom };

const USERS_STORAGE_KEY = 'uniroom_all_users';

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-red-500',
  'from-cyan-500 to-blue-500',
];

function pickAvatarColor(userId: string): string {
  let hash = 0;

  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');
}

function getUserName(userId: string): string | undefined {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);

  if (!stored) return undefined;

  try {
    const users = JSON.parse(stored);
    const user = users.find((item: any) => item.id === userId);
    return user?.name;
  } catch {
    return undefined;
  }
}

function getLandlordDisplayName(landlordId: string, fallback?: string): string {
  return getUserName(landlordId) || fallback || 'Senhorio';
}

function isRoomAvailable(roomId: string): boolean {
  const room = getRoom(roomId);

  if (!room) return true;

  return room.status === 'available';
}

export interface UnifiedApplicationParams {
  studentId: string;
  studentName: string;
  studentUniversity?: string;
  studentCourse?: string;
  studentYear?: number;
  roomId: string;
  propertyId: string;
  landlordId: string;
  landlordName?: string;
  message: string;
  moveInDate?: Date;
  accommodationId?: string;
}

export function createUnifiedApplication(params: UnifiedApplicationParams): Application {
  const {
    studentId,
    studentName,
    studentUniversity = 'Não especificada',
    studentCourse = 'Não especificado',
    studentYear = 1,
    roomId,
    propertyId,
    landlordId,
    landlordName,
    message,
    moveInDate,
    accommodationId,
  } = params;

  const existing = getExistingApplicationForRoom(studentId, roomId);

  if (existing) {
    return existing;
  }

  if (!isRoomAvailable(roomId)) {
    throw new Error('Este quarto já não está disponível para candidatura.');
  }

  const room = getRoom(roomId);
  const property = getProperty(propertyId || room?.propertyId || '');
  const resolvedPropertyId = propertyId || property?.id || room?.propertyId || '';
  const resolvedLandlordId = landlordId || property?.landlordId || '';
  const resolvedLandlordName = getLandlordDisplayName(resolvedLandlordId, landlordName);

  const application = createApplication(
    studentId,
    accommodationId || roomId,
    resolvedLandlordId,
    message,
    moveInDate,
    {
      roomId,
      propertyId: resolvedPropertyId,
      landlordName: resolvedLandlordName,
    },
  );

  const candidate: LandlordApplication = {
    id: `lapp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    propertyId: resolvedPropertyId,
    roomId,
    studentId,
    studentName,
    initials: initials(studentName || 'Estudante'),
    avatarColor: pickAvatarColor(studentId),
    university: studentUniversity,
    course: studentCourse,
    year: studentYear,
    isStudent: true,
    compatibilityScore: 70 + Math.floor(Math.random() * 25),
    message: message || 'Sem mensagem.',
    status: 'pending',
    appliedAt: new Date().toISOString().slice(0, 10),
    linkedStudentAppId: application.id,
  };

  addApplication(candidate);
  updateApplicationLinkCandidateId(application.id, candidate.id);

  return {
    ...application,
    linkedCandidateId: candidate.id,
  };
}

export function cancelUnifiedApplication(applicationId: string): void {
  const app = getApplicationById(applicationId);

  if (!app) return;

  withdrawApplication(applicationId);

  if (!app.linkedCandidateId) return;

  const stored = localStorage.getItem('uniroom_landlord_applications');

  if (!stored) return;

  try {
    const all: LandlordApplication[] = JSON.parse(stored);
    const idx = all.findIndex(candidate => candidate.id === app.linkedCandidateId);

    if (idx < 0) return;

    all[idx] = {
      ...all[idx],
      status: 'rejected',
    };

    localStorage.setItem('uniroom_landlord_applications', JSON.stringify(all));
  } catch {
    // Ignore invalid persisted mock data.
  }
}
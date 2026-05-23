// Unified application layer — creates and cancels applications atomically in both systems.
// Use this instead of calling mockApplications and mockLandlordCandidates separately.

import {
  createApplication,
  updateApplicationLinkCandidateId,
  withdrawApplication,
  getApplicationById,
  getExistingApplicationForRoom,
} from './mockApplications';
import { addApplication, updateCandidateStatus, LandlordApplication } from './mockLandlordCandidates';
import { Application } from '../types/accommodation';

export { getExistingApplicationForRoom };

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
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
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
  landlordName: string;
  message: string;
  moveInDate?: Date;
  // For ApplicationModal: the accommodation ID (room ID or legacy accommodation ID)
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

  // 1. Create student-side Application (without linkedCandidateId yet)
  const application = createApplication(
    studentId,
    accommodationId || roomId,
    landlordId,
    message,
    moveInDate,
    { roomId, propertyId, landlordName },
  );

  // 2. Create landlord-side LandlordApplication
  const candidate: LandlordApplication = {
    id: `lapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    propertyId,
    roomId,
    studentId,
    studentName,
    initials: initials(studentName),
    avatarColor: pickAvatarColor(studentId),
    university: studentUniversity,
    course: studentCourse,
    year: studentYear,
    isStudent: true,
    compatibilityScore: 70 + Math.floor(Math.random() * 25), // 70-94
    message: message || 'Sem mensagem.',
    status: 'pending',
    appliedAt: new Date().toISOString().slice(0, 10),
    linkedStudentAppId: application.id,
  };

  addApplication(candidate);

  // 3. Back-link: update Application with the candidate's ID
  updateApplicationLinkCandidateId(application.id, candidate.id);

  return application;
}

export function cancelUnifiedApplication(applicationId: string): void {
  const app = getApplicationById(applicationId);
  if (!app) return;

  // Cancel student side
  withdrawApplication(applicationId);

  // Cancel landlord side (mark as rejected so it disappears from active queue)
  if (app.linkedCandidateId) {
    // Use updateCandidateStatus without triggering sync back (avoid loop)
    // Direct localStorage write to avoid re-triggering syncStatusFromCandidate
    const stored = localStorage.getItem('uniroom_landlord_applications');
    if (stored) {
      try {
        const all: LandlordApplication[] = JSON.parse(stored);
        const idx = all.findIndex(a => a.id === app.linkedCandidateId);
        if (idx >= 0) {
          all[idx] = { ...all[idx], status: 'rejected' };
          localStorage.setItem('uniroom_landlord_applications', JSON.stringify(all));
        }
      } catch {
        // silently ignore
      }
    }
  }
}

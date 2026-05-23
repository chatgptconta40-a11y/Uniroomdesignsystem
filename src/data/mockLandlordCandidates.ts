// Landlord-side application data, persisted in localStorage.
// Structured to support future Supabase migration.
// Bidirectional sync with mockApplications via linkedStudentAppId / linkedCandidateId.

import { updateApplicationStatus, syncVisitData } from './mockApplications';

export type CandidateStatus = 'pending' | 'under_review' | 'accepted' | 'rejected';

export interface LandlordApplication {
  id: string;
  propertyId: string;
  roomId: string;
  studentId: string;
  studentName: string;
  initials: string;
  avatarColor: string; // tailwind gradient classes
  university: string;
  course: string;
  year: number;
  isStudent: boolean;
  compatibilityScore: number;
  message: string;
  status: CandidateStatus;
  appliedAt: string; // ISO date string
  visitDate?: string;
  visitFormat?: 'presencial' | 'videochamada';
  visitNote?: string;
  // Cross-reference to student-side Application
  linkedStudentAppId?: string;
}

const STORAGE_KEY = 'uniroom_landlord_applications';
const DATA_VERSION_KEY = 'uniroom_landlord_applications_version';
const CURRENT_VERSION = '2026-05-v2';

const INITIAL_APPLICATIONS: LandlordApplication[] = [
  // ── Demo entries linked to the logged-in student (id: '1', João Silva) ────
  {
    id: 'lapp-demo-a',
    propertyId: 'prop-estgv',
    roomId: 'room-estgv-2',
    studentId: '1',
    studentName: 'João Silva',
    initials: 'JS',
    avatarColor: 'from-blue-500 to-indigo-500',
    university: 'Universidade de Lisboa',
    course: 'Engenharia Informática',
    year: 2,
    isStudent: true,
    compatibilityScore: 88,
    message: 'Olá! Sou estudante de Engenharia Informática no 2º ano na Universidade de Lisboa. Procuro um quarto tranquilo perto da faculdade. Sou organizado, respeitador e gosto de manter a casa limpa.',
    status: 'under_review',
    appliedAt: '2026-05-18',
    visitDate: '2026-05-28T15:00:00',
    visitFormat: 'presencial',
    visitNote: 'Encontremo-nos na entrada do edifício.',
    linkedStudentAppId: 'app1',
  },
  {
    id: 'lapp-demo-b',
    propertyId: 'prop-estgv',
    roomId: 'room-estgv-1',
    studentId: '1',
    studentName: 'João Silva',
    initials: 'JS',
    avatarColor: 'from-blue-500 to-indigo-500',
    university: 'Universidade de Lisboa',
    course: 'Engenharia Informática',
    year: 2,
    isStudent: true,
    compatibilityScore: 92,
    message: 'Boa tarde! Sou estudante de Informática e procuro alojamento a partir de setembro. Tenho horários flexíveis e gosto de um ambiente calmo para estudar.',
    status: 'accepted',
    appliedAt: '2026-04-10',
    linkedStudentAppId: 'app2',
  },
  {
    id: 'lapp-demo-c',
    propertyId: 'prop-1',
    roomId: 'room-1',
    studentId: '1',
    studentName: 'João Silva',
    initials: 'JS',
    avatarColor: 'from-blue-500 to-indigo-500',
    university: 'Universidade de Lisboa',
    course: 'Engenharia Informática',
    year: 2,
    isStudent: true,
    compatibilityScore: 74,
    message: 'Olá! Interessado no quarto. Sou estudante responsável e procuro alojamento de longa duração.',
    status: 'rejected',
    appliedAt: '2026-04-08',
    linkedStudentAppId: 'app3',
  },
  // ── Other students (no linkedStudentAppId — not linked to the demo account) ─
  {
    id: 'lapp-1',
    propertyId: 'prop-estgv',
    roomId: 'room-estgv-1',
    studentId: 'student-1',
    studentName: 'Ana Rodrigues',
    initials: 'AR',
    avatarColor: 'from-purple-500 to-pink-500',
    university: 'ESTGV',
    course: 'Engenharia Informática',
    year: 2,
    isStudent: true,
    compatibilityScore: 92,
    message: 'Olá! Sou estudante de Informática no 2º ano na ESTGV. Procuro um quarto tranquilo e organizado. Tenho horários de estudo regulares e gosto de manter a casa limpa.',
    status: 'pending',
    appliedAt: '2026-05-20',
  },
  {
    id: 'lapp-2',
    propertyId: 'prop-estgv',
    roomId: 'room-estgv-2',
    studentId: 'student-2',
    studentName: 'Miguel Santos',
    initials: 'MS',
    avatarColor: 'from-blue-500 to-cyan-500',
    university: 'ESTGV',
    course: 'Gestão',
    year: 3,
    isStudent: true,
    compatibilityScore: 85,
    message: 'Bom dia! Sou estudante de Gestão, 3º ano. Procuro alojamento a partir de setembro. Sou calmo, responsável e não fumo.',
    status: 'under_review',
    appliedAt: '2026-05-18',
  },
  {
    id: 'lapp-3',
    propertyId: 'prop-estgv',
    roomId: 'room-estgv-3',
    studentId: 'student-3',
    studentName: 'Sofia Costa',
    initials: 'SC',
    avatarColor: 'from-green-500 to-teal-500',
    university: 'ESTGV',
    course: 'Design de Comunicação',
    year: 1,
    isStudent: true,
    compatibilityScore: 78,
    message: 'Olá! Sou estudante do 1º ano, transferi-me do Porto. Procuro quarto perto da ESTGV. Gosto de ambientes calmos e respeito as regras da casa.',
    status: 'pending',
    appliedAt: '2026-05-22',
  },
  {
    id: 'lapp-4',
    propertyId: 'prop-estgv',
    roomId: 'room-estgv-2',
    studentId: 'student-4',
    studentName: 'João Ferreira',
    initials: 'JF',
    avatarColor: 'from-orange-500 to-red-500',
    university: 'ESTGV',
    course: 'Marketing',
    year: 2,
    isStudent: true,
    compatibilityScore: 71,
    message: 'Estudante de Marketing, 2º ano. Procuro quarto económico com boa ligação à faculdade.',
    status: 'rejected',
    appliedAt: '2026-05-15',
  },
  {
    id: 'lapp-5',
    propertyId: 'prop-1',
    roomId: 'room-1',
    studentId: 'student-5',
    studentName: 'Beatriz Lopes',
    initials: 'BL',
    avatarColor: 'from-rose-500 to-pink-500',
    university: 'ESTGV',
    course: 'Enfermagem',
    year: 2,
    isStudent: true,
    compatibilityScore: 88,
    message: 'Olá! Sou estudante de Enfermagem e estou a procurar quarto perto do hospital para o estágio clínico. Sou organizada e discreta.',
    status: 'pending',
    appliedAt: '2026-05-19',
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

function initStorage(): LandlordApplication[] {
  const version = localStorage.getItem(DATA_VERSION_KEY);
  if (version !== CURRENT_VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPLICATIONS));
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
    return [...INITIAL_APPLICATIONS];
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPLICATIONS));
    return [...INITIAL_APPLICATIONS];
  }
  try {
    return JSON.parse(stored) as LandlordApplication[];
  } catch {
    return [...INITIAL_APPLICATIONS];
  }
}

function saveAll(apps: LandlordApplication[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function getAllApplications(): LandlordApplication[] {
  return initStorage();
}

export function getApplicationsByProperty(propertyId: string): LandlordApplication[] {
  return initStorage().filter(a => a.propertyId === propertyId);
}

export function getApplicationsByRoom(propertyId: string, roomId: string): LandlordApplication[] {
  return initStorage().filter(a => a.propertyId === propertyId && a.roomId === roomId);
}

export function getPendingCountForLandlord(landlordId: string, propertyIds: string[]): number {
  return initStorage().filter(
    a => propertyIds.includes(a.propertyId) && (a.status === 'pending' || a.status === 'under_review'),
  ).length;
}

// ─── Mutations (with bidirectional sync) ──────────────────────────────────────

export function updateCandidateStatus(
  applicationId: string,
  status: CandidateStatus,
): LandlordApplication | null {
  const all = initStorage();
  const idx = all.findIndex(a => a.id === applicationId);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], status };
  saveAll(all);

  // Sync to student-side
  const linked = all[idx].linkedStudentAppId;
  if (linked) {
    updateApplicationStatus(linked, status);
  }

  return all[idx];
}

export function addApplication(app: LandlordApplication): void {
  const all = initStorage();
  all.push(app);
  saveAll(all);
}

export function scheduleVisit(
  applicationId: string,
  visitDate: string,
  visitFormat: 'presencial' | 'videochamada' = 'presencial',
  visitNote?: string,
): LandlordApplication | null {
  const all = initStorage();
  const idx = all.findIndex(a => a.id === applicationId);
  if (idx < 0) return null;
  all[idx] = {
    ...all[idx],
    visitDate,
    visitFormat,
    visitNote: visitNote || undefined,
    status: all[idx].status === 'pending' ? 'under_review' : all[idx].status,
  };
  saveAll(all);

  // Sync visit data to student-side
  const linked = all[idx].linkedStudentAppId;
  if (linked) {
    syncVisitData(linked, visitDate, visitFormat, visitNote);
  }

  return all[idx];
}

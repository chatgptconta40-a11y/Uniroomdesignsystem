// Landlord-side application data, persisted in localStorage.
// Structured to support future Supabase migration.

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
  visitDate?: string; // ISO date string, optional
}

const STORAGE_KEY = 'uniroom_landlord_applications';
const DATA_VERSION_KEY = 'uniroom_landlord_applications_version';
const CURRENT_VERSION = '2026-05-v1';

// Initial mock data — linked to the ESTGV test property
const INITIAL_APPLICATIONS: LandlordApplication[] = [
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
    message: 'Bom dia! Sou estudante de Gestão, 3º ano. Procuro alojamento a partir de setembro. Sou calmo, responsável e não fumo. Tenho referências de senhorios anteriores.',
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
    message: 'Estudante de Marketing, 2º ano. Procuro quarto económico com boa ligação à faculdade. Sou sociável mas respeito os espaços comuns.',
    status: 'rejected',
    appliedAt: '2026-05-15',
  },
  // prop-1 applications
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

function initStorage(): LandlordApplication[] {
  const version = localStorage.getItem(DATA_VERSION_KEY);
  if (version !== CURRENT_VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPLICATIONS));
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
    return INITIAL_APPLICATIONS;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPLICATIONS));
    return INITIAL_APPLICATIONS;
  }
  try {
    return JSON.parse(stored) as LandlordApplication[];
  } catch {
    return INITIAL_APPLICATIONS;
  }
}

function saveAll(applications: LandlordApplication[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

export function getApplicationsByProperty(propertyId: string): LandlordApplication[] {
  return initStorage().filter(a => a.propertyId === propertyId);
}

export function getApplicationsByRoom(propertyId: string, roomId: string): LandlordApplication[] {
  return initStorage().filter(a => a.propertyId === propertyId && a.roomId === roomId);
}

export function getPendingCountForLandlord(landlordId: string, propertyIds: string[]): number {
  const all = initStorage();
  return all.filter(
    a => propertyIds.includes(a.propertyId) && (a.status === 'pending' || a.status === 'under_review'),
  ).length;
}

export function updateCandidateStatus(
  applicationId: string,
  status: CandidateStatus,
): LandlordApplication | null {
  const all = initStorage();
  const idx = all.findIndex(a => a.id === applicationId);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], status };
  saveAll(all);
  return all[idx];
}

export function addApplication(app: LandlordApplication): void {
  const all = initStorage();
  all.push(app);
  saveAll(all);
}

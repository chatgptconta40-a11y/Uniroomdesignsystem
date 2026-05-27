import { User, StudentProfile, LandlordProfile } from '../types/auth';

const USERS_KEY = 'uniroom_all_users';
const STUDENT_PROFILES_KEY = 'uniroom_student_profiles';

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function normalizeUser(value: any): User | null {
  if (!value?.id || !value?.email || !value?.type) return null;

  return {
    id: String(value.id),
    name: value.name || value.fullName || value.email,
    email: value.email,
    password: value.password,
    type: value.type,
    verified: Boolean(value.verified),
    status: value.status || 'active',
    onboardingCompleted: value.onboardingCompleted,
    profileCompleteness: value.profileCompleteness,
    createdAt: value.createdAt ? new Date(value.createdAt) : new Date(),
  };
}

export function getStoredUsers(): User[] {
  const users = safeParse<any[]>(localStorage.getItem(USERS_KEY), []);

  return Array.isArray(users)
    ? users.map(normalizeUser).filter((user): user is User => Boolean(user))
    : [];
}

export function saveStoredUser(user: User): void {
  const users = getStoredUsers();
  const index = users.findIndex(item => item.id === user.id || item.email === user.email);

  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getStoredStudentProfiles(): StudentProfile[] {
  const profiles = safeParse<any[]>(localStorage.getItem(STUDENT_PROFILES_KEY), []);

  return Array.isArray(profiles)
    ? profiles
        .filter(profile => profile?.personal?.userId)
        .map(profile => ({
          userId: String(profile.personal.userId),
          university: profile.personal.institution,
          course: profile.personal.course,
          year: profile.personal.yearOfStudy,
        }))
    : [];
}

export function getStoredLandlordProfiles(): LandlordProfile[] {
  return getStoredUsers()
    .filter(user => user.type === 'landlord')
    .map(user => ({
      userId: user.id,
    }));
}

/*
  Compatibilidade com imports antigos.
  Importante: já não existem utilizadores hardcoded aqui.
  Estes arrays são apenas uma fotografia do localStorage no carregamento do módulo.
*/
export const mockUsers: User[] = getStoredUsers();
export const mockCredentials = mockUsers
  .filter(user => Boolean(user.password))
  .map(user => ({
    id: user.id,
    email: user.email,
    password: user.password!,
  }));

export const mockStudentProfiles: StudentProfile[] = getStoredStudentProfiles();
export const mockLandlordProfiles: LandlordProfile[] = getStoredLandlordProfiles();

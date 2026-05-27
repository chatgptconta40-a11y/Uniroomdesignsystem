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

function liveArray<T>(reader: () => T[]): T[] {
  return new Proxy([] as T[], {
    get(_target, prop) {
      const current = reader();
      const value = (current as any)[prop as any];

      if (typeof value === 'function') {
        return value.bind(current);
      }

      return value;
    },
    ownKeys() {
      return Reflect.ownKeys(reader() as any);
    },
    getOwnPropertyDescriptor(_target, prop) {
      const current = reader() as any;
      const descriptor = Object.getOwnPropertyDescriptor(current, prop);

      return descriptor || {
        configurable: true,
        enumerable: true,
        writable: false,
        value: current[prop as any],
      };
    },
  });
}

/*
  Compatibilidade com imports antigos.
  Importante:
  - não há users hardcoded
  - estes arrays são "live": cada .find/.filter/.map lê novamente do localStorage
*/
export const mockUsers: User[] = liveArray(getStoredUsers);

export const mockCredentials: Array<{ id: string; email: string; password: string }> = liveArray(() =>
  getStoredUsers()
    .filter(user => Boolean(user.password))
    .map(user => ({
      id: user.id,
      email: user.email,
      password: user.password!,
    })),
);

export const mockStudentProfiles: StudentProfile[] = liveArray(getStoredStudentProfiles);
export const mockLandlordProfiles: LandlordProfile[] = liveArray(getStoredLandlordProfiles);

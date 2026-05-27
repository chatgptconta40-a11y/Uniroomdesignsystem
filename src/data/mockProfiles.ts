import { StudentProfile } from '../types/profile';

export const PROFILES_STORAGE_KEY = 'uniroom_student_profiles';
export const PROFILE_COMPLETED_STORAGE_PREFIX = 'uniroom_profile_completed_';

/*
  Perfil do estudante — localStorage first/only.

  Importante:
  - Não há perfis mockados por defeito.
  - O perfil só existe depois de o estudante preencher o onboarding/perfil.
  - A compatibilidade lê daqui através de getProfile(userId).
*/

export const mockProfiles: StudentProfile[] = [];

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function readProfiles(): StudentProfile[] {
  const profiles = safeParse<StudentProfile[]>(
    localStorage.getItem(PROFILES_STORAGE_KEY),
    [],
  );

  return Array.isArray(profiles) ? profiles : [];
}

function writeProfiles(profiles: StudentProfile[]): void {
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

export function getProfileCompletedStorageKey(userId: string): string {
  return `${PROFILE_COMPLETED_STORAGE_PREFIX}${userId}`;
}

export function getProfile(userId: string): StudentProfile | null {
  if (!userId) return null;

  const profiles = readProfiles();

  return profiles.find(profile => profile.personal?.userId === userId) || null;
}

export function saveProfile(profile: StudentProfile): void {
  const userId = profile.personal?.userId;

  if (!userId) {
    console.warn('[UniRoom] Tentativa de guardar perfil sem userId.');
    return;
  }

  const profiles = readProfiles();
  const index = profiles.findIndex(item => item.personal?.userId === userId);

  const normalizedProfile: StudentProfile = {
    ...profile,
    personal: {
      ...profile.personal,
      userId,
    },
    lifestyle: {
      ...profile.lifestyle,
      userId,
    },
    preferences: {
      ...profile.preferences,
      userId,
    },
    completeness: profile.completeness || calculateCompleteness(profile),
  };

  if (index >= 0) {
    profiles[index] = normalizedProfile;
  } else {
    profiles.push(normalizedProfile);
  }

  writeProfiles(profiles);

  const completedEnough = Boolean(
    normalizedProfile.onboardingCompleted &&
    (normalizedProfile.completeness?.personal ?? 0) >= 80 &&
    (normalizedProfile.completeness?.lifestyle ?? 0) >= 80 &&
    (normalizedProfile.completeness?.preferences ?? 0) >= 80 &&
    (normalizedProfile.completeness?.overall ?? 0) >= 80
  );

  if (completedEnough) {
    localStorage.setItem(getProfileCompletedStorageKey(userId), 'true');
  } else {
    localStorage.removeItem(getProfileCompletedStorageKey(userId));
  }
}

export function deleteProfile(userId: string): void {
  const profiles = readProfiles().filter(profile => profile.personal?.userId !== userId);
  writeProfiles(profiles);
  localStorage.removeItem(getProfileCompletedStorageKey(userId));
}

export function getAllProfiles(): StudentProfile[] {
  return readProfiles();
}

export function hasCompletedCompatibilityProfile(userId?: string | null): boolean {
  if (!userId) return false;

  if (localStorage.getItem(getProfileCompletedStorageKey(userId)) === 'true') {
    return true;
  }

  const profile = getProfile(userId);
  if (!profile) return false;

  return Boolean(
    profile.onboardingCompleted &&
    (profile.completeness?.personal ?? 0) >= 80 &&
    (profile.completeness?.lifestyle ?? 0) >= 80 &&
    (profile.completeness?.preferences ?? 0) >= 80 &&
    (profile.completeness?.overall ?? 0) >= 80
  );
}

export function calculateCompleteness(profile: Partial<StudentProfile>): StudentProfile['completeness'] {
  const personal = profile.personal || {};
  const lifestyle = profile.lifestyle || {};
  const preferences = profile.preferences || {};

  const hasValue = (value: unknown) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  };

  const personalFields = [
    'fullName',
    'age',
    'gender',
    'course',
    'institution',
    'yearOfStudy',
    'hometown',
    'bio',
    'languages',
  ];

  const lifestyleFields = [
    'bedtime',
    'wakeupTime',
    'schedule',
    'cleanliness',
    'cleaningFrequency',
    'noiseTolerance',
    'musicVolume',
    'guestsFrequency',
    'guestsAcceptance',
    'smoking',
    'pets',
    'cooking',
    'personality',
    'socialPreference',
  ];

  const preferencesFields = [
    'maxBudget',
    'preferredCities',
    'maxDistanceFromUniversity',
    'moveInDate',
    'stayDuration',
    'roomType',
  ];

  const personalCompleted = personalFields.filter(field =>
    hasValue(personal[field as keyof typeof personal]),
  ).length;

  const lifestyleCompleted = lifestyleFields.filter(field =>
    hasValue(lifestyle[field as keyof typeof lifestyle]),
  ).length;

  const preferencesCompleted = preferencesFields.filter(field =>
    hasValue(preferences[field as keyof typeof preferences]),
  ).length;

  const personalScore = Math.round((personalCompleted / personalFields.length) * 100);
  const lifestyleScore = Math.round((lifestyleCompleted / lifestyleFields.length) * 100);
  const preferencesScore = Math.round((preferencesCompleted / preferencesFields.length) * 100);
  const overall = Math.round((personalScore + lifestyleScore + preferencesScore) / 3);

  return {
    personal: personalScore,
    lifestyle: lifestyleScore,
    preferences: preferencesScore,
    overall,
  };
}

import { StudentProfile } from '../types/profile';

export const PROFILES_STORAGE_KEY = 'uniroom_student_profiles';

export const mockProfiles: StudentProfile[] = [
  {
    personal: {
      userId: '1',
      fullName: 'João Silva',
      age: 20,
      gender: 'male',
      course: 'Engenharia Informática',
      institution: 'Universidade de Lisboa',
      yearOfStudy: 2,
      hometown: 'Porto',
      bio: 'Estudante de Engenharia apaixonado por tecnologia e desporto.',
      languages: ['Português', 'Inglês', 'Espanhol'],
    },
    lifestyle: {
      userId: '1',
      bedtime: 'moderate',
      wakeupTime: 'moderate',
      schedule: 'flexible',
      cleanliness: 4,
      cleaningFrequency: 'weekly',
      noiseTolerance: 3,
      musicVolume: 'moderate',
      guestsFrequency: 'sometimes',
      guestsAcceptance: 4,
      smoking: false,
      pets: false,
      cooking: 'often',
      personality: 'moderate',
      socialPreference: 'moderate',
    },
    preferences: {
      userId: '1',
      maxBudget: 400,
      preferredCities: ['Lisboa', 'Cascais'],
      maxDistanceFromUniversity: 5,
      moveInDate: new Date('2026-09-01'),
      stayDuration: 10,
      roomType: 'private',
      amenities: {
        furnished: true,
        wifi: true,
        utilitiesIncluded: false,
        kitchen: true,
        washingMachine: true,
        balcony: false,
        parking: false,
      },
    },
    completeness: {
      personal: 100,
      lifestyle: 100,
      preferences: 100,
      overall: 100,
    },
    onboardingCompleted: true,
  },
];

export function getProfile(userId: string): StudentProfile | null {
  const profiles: StudentProfile[] = JSON.parse(
    localStorage.getItem(PROFILES_STORAGE_KEY) || JSON.stringify(mockProfiles)
  );

  return profiles.find(profile => profile.personal.userId === userId) || null;
}

export function saveProfile(profile: StudentProfile): void {
  const profiles: StudentProfile[] = JSON.parse(
    localStorage.getItem(PROFILES_STORAGE_KEY) || JSON.stringify(mockProfiles)
  );

  const index = profiles.findIndex(
    currentProfile => currentProfile.personal.userId === profile.personal.userId
  );

  if (index >= 0) {
    profiles[index] = profile;
  } else {
    profiles.push(profile);
  }

  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

export function hasCompletedCompatibilityProfile(userId?: string | null): boolean {
  return Boolean(userId);
}

export function calculateCompleteness(
  profile: Partial<StudentProfile>
): StudentProfile['completeness'] {
  const personal = profile.personal || {};
  const lifestyle = profile.lifestyle || {};
  const preferences = profile.preferences || {};

  const personalFields = [
    'fullName',
    'age',
    'course',
    'institution',
    'yearOfStudy',
    'hometown',
    'bio',
    'languages',
  ];

  const personalCompleted = personalFields.filter(field => {
    const value = personal[field as keyof typeof personal];

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined && value !== null && value !== '';
  }).length;

  const personalScore = Math.round((personalCompleted / personalFields.length) * 100);

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

  const lifestyleCompleted = lifestyleFields.filter(field => {
    const value = lifestyle[field as keyof typeof lifestyle];
    return value !== undefined && value !== null && value !== '';
  }).length;

  const lifestyleScore = Math.round((lifestyleCompleted / lifestyleFields.length) * 100);

  const preferencesFields = [
    'maxBudget',
    'preferredCities',
    'maxDistanceFromUniversity',
    'moveInDate',
    'stayDuration',
    'roomType',
  ];

  const preferencesCompleted = preferencesFields.filter(field => {
    const value = preferences[field as keyof typeof preferences];

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined && value !== null && value !== '';
  }).length;

  const preferencesScore = Math.round((preferencesCompleted / preferencesFields.length) * 100);

  const overall = Math.round((personalScore + lifestyleScore + preferencesScore) / 3);

  return {
    personal: personalScore,
    lifestyle: lifestyleScore,
    preferences: preferencesScore,
    overall,
  };
}
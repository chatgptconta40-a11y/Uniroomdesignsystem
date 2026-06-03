import { StudentProfile } from '../types/profile';

export function calculateCompleteness(profile: Partial<StudentProfile>): StudentProfile['completeness'] {
  const personal = profile.personal || {};
  const lifestyle = profile.lifestyle || {};
  const preferences = profile.preferences || {};

  const hasValue = (value: unknown) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  };

  const personalFields = [
    'fullName', 'age', 'gender', 'course', 'institution',
    'yearOfStudy', 'hometown', 'bio', 'languages',
  ];

  const lifestyleFields = [
    'bedtime', 'wakeupTime', 'schedule', 'cleanliness', 'cleaningFrequency',
    'noiseTolerance', 'musicVolume', 'guestsFrequency', 'guestsAcceptance',
    'smoking', 'pets', 'cooking', 'personality', 'socialPreference',
  ];

  const preferencesFields = [
    'maxBudget', 'preferredCities', 'maxDistanceFromUniversity',
    'moveInDate', 'stayDuration', 'roomType',
  ];

  const personalScore = Math.round(
    (personalFields.filter(f => hasValue(personal[f as keyof typeof personal])).length / personalFields.length) * 100,
  );
  const lifestyleScore = Math.round(
    (lifestyleFields.filter(f => hasValue(lifestyle[f as keyof typeof lifestyle])).length / lifestyleFields.length) * 100,
  );
  const preferencesScore = Math.round(
    (preferencesFields.filter(f => hasValue(preferences[f as keyof typeof preferences])).length / preferencesFields.length) * 100,
  );
  const overall = Math.round((personalScore + lifestyleScore + preferencesScore) / 3);

  return { personal: personalScore, lifestyle: lifestyleScore, preferences: preferencesScore, overall };
}

import { supabase } from '../lib/supabase';
import { StudentProfile } from '../types/profile';
import { calculateCompleteness } from '../utils/profileCompleteness';

// ── DB row shapes (snake_case) ────────────────────────────────────────────────

interface DbProfileRow {
  full_name: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
}

interface DbPersonalProfile {
  user_id: string;
  age: number | null;
  gender: string | null;
  course: string | null;
  institution: string | null;
  year_of_study: number | null;
  hometown: string | null;
  bio: string | null;
  languages: string[] | null;
}

interface DbLifestyleProfile {
  user_id: string;
  bedtime: string | null;
  wakeup_time: string | null;
  schedule: string | null;
  cleanliness: number | null;
  cleaning_frequency: string | null;
  noise_tolerance: number | null;
  music_volume: string | null;
  guests_frequency: string | null;
  guests_acceptance: number | null;
  smoking: boolean | null;
  pets: boolean | null;
  cooking: string | null;
  personality: string | null;
  social_preference: string | null;
}

interface DbAccommodationPreferences {
  user_id: string;
  max_budget: number | null;
  preferred_cities: string[] | null;
  max_distance_from_university: number | null;
  move_in_date: string | null;
  stay_duration: number | null;
  room_type: string | null;
  amenities: Record<string, boolean> | null;
}

// ── Mapping: DB → TS ──────────────────────────────────────────────────────────

export function mapDbToStudentProfile(
  profileRow: DbProfileRow,
  userId: string,
  personal: DbPersonalProfile | null,
  lifestyle: DbLifestyleProfile | null,
  preferences: DbAccommodationPreferences | null,
): StudentProfile {
  const mapped: StudentProfile = {
    personal: {
      userId,
      fullName: profileRow.full_name,
      photoUrl: profileRow.avatar_url ?? undefined,
      age: personal?.age ?? undefined,
      gender: (personal?.gender as StudentProfile['personal']['gender']) ?? undefined,
      course: personal?.course ?? undefined,
      institution: personal?.institution ?? undefined,
      yearOfStudy: personal?.year_of_study ?? undefined,
      hometown: personal?.hometown ?? undefined,
      bio: personal?.bio ?? undefined,
      languages: personal?.languages ?? [],
    },
    lifestyle: {
      userId,
      bedtime: (lifestyle?.bedtime as StudentProfile['lifestyle']['bedtime']) ?? undefined,
      wakeupTime: (lifestyle?.wakeup_time as StudentProfile['lifestyle']['wakeupTime']) ?? undefined,
      schedule: (lifestyle?.schedule as StudentProfile['lifestyle']['schedule']) ?? undefined,
      cleanliness: lifestyle?.cleanliness ?? undefined,
      cleaningFrequency: (lifestyle?.cleaning_frequency as StudentProfile['lifestyle']['cleaningFrequency']) ?? undefined,
      noiseTolerance: lifestyle?.noise_tolerance ?? undefined,
      musicVolume: (lifestyle?.music_volume as StudentProfile['lifestyle']['musicVolume']) ?? undefined,
      guestsFrequency: (lifestyle?.guests_frequency as StudentProfile['lifestyle']['guestsFrequency']) ?? undefined,
      guestsAcceptance: lifestyle?.guests_acceptance ?? undefined,
      smoking: lifestyle?.smoking ?? undefined,
      pets: lifestyle?.pets ?? undefined,
      cooking: (lifestyle?.cooking as StudentProfile['lifestyle']['cooking']) ?? undefined,
      personality: (lifestyle?.personality as StudentProfile['lifestyle']['personality']) ?? undefined,
      socialPreference: (lifestyle?.social_preference as StudentProfile['lifestyle']['socialPreference']) ?? undefined,
    },
    preferences: {
      userId,
      maxBudget: preferences?.max_budget ?? undefined,
      preferredCities: preferences?.preferred_cities ?? [],
      maxDistanceFromUniversity: preferences?.max_distance_from_university ?? undefined,
      moveInDate: preferences?.move_in_date ? new Date(preferences.move_in_date) : undefined,
      stayDuration: preferences?.stay_duration ?? undefined,
      roomType: (preferences?.room_type as StudentProfile['preferences']['roomType']) ?? undefined,
      amenities: preferences?.amenities ?? undefined,
    },
    completeness: { personal: 0, lifestyle: 0, preferences: 0, overall: 0 },
    onboardingCompleted: profileRow.onboarding_completed,
  };

  mapped.completeness = calculateCompleteness(mapped);

  return mapped;
}

// ── Mapping: TS → DB ──────────────────────────────────────────────────────────

export function mapStudentProfileToDb(
  userId: string,
  profile: StudentProfile,
): {
  personal: DbPersonalProfile;
  lifestyle: DbLifestyleProfile;
  preferences: DbAccommodationPreferences;
} {
  const { personal, lifestyle, preferences } = profile;

  return {
    personal: {
      user_id: userId,
      age: personal.age ?? null,
      gender: personal.gender ?? null,
      course: personal.course ?? null,
      institution: personal.institution ?? null,
      year_of_study: personal.yearOfStudy ?? null,
      hometown: personal.hometown ?? null,
      bio: personal.bio ?? null,
      languages: personal.languages ?? [],
    },
    lifestyle: {
      user_id: userId,
      bedtime: lifestyle.bedtime ?? null,
      wakeup_time: lifestyle.wakeupTime ?? null,
      schedule: lifestyle.schedule ?? null,
      cleanliness: lifestyle.cleanliness ?? null,
      cleaning_frequency: lifestyle.cleaningFrequency ?? null,
      noise_tolerance: lifestyle.noiseTolerance ?? null,
      music_volume: lifestyle.musicVolume ?? null,
      guests_frequency: lifestyle.guestsFrequency ?? null,
      guests_acceptance: lifestyle.guestsAcceptance ?? null,
      smoking: lifestyle.smoking ?? null,
      pets: lifestyle.pets ?? null,
      cooking: lifestyle.cooking ?? null,
      personality: lifestyle.personality ?? null,
      social_preference: lifestyle.socialPreference ?? null,
    },
    preferences: {
      user_id: userId,
      max_budget: preferences.maxBudget ?? null,
      preferred_cities: preferences.preferredCities ?? [],
      max_distance_from_university: preferences.maxDistanceFromUniversity ?? null,
      move_in_date: preferences.moveInDate
        ? preferences.moveInDate.toISOString().split('T')[0]
        : null,
      stay_duration: preferences.stayDuration ?? null,
      room_type: preferences.roomType ?? null,
      amenities: preferences.amenities ?? null,
    },
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchStudentProfileFromDb(
  userId: string,
): Promise<StudentProfile | null> {
  if (!userId) return null;

  const [profileResult, personalResult, lifestyleResult, preferencesResult] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, avatar_url, onboarding_completed')
        .eq('id', userId)
        .single(),
      supabase
        .from('personal_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('lifestyle_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('accommodation_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

  if (profileResult.error || !profileResult.data) {
    if (profileResult.error) {
      console.error('[profilesDb] profiles fetch error', profileResult.error);
    }
    return null;
  }

  if (personalResult.error) {
    console.warn('[profilesDb] personal_profiles fetch error', personalResult.error);
  }
  if (lifestyleResult.error) {
    console.warn('[profilesDb] lifestyle_profiles fetch error', lifestyleResult.error);
  }
  if (preferencesResult.error) {
    console.warn('[profilesDb] accommodation_preferences fetch error', preferencesResult.error);
  }

  return mapDbToStudentProfile(
    profileResult.data as DbProfileRow,
    userId,
    personalResult.data ?? null,
    lifestyleResult.data ?? null,
    preferencesResult.data ?? null,
  );
}

export async function upsertStudentProfileToDb(
  userId: string,
  profile: StudentProfile,
): Promise<void> {
  if (!userId) throw new Error('[profilesDb] userId is required');

  const { personal, lifestyle, preferences } = mapStudentProfileToDb(userId, profile);
  const completeness = calculateCompleteness(profile);
  const now = new Date().toISOString();

  const [personalResult, lifestyleResult, preferencesResult] = await Promise.all([
    supabase
      .from('personal_profiles')
      .upsert({ ...personal, updated_at: now }, { onConflict: 'user_id' }),
    supabase
      .from('lifestyle_profiles')
      .upsert({ ...lifestyle, updated_at: now }, { onConflict: 'user_id' }),
    supabase
      .from('accommodation_preferences')
      .upsert({ ...preferences, updated_at: now }, { onConflict: 'user_id' }),
  ]);

  if (personalResult.error) {
    throw new Error(`[profilesDb] personal_profiles upsert failed: ${personalResult.error.message}`);
  }
  if (lifestyleResult.error) {
    throw new Error(`[profilesDb] lifestyle_profiles upsert failed: ${lifestyleResult.error.message}`);
  }
  if (preferencesResult.error) {
    throw new Error(`[profilesDb] accommodation_preferences upsert failed: ${preferencesResult.error.message}`);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: profile.personal.fullName,
      avatar_url: profile.personal.photoUrl ?? null,
      profile_completeness: completeness,
      onboarding_completed: profile.onboardingCompleted,
      updated_at: now,
    })
    .eq('id', userId);

  if (profileError) {
    throw new Error(`[profilesDb] profiles update failed: ${profileError.message}`);
  }
}

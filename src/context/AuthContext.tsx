import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType, RegisterData, UserType } from '../types/auth';
import { StudentProfile } from '../types/profile';
import { mockUsers, mockStudentProfiles, mockLandlordProfiles } from '../data/mockUsers';
import { saveProfile } from '../data/mockProfiles';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'uniroom_user';
const USERS_KEY = 'uniroom_all_users';

type DbProfile = {
  id: string;
  email: string;
  full_name: string | null;
  type: UserType;
  status?: 'active' | 'suspended' | 'blocked';
  verified?: boolean;
  onboarding_completed?: boolean;
  profile_completeness?: User['profileCompleteness'];
  created_at?: string;
};

const defaultCompleteness = {
  personal: 0,
  lifestyle: 0,
  preferences: 0,
  overall: 0,
};

function initializeStorage() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
  }
}

function mapDbProfile(profile: DbProfile): User {
  const completeness = profile.profile_completeness || defaultCompleteness;
  const isStudent = profile.type === 'student';

  return {
    id: profile.id,
    name: profile.full_name || profile.email,
    email: profile.email,
    type: profile.type,
    verified: Boolean(profile.verified),
    status: profile.status || 'active',
    onboardingCompleted: isStudent || Boolean(profile.onboarding_completed) || completeness.overall >= 80,
    profileCompleteness: completeness,
    createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
  };
}

function mapFallbackUser(user: User): User {
  return {
    ...user,
    onboardingCompleted: user.type === 'student' || Boolean(user.onboardingCompleted),
    profileCompleteness: user.profileCompleteness || {
      personal: user.type === 'student' ? 100 : 0,
      lifestyle: user.type === 'student' ? 100 : 0,
      preferences: user.type === 'student' ? 100 : 0,
      overall: user.type === 'student' ? 100 : 0,
    },
  };
}

async function fetchSupabaseProfile(userId: string, fallbackEmail?: string): Promise<User | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,full_name,type,status,verified,onboarding_completed,profile_completeness,created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[UniRoom] Falha ao carregar perfil Supabase:', error.message);
    return null;
  }

  if (data) return mapDbProfile(data as DbProfile);

  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user;
  if (!authUser) return null;

  return {
    id: authUser.id,
    name: authUser.user_metadata?.full_name || fallbackEmail || authUser.email || 'Utilizador',
    email: authUser.email || fallbackEmail || '',
    type: (authUser.user_metadata?.type as UserType) || 'student',
    verified: Boolean(authUser.email_confirmed_at),
    status: 'active',
    onboardingCompleted: ((authUser.user_metadata?.type as UserType) || 'student') === 'student',
    profileCompleteness: defaultCompleteness,
    createdAt: authUser.created_at ? new Date(authUser.created_at) : new Date(),
  };
}

function persistFallbackUser(user: User) {
  const normalized = mapFallbackUser(user);
  setStoredUser(normalized);
  return normalized;
}

function setStoredUser(user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      initializeStorage();

      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;

        if (sessionUser) {
          const profile = await fetchSupabaseProfile(sessionUser.id, sessionUser.email);
          if (mounted && profile) setUser(profile);
        }

        if (mounted) setLoading(false);
        return;
      }

      const storedUser = localStorage.getItem(STORAGE_KEY);
      if (storedUser && mounted) {
        setUser(mapFallbackUser(JSON.parse(storedUser)));
      }
      if (mounted) setLoading(false);
    }

    loadSession();

    if (!supabase) return () => { mounted = false; };

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const profile = await fetchSupabaseProfile(session.user.id, session.user.email);
      if (profile) setUser(profile);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        setLoading(false);
        return { success: false, error: 'Email ou palavra-passe incorretos' };
      }

      const profile = await fetchSupabaseProfile(data.user.id, data.user.email || email);
      if (!profile) {
        setLoading(false);
        return { success: false, error: 'Não foi possível carregar o perfil desta conta.' };
      }

      setUser(profile);
      setLoading(false);
      return { success: true, user: profile };
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    const allUsers: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const foundUser = allUsers.find(u => u.email === email && u.password === password);

    if (foundUser) {
      const normalized = persistFallbackUser(foundUser);
      setUser(normalized);
      setLoading(false);
      return { success: true, user: normalized };
    }

    setLoading(false);
    return { success: false, error: 'Email ou palavra-passe incorretos' };
  };

  const register = async (data: RegisterData) => {
    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            type: data.type,
          },
        },
      });

      if (error || !authData.user) {
        setLoading(false);
        return { success: false, error: error?.message || 'Erro ao criar conta' };
      }

      await supabase
        .from('profiles')
        .update({
          full_name: data.name,
          type: data.type,
          onboarding_completed: data.type !== 'student',
        })
        .eq('id', authData.user.id);

      const newUser = await fetchSupabaseProfile(authData.user.id, data.email);
      if (!newUser) {
        setLoading(false);
        return { success: false, error: 'Conta criada, mas não foi possível carregar o perfil.' };
      }

      setUser(newUser);
      setLoading(false);
      return { success: true, user: newUser };
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    const allUsers: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

    if (allUsers.some(u => u.email === data.email)) {
      setLoading(false);
      return { success: false, error: 'Este email já está registado' };
    }

    const newUser: User = {
      id: String(allUsers.length + 1),
      name: data.name,
      email: data.email,
      password: data.password,
      type: data.type,
      verified: false,
      onboardingCompleted: data.type !== 'student',
      profileCompleteness: defaultCompleteness,
      createdAt: new Date(),
    };

    allUsers.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));

    if (data.type === 'student') {
      mockStudentProfiles.push({ userId: newUser.id });
    } else if (data.type === 'landlord') {
      mockLandlordProfiles.push({ userId: newUser.id });
    }

    const normalized = persistFallbackUser(newUser);
    setUser(normalized);
    setLoading(false);

    return { success: true, user: normalized };
  };

  const saveStudentProfile = async (profile: StudentProfile) => {
    if (!user) {
      return { success: false, error: 'Sessão inválida. Volta a iniciar sessão.' };
    }

    const profileToSave: StudentProfile = {
      ...profile,
      personal: { ...profile.personal, userId: user.id },
      lifestyle: { ...profile.lifestyle, userId: user.id },
      preferences: { ...profile.preferences, userId: user.id },
      onboardingCompleted: true,
    };

    if (isSupabaseConfigured && supabase) {
      const personalPayload = {
        user_id: user.id,
        photo_url: profileToSave.personal.photoUrl,
        full_name: profileToSave.personal.fullName,
        age: profileToSave.personal.age,
        gender: profileToSave.personal.gender,
        course: profileToSave.personal.course,
        institution: profileToSave.personal.institution,
        year_of_study: profileToSave.personal.yearOfStudy,
        hometown: profileToSave.personal.hometown,
        bio: profileToSave.personal.bio,
        languages: profileToSave.personal.languages || [],
      };

      const lifestylePayload = {
        user_id: user.id,
        bedtime: profileToSave.lifestyle.bedtime,
        wakeup_time: profileToSave.lifestyle.wakeupTime,
        schedule: profileToSave.lifestyle.schedule,
        cleanliness: profileToSave.lifestyle.cleanliness,
        cleaning_frequency: profileToSave.lifestyle.cleaningFrequency,
        noise_tolerance: profileToSave.lifestyle.noiseTolerance,
        music_volume: profileToSave.lifestyle.musicVolume,
        guests_frequency: profileToSave.lifestyle.guestsFrequency,
        guests_acceptance: profileToSave.lifestyle.guestsAcceptance,
        smoking: profileToSave.lifestyle.smoking,
        pets: profileToSave.lifestyle.pets,
        cooking: profileToSave.lifestyle.cooking,
        personality: profileToSave.lifestyle.personality,
        social_preference: profileToSave.lifestyle.socialPreference,
      };

      const preferencesPayload = {
        user_id: user.id,
        max_budget: profileToSave.preferences.maxBudget,
        preferred_cities: profileToSave.preferences.preferredCities || [],
        max_distance_from_university: profileToSave.preferences.maxDistanceFromUniversity,
        move_in_date: profileToSave.preferences.moveInDate
          ? new Date(profileToSave.preferences.moveInDate).toISOString().slice(0, 10)
          : null,
        stay_duration: profileToSave.preferences.stayDuration,
        room_type: profileToSave.preferences.roomType,
        amenities: profileToSave.preferences.amenities || {},
      };

      const operations = await Promise.all([
        supabase.from('personal_profiles').upsert(personalPayload, { onConflict: 'user_id' }),
        supabase.from('lifestyle_profiles').upsert(lifestylePayload, { onConflict: 'user_id' }),
        supabase.from('accommodation_preferences').upsert(preferencesPayload, { onConflict: 'user_id' }),
        supabase
          .from('profiles')
          .update({
            full_name: profileToSave.personal.fullName || user.name,
            onboarding_completed: true,
            profile_completeness: profileToSave.completeness,
          })
          .eq('id', user.id),
      ]);

      const failed = operations.find(result => result.error);
      if (failed?.error) {
        return { success: false, error: failed.error.message };
      }
    } else {
      saveProfile(profileToSave);
    }

    const updatedUser: User = {
      ...user,
      name: profileToSave.personal.fullName || user.name,
      onboardingCompleted: true,
      profileCompleteness: profileToSave.completeness,
    };

    setUser(updatedUser);
    setStoredUser(updatedUser);

    return { success: true };
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        saveStudentProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType, RegisterData, UserType } from '../types/auth';
import { StudentProfile } from '../types/profile';
import { getProfile, saveProfile } from '../data/mockProfiles';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type DbProfile = {
  id: string;
  email: string;
  full_name: string | null;
  type: UserType;
  status?: 'active' | 'suspended' | 'blocked';
  verified?: boolean;
  onboarding_completed?: boolean;
  created_at?: string;
};

const defaultCompleteness = {
  personal: 0,
  lifestyle: 0,
  preferences: 0,
  overall: 0,
};

function translateAuthError(message: string | undefined): string {
  if (!message) return 'Erro de autenticação.';
  const m = message.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Email ou palavra-passe incorretos.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirma o email antes de iniciar sessão.';
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'Este email já está registado.';
  }
  if (m.includes('password should be')) {
    return 'A palavra-passe é demasiado fraca.';
  }
  return message;
}

function getLocalProfileSnapshot(userId: string) {
  const profile = getProfile(userId);
  return {
    profileCompleteness: profile?.completeness || defaultCompleteness,
    profileName: profile?.personal?.fullName,
  };
}

function mapDbProfile(row: DbProfile): User {
  const cache = getLocalProfileSnapshot(row.id);
  return {
    id: row.id,
    name: cache.profileName || row.full_name || row.email,
    email: row.email,
    type: row.type,
    verified: Boolean(row.verified),
    status: row.status || 'active',
    onboardingCompleted: Boolean(row.onboarding_completed),
    profileCompleteness: cache.profileCompleteness,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  };
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout ${ms}ms: ${label}`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

async function fetchProfileById(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  console.log('[AUTH] fetchProfileById start', userId);
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('profiles')
        .select('id,email,full_name,type,status,verified,onboarding_completed,created_at')
        .eq('id', userId)
        .maybeSingle(),
      5000,
      'profiles select',
    );

    if (error) {
      console.error('[UniRoom] Profile fetch error:', error.message);
      return null;
    }
    console.log('[AUTH] fetchProfileById result', data ? 'row' : 'null');
    return data ? mapDbProfile(data as DbProfile) : null;
  } catch (err) {
    console.error('[AUTH] fetchProfileById failed:', err);
    return null;
  }
}

async function upsertProfileRow(userId: string, data: RegisterData): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: data.email,
        full_name: data.name,
        type: data.type,
        onboarding_completed: data.type !== 'student',
      },
      { onConflict: 'id' },
    );
  if (error) throw new Error(`Erro ao gravar perfil: ${error.message}`);
}

async function syncStudentProfileToDb(user: User, profile: StudentProfile): Promise<void> {
  if (!supabase) return;

  const personalPayload = {
    user_id: user.id,
    photo_url: profile.personal.photoUrl,
    full_name: profile.personal.fullName,
    age: profile.personal.age,
    gender: profile.personal.gender,
    course: profile.personal.course,
    institution: profile.personal.institution,
    year_of_study: profile.personal.yearOfStudy,
    hometown: profile.personal.hometown,
    bio: profile.personal.bio,
    languages: profile.personal.languages || [],
  };

  const lifestylePayload = {
    user_id: user.id,
    bedtime: profile.lifestyle.bedtime,
    wakeup_time: profile.lifestyle.wakeupTime,
    schedule: profile.lifestyle.schedule,
    cleanliness: profile.lifestyle.cleanliness,
    cleaning_frequency: profile.lifestyle.cleaningFrequency,
    noise_tolerance: profile.lifestyle.noiseTolerance,
    music_volume: profile.lifestyle.musicVolume,
    guests_frequency: profile.lifestyle.guestsFrequency,
    guests_acceptance: profile.lifestyle.guestsAcceptance,
    smoking: profile.lifestyle.smoking,
    pets: profile.lifestyle.pets,
    cooking: profile.lifestyle.cooking,
    personality: profile.lifestyle.personality,
    social_preference: profile.lifestyle.socialPreference,
  };

  const preferencesPayload = {
    user_id: user.id,
    max_budget: profile.preferences.maxBudget,
    preferred_cities: profile.preferences.preferredCities || [],
    max_distance_from_university: profile.preferences.maxDistanceFromUniversity,
    move_in_date: profile.preferences.moveInDate
      ? new Date(profile.preferences.moveInDate).toISOString().slice(0, 10)
      : null,
    stay_duration: profile.preferences.stayDuration,
    room_type: profile.preferences.roomType,
    amenities: profile.preferences.amenities || {},
  };

  const results = await Promise.allSettled([
    supabase.from('personal_profiles').upsert(personalPayload, { onConflict: 'user_id' }),
    supabase.from('lifestyle_profiles').upsert(lifestylePayload, { onConflict: 'user_id' }),
    supabase.from('accommodation_preferences').upsert(preferencesPayload, { onConflict: 'user_id' }),
    supabase
      .from('profiles')
      .update({
        full_name: profile.personal.fullName || user.name,
        onboarding_completed: true,
      })
      .eq('id', user.id),
  ]);

  const failed = results.find(r => r.status === 'rejected');
  if (failed && failed.status === 'rejected') {
    throw new Error(`Erro ao sincronizar perfil: ${failed.reason}`);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.error('[UniRoom] Supabase não está configurado. A aplicação requer Supabase.');
      setUser(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        if (sessionUser) {
          const profile = await fetchProfileById(sessionUser.id);
          if (mounted) setUser(profile);
        } else if (mounted) {
          setUser(null);
        }
      } catch (err) {
        console.error('[UniRoom] Falha ao carregar sessão Supabase:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log('[AUTH] onAuthStateChange', event, 'session user id:', session?.user?.id);
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        return;
      }
      const profile = await fetchProfileById(session.user.id);
      if (mounted) setUser(profile);
    });

    return () => {
      mounted = false;
      try {
        listener.subscription.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, []);

  const login: AuthContextType['login'] = async (email, password) => {
    console.log('[LOGIN] clicked');
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não está configurado.' };
    }
    setLoading(true);
    try {
      console.log('[LOGIN] calling signInWithPassword');
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        }),
        8000,
        'signInWithPassword',
      );
      console.log('[LOGIN] signIn result', { hasUser: !!data?.user, error: error?.message });
      if (error || !data.user) {
        return { success: false, error: translateAuthError(error?.message) };
      }
      console.log('[LOGIN] fetching profile for', data.user.id);
      const profile = await fetchProfileById(data.user.id);
      console.log('[LOGIN] profile result', profile ? 'ok' : 'missing');
      if (!profile) {
        return { success: false, error: 'Sessão iniciada mas o teu perfil não existe em public.profiles. Cria a conta via Register ou insere a row manualmente.' };
      }
      setUser(profile);
      return { success: true, user: profile };
    } catch (err) {
      console.error('[LOGIN] failed:', err);
      const msg = err instanceof Error ? err.message : 'Erro inesperado.';
      return { success: false, error: msg };
    } finally {
      console.log('[LOGIN] set loading false');
      setLoading(false);
    }
  };

  const register: AuthContextType['register'] = async (data) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não está configurado.' };
    }
    setLoading(true);
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const { data: signUp, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: { full_name: data.name, type: data.type },
        },
      });
      if (error || !signUp.user) {
        return { success: false, error: translateAuthError(error?.message) };
      }
      try {
        await upsertProfileRow(signUp.user.id, { ...data, email: normalizedEmail });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao gravar perfil.';
        return { success: false, error: msg };
      }
      const profile = await fetchProfileById(signUp.user.id);
      if (!profile) {
        return { success: false, error: 'Conta criada mas perfil não foi lido.' };
      }
      setUser(profile);
      return { success: true, user: profile };
    } finally {
      setLoading(false);
    }
  };

  const saveStudentProfile: AuthContextType['saveStudentProfile'] = async (profile) => {
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
    try {
      await syncStudentProfileToDb(user, profileToSave);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao sincronizar perfil.';
      return { success: false, error: msg };
    }
    saveProfile(profileToSave);
    setUser({
      ...user,
      name: profileToSave.personal.fullName || user.name,
      onboardingCompleted: true,
      profileCompleteness: profileToSave.completeness,
    });
    return { success: true };
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('[UniRoom] Erro no signOut Supabase:', err);
      }
    }
    setUser(null);
    try {
      window.dispatchEvent(new Event('uniroom:auth-logout'));
    } catch {
      // ignore
    }
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

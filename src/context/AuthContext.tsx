import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType, RegisterData, UserType } from '../types/auth';
import { StudentProfile } from '../types/profile';
import { getProfile, saveProfile } from '../data/mockProfiles';
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
  created_at?: string;
};

const defaultCompleteness = {
  personal: 0,
  lifestyle: 0,
  preferences: 0,
  overall: 0,
};

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function initializeStorage() {
  /*
    Sem mock users.
    A lista local só nasce vazia e vai sendo preenchida por registo/login real.
  */
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([]));
  }
}

function getLocalProfileState(userId: string) {
  const profile = getProfile(userId);

  return {
    onboardingCompleted: Boolean(profile?.onboardingCompleted),
    profileCompleteness: profile?.completeness || defaultCompleteness,
    profileName: profile?.personal?.fullName,
  };
}

function mapDbProfile(profile: DbProfile): User {
  const localProfile = getLocalProfileState(profile.id);
  const onboardingDone = Boolean(profile.onboarding_completed || localProfile.onboardingCompleted);

  return {
    id: profile.id,
    name: localProfile.profileName || profile.full_name || profile.email,
    email: profile.email,
    type: profile.type,
    verified: Boolean(profile.verified),
    status: profile.status || 'active',
    onboardingCompleted: onboardingDone,
    profileCompleteness: localProfile.profileCompleteness,
    createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
  };
}

function mapStoredUser(user: User): User {
  const localProfile = getLocalProfileState(user.id);

  return {
    ...user,
    name: localProfile.profileName || user.name,
    onboardingCompleted: Boolean(user.onboardingCompleted || localProfile.onboardingCompleted),
    profileCompleteness: localProfile.profileCompleteness || user.profileCompleteness || defaultCompleteness,
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
  };
}

function setStoredUser(user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function persistLocalUser(user: User) {
  const normalized = mapStoredUser(user);
  setStoredUser(normalized);
  updateLocalUserList(normalized);
  return normalized;
}

function updateLocalUserList(user: User): void {
  const allUsers = safeParse<User[]>(localStorage.getItem(USERS_KEY), []);
  const existingIndex = allUsers.findIndex(item => item.id === user.id || item.email === user.email);

  if (existingIndex >= 0) {
    allUsers[existingIndex] = {
      ...allUsers[existingIndex],
      ...user,
      createdAt: user.createdAt,
    };
  } else {
    allUsers.push(user);
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
}

async function fetchSupabaseProfile(userId: string, fallbackEmail?: string): Promise<User | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,full_name,type,status,verified,onboarding_completed,created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[UniRoom] Falha ao carregar perfil Supabase:', error.message);
    return null;
  }

  if (data) {
    return mapDbProfile(data as DbProfile);
  }

  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user;

  if (!authUser) return null;

  const localProfile = getLocalProfileState(authUser.id);
  const type = (authUser.user_metadata?.type as UserType) || 'student';

  return {
    id: authUser.id,
    name: localProfile.profileName || authUser.user_metadata?.full_name || fallbackEmail || authUser.email || 'Utilizador',
    email: authUser.email || fallbackEmail || '',
    type,
    verified: Boolean(authUser.email_confirmed_at),
    status: 'active',
    onboardingCompleted: Boolean(localProfile.onboardingCompleted || type !== 'student'),
    profileCompleteness: localProfile.profileCompleteness,
    createdAt: authUser.created_at ? new Date(authUser.created_at) : new Date(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      initializeStorage();

      const storedUser = localStorage.getItem(STORAGE_KEY);

      /*
        LocalStorage primeiro.
      */
      if (storedUser && mounted) {
        setUser(mapStoredUser(JSON.parse(storedUser)));
      }

      /*
        Supabase só tenta hidratar por cima.
        Se falhar, a app continua com localStorage.
      */
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;

        if (sessionUser) {
          const profile = await fetchSupabaseProfile(sessionUser.id, sessionUser.email);

          if (mounted && profile) {
            const normalized = persistLocalUser(profile);
            setUser(normalized);
          }
        }
      }

      if (mounted) setLoading(false);
    }

    loadSession();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const profile = await fetchSupabaseProfile(session.user.id, session.user.email);

      if (profile) {
        const normalized = persistLocalUser(profile);
        setUser(normalized);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);

    /*
      Primeiro tenta login Supabase, porque contas reais vêm daí.
      Mas se falhar, tenta utilizadores criados localmente.
    */
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (!error && data.user) {
        const profile = await fetchSupabaseProfile(data.user.id, data.user.email || email);

        if (profile) {
          const normalized = persistLocalUser(profile);
          setUser(normalized);
          setLoading(false);

          return { success: true, user: normalized };
        }
      }
    }

    const allUsers = safeParse<User[]>(localStorage.getItem(USERS_KEY), []);
    const foundUser = allUsers.find(item => item.email === email && item.password === password);

    if (foundUser) {
      const normalized = persistLocalUser(foundUser);
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

      if (!error && authData.user) {
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: data.email,
            full_name: data.name,
            type: data.type,
            onboarding_completed: data.type !== 'student',
          }, { onConflict: 'id' });

        const newUser = await fetchSupabaseProfile(authData.user.id, data.email);

        if (newUser) {
          const storedUser: User = {
            ...newUser,
            password: data.password,
          };

          const normalized = persistLocalUser(storedUser);
          setUser(normalized);
          setLoading(false);

          return { success: true, user: normalized };
        }
      }

      if (error) {
        console.warn('[UniRoom] Registo Supabase falhou, a tentar modo local:', error.message);
      }
    }

    const allUsers = safeParse<User[]>(localStorage.getItem(USERS_KEY), []);

    if (allUsers.some(item => item.email === data.email)) {
      setLoading(false);
      return { success: false, error: 'Este email já está registado' };
    }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: data.name,
      email: data.email,
      password: data.password,
      type: data.type,
      verified: false,
      status: 'active',
      onboardingCompleted: data.type !== 'student',
      profileCompleteness: defaultCompleteness,
      createdAt: new Date(),
    };

    const normalized = persistLocalUser(newUser);
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

    /*
      Guardar sempre em localStorage primeiro.
    */
    saveProfile(profileToSave);

    /*
      Supabase é sincronização em background.
      Falhar aqui não bloqueia a app nem apaga dados locais.
    */
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

      Promise.all([
        supabase.from('personal_profiles').upsert(personalPayload, { onConflict: 'user_id' }),
        supabase.from('lifestyle_profiles').upsert(lifestylePayload, { onConflict: 'user_id' }),
        supabase.from('accommodation_preferences').upsert(preferencesPayload, { onConflict: 'user_id' }),
        supabase
          .from('profiles')
          .update({
            full_name: profileToSave.personal.fullName || user.name,
            onboarding_completed: true,
          })
          .eq('id', user.id),
      ]).then(results => {
        const failed = results.find(result => result.error);
        if (failed?.error) {
          console.warn('[UniRoom] Perfil guardado localmente, mas Supabase falhou:', failed.error.message);
        }
      });
    }

    const updatedUser: User = {
      ...user,
      name: profileToSave.personal.fullName || user.name,
      onboardingCompleted: true,
      profileCompleteness: profileToSave.completeness,
    };

    const normalized = persistLocalUser(updatedUser);
    setUser(normalized);

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

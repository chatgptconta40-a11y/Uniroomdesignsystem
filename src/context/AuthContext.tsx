import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType, RegisterData, UserType } from '../types/auth';
import { StudentProfile } from '../types/profile';
import { getProfile, saveProfile } from '../data/mockProfiles';
import { migrateActiveHomeByEmail } from '../data/mockApplications';
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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => {
      window.setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}

function initializeStorage() {
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

function persistLocalUser(user: User) {
  const normalized = mapStoredUser(user);
  setStoredUser(normalized);
  updateLocalUserList(normalized);
  return normalized;
}

async function safeGetSupabaseSession() {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const result = await withTimeout(
      supabase.auth.getSession(),
      1200,
      { data: { session: null } } as any,
    );

    return result.data.session ?? null;
  } catch {
    return null;
  }
}

async function safeGetSupabaseAuthUser() {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const result = await withTimeout(
      supabase.auth.getUser(),
      1200,
      { data: { user: null } } as any,
    );

    return result.data.user ?? null;
  } catch {
    return null;
  }
}

async function fetchSupabaseProfile(userId: string, fallbackEmail?: string): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,full_name,type,status,verified,onboarding_completed,created_at')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return mapDbProfile(data as DbProfile);
    }

    const authUser = await safeGetSupabaseAuthUser();

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
  } catch {
    return null;
  }
}

async function safeSignIn(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null as any, error: null as any };
  }

  try {
    const result = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      1800,
      { data: { user: null }, error: new Error('Supabase demorou a responder') } as any,
    );

    return { user: result.data.user, error: result.error };
  } catch {
    return { user: null, error: new Error('Supabase indisponível') };
  }
}

async function safeSignUp(data: RegisterData) {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null as any, error: null as any };
  }

  try {
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

    return { user: authData.user, error };
  } catch {
    return { user: null, error: new Error('Supabase indisponível') };
  }
}

async function safeUpsertProfile(userId: string, data: RegisterData) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: data.email,
        full_name: data.name,
        type: data.type,
        onboarding_completed: data.type !== 'student',
      }, { onConflict: 'id' });
  } catch {
    // Ambiente Make pode bloquear chamadas externas. LocalStorage continua.
  }
}

async function safeSyncStudentProfile(user: User, profileToSave: StudentProfile) {
  if (!isSupabaseConfigured || !supabase) return;

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

  try {
    await Promise.allSettled([
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
    ]);
  } catch {
    // Ambiente Make pode bloquear chamadas externas. Perfil já ficou em localStorage.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      initializeStorage();

      const storedUser = localStorage.getItem(STORAGE_KEY);

      if (storedUser && mounted) {
        setUser(mapStoredUser(JSON.parse(storedUser)));
      }

      const session = await safeGetSupabaseSession();
      const sessionUser = session?.user;

      if (sessionUser) {
        // If the stored local user has the same email, preserve their local ID.
        // Never let the Supabase UUID overwrite a local ID that already has data.
        const storedParsed = storedUser ? safeParse<User>(storedUser, null as any) : null;
        const sameEmail = storedParsed &&
          String(storedParsed.email).toLowerCase() === String(sessionUser.email ?? '').toLowerCase();

        if (!sameEmail) {
          const profile = await fetchSupabaseProfile(sessionUser.id, sessionUser.email);

          if (mounted && profile) {
            const normalized = persistLocalUser(profile);
            setUser(normalized);
          }
        }
      }

      if (mounted) setLoading(false);
    }

    void loadSession();

    if (!isSupabaseConfigured || !supabase) {
      return () => {
        mounted = false;
      };
    }

    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        try {
          if (event === 'SIGNED_OUT' || !session?.user) {
            setUser(null);
            localStorage.removeItem(STORAGE_KEY);
            return;
          }

          // Preserve local ID: if the current stored user has the same email
          // but a different ID, do NOT let Supabase overwrite the local ID.
          const storedRaw = localStorage.getItem(STORAGE_KEY);
          const storedParsed = storedRaw ? safeParse<User>(storedRaw, null as any) : null;
          const sameEmailDiffId = storedParsed &&
            String(storedParsed.email).toLowerCase() === String(session.user.email ?? '').toLowerCase() &&
            storedParsed.id !== session.user.id;

          if (sameEmailDiffId) return;

          const profile = await fetchSupabaseProfile(session.user.id, session.user.email);

          if (profile) {
            const normalized = persistLocalUser(profile);
            setUser(normalized);
          }
        } catch {
          // Auth listener nunca deve partir a app.
        }
      });

      subscription = listener.subscription;
    } catch {
      subscription = null;
    }

    return () => {
      mounted = false;

      try {
        subscription?.unsubscribe();
      } catch {
        // Ignorar falha do listener.
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const allUsers = safeParse<User[]>(localStorage.getItem(USERS_KEY), []);
    const foundUser = allUsers.find(item =>
      String(item.email).toLowerCase() === normalizedEmail &&
      item.password === password,
    );

    if (foundUser) {
      const normalized = persistLocalUser(foundUser);
      setUser(normalized);
      setLoading(false);

      // Recover data that may have been stored under a different ID in past sessions.
      migrateActiveHomeByEmail(normalizedEmail, normalized.id);

      // Background Supabase sign-in intentionally removed: it triggers onAuthStateChange
      // with a Supabase UUID that would overwrite the local ID and orphan stored data.
      return { success: true, user: normalized };
    }

    const supaLogin = await safeSignIn(normalizedEmail, password);

    if (!supaLogin.error && supaLogin.user) {
      const profile = await fetchSupabaseProfile(supaLogin.user.id, supaLogin.user.email || normalizedEmail);

      if (profile) {
        const storedUser: User = {
          ...profile,
          password,
        };

        const normalized = persistLocalUser(storedUser);
        setUser(normalized);
        setLoading(false);

        migrateActiveHomeByEmail(normalizedEmail, normalized.id);

        return { success: true, user: normalized };
      }
    }

    setLoading(false);
    return { success: false, error: 'Email ou palavra-passe incorretos' };
  };

  const register = async (data: RegisterData) => {
    setLoading(true);

    const supaRegister = await safeSignUp(data);

    if (!supaRegister.error && supaRegister.user) {
      await safeUpsertProfile(supaRegister.user.id, data);

      const newUser = await fetchSupabaseProfile(supaRegister.user.id, data.email);

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

    saveProfile(profileToSave);

    void safeSyncStudentProfile(user, profileToSave);

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
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);

    try {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: null }));
      window.dispatchEvent(new Event('uniroom:auth-logout'));
    } catch {
      // Ignorar em ambientes que não suportem StorageEvent.
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Mesmo que Supabase falhe, a sessão local já terminou.
      }
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

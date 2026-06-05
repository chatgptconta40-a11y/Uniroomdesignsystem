import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType, RegisterData, UserType } from '../types/auth';
import { StudentProfile } from '../types/profile';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { upsertStudentProfileToDb } from '../db/profilesDb';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type DbProfile = {
  id: string;
  email: string;
  full_name: string | null;
  type: UserType;
  status?: 'active' | 'suspended' | 'blocked';
  verified?: boolean;
  onboarding_completed?: boolean;
  profile_completeness?: {
    personal: number;
    lifestyle: number;
    preferences: number;
    overall: number;
  } | null;
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

function mapDbProfile(row: DbProfile): User {
  return {
    id: row.id,
    name: row.full_name || row.email,
    email: row.email,
    type: row.type,
    verified: Boolean(row.verified),
    status: row.status || 'active',
    onboardingCompleted: Boolean(row.onboarding_completed),
    profileCompleteness: row.profile_completeness || defaultCompleteness,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  };
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout ${ms}ms: ${label}`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

function isTransientAuthError(message?: string): boolean {
  if (!message) return false;
  return /statement timeout|canceling statement|failed to fetch|networkerror|load failed|connection/i.test(message);
}

async function fetchProfileById(userId: string, maxAttempts = 2): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const timeoutMs = 5000;
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('id,email,full_name,type,status,verified,onboarding_completed,profile_completeness,created_at')
          .eq('id', userId)
          .maybeSingle(),
        timeoutMs,
        'profiles select',
      );
      if (error) {
        if (/column .*verified.* does not exist/i.test(error.message)) {
          const fallback = await withTimeout(
            supabase
              .from('profiles')
              .select('id,email,full_name,type,status,onboarding_completed,profile_completeness,created_at')
              .eq('id', userId)
              .maybeSingle(),
            timeoutMs,
            'profiles select (no verified)',
          );
          if (fallback.error) {
            console.error('[UniRoom] Profile fetch error:', fallback.error.message);
            return null;
          }
          return fallback.data ? mapDbProfile(fallback.data as DbProfile) : null;
        }
        if (isTransientAuthError(error.message) && attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 300));
          continue;
        }
        console.error('[UniRoom] Profile fetch error:', error.message);
        return null;
      }
      return data ? mapDbProfile(data as DbProfile) : null;
    } catch (err) {
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 300));
        continue;
      }
      console.error('[AUTH] fetchProfileById failed:', err);
      return null;
    }
  }
  return null;
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
    let initialDone = false;

    const markInitialDone = () => {
      if (!initialDone) {
        initialDone = true;
        if (mounted) setLoading(false);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        markInitialDone();
        return;
      }
      // Defer Supabase calls outside the auth callback to avoid the gotrue lock deadlock.
      const uid = session.user.id;
      setTimeout(() => {
        if (!mounted) return;
        fetchProfileById(uid).then(profile => {
          if (mounted) setUser(profile);
          markInitialDone();
        });
      }, 0);
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
        45000,
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
      const raw = err instanceof Error ? err.message : 'Erro inesperado.';
      const msg = raw.toLowerCase().includes('timeout')
        ? 'A ligação ao Supabase demorou demasiado. Tenta novamente.'
        : translateAuthError(raw);
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
      // Profile row may take a moment to be readable after upsert — retry briefly.
      let profile: User | null = null;
      for (let i = 0; i < 3; i++) {
        profile = await fetchProfileById(signUp.user.id);
        if (profile) break;
        if (i < 2) await new Promise(r => setTimeout(r, 700));
      }
      if (!profile) {
        return { success: false, error: 'Conta criada mas não foi possível carregar o perfil. Tenta iniciar sessão.' };
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
      await upsertStudentProfileToDb(user.id, profileToSave);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao sincronizar perfil.';
      return { success: false, error: msg };
    }
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

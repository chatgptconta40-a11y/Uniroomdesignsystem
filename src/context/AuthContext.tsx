import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterData } from '../types/auth';
import { supabase } from '../lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const SERVER = `https://${projectId}.supabase.co/functions/v1/make-server-08c694dc`;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toUser(profile: Record<string, unknown>): User {
  return {
    id: profile.id as string,
    name: profile.full_name as string,
    email: profile.email as string,
    type: profile.type as 'student' | 'landlord' | 'admin',
    verified: Boolean(profile.verified),
    onboardingCompleted: Boolean(profile.onboarding_completed),
    createdAt: new Date(profile.created_at as string),
  };
}

async function fetchProfileFromServer(accessToken: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${SERVER}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': publicAnonKey,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      console.log(`fetchProfile error: ${res.status} ${await res.text()}`);
      return null;
    }
    const { profile } = await res.json();
    return profile;
  } catch (err) {
    console.log(`fetchProfile network error: ${err}`);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        const profile = await fetchProfileFromServer(session.access_token);
        if (mounted) setUser(profile ? toUser(profile) : null);
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') setUser(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { success: false, error: 'Email ou palavra-passe incorretos' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return { success: false, error: 'Erro ao iniciar sessão' };
    }

    const profile = await fetchProfileFromServer(session.access_token);
    if (!profile) {
      setLoading(false);
      return { success: false, error: 'Erro ao carregar perfil' };
    }

    const mappedUser = toUser(profile);
    setUser(mappedUser);
    setLoading(false);
    return { success: true, user: mappedUser };
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email, password: data.password, name: data.name, type: data.type }),
      });

      const rawText = await res.text();
      let json: any = {};
      try { json = rawText ? JSON.parse(rawText) : {}; } catch { /* non-JSON response */ }

      if (!res.ok) {
        console.log(`Register failed: ${res.status} ${rawText}`);
        setLoading(false);
        const msg = json.error === 'User already registered'
          ? 'Este email já está registado'
          : json.error || `Erro ao criar conta (${res.status})`;
        return { success: false, error: msg };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        setLoading(false);
        return { success: false, error: 'Conta criada, mas erro ao entrar automaticamente' };
      }

      const mappedUser = toUser(json.profile);
      setUser(mappedUser);
      setLoading(false);
      return { success: true, user: mappedUser };
    } catch (err) {
      console.log(`Register error: ${err}`);
      setLoading(false);
      return { success: false, error: 'Erro ao criar conta' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const saveStudentProfile = async (profile: object, completeness: object): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      await fetch(`${SERVER}/auth/onboarding`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': publicAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentProfile: profile, completeness }),
      });
      setUser(prev => prev ? { ...prev, onboardingCompleted: true } : prev);
    } catch (err) {
      console.log(`saveStudentProfile error: ${err}`);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      saveStudentProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
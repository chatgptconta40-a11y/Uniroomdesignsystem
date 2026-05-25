import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterData } from '../types/auth';
import { mockUsers, mockCredentials, mockStudentProfiles, mockLandlordProfiles } from '../data/mockUsers';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'uniroom_user';
const ALL_USERS_KEY = 'uniroom_all_users';
const CREDENTIALS_KEY = 'uniroom_credentials';

const initializeStorage = () => {
  if (!localStorage.getItem(ALL_USERS_KEY)) {
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem(CREDENTIALS_KEY)) {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(mockCredentials));
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeStorage();
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored) as User);
      } catch {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const credentials = JSON.parse(
      localStorage.getItem(CREDENTIALS_KEY) || '[]',
    ) as { id: string; email: string; password: string }[];

    const match = credentials.find(
      (c) => c.email === email && c.password === password,
    );

    if (!match) {
      setLoading(false);
      return { success: false, error: 'Email ou palavra-passe incorretos' };
    }

    const allUsers = JSON.parse(
      localStorage.getItem(ALL_USERS_KEY) || '[]',
    ) as User[];

    const foundUser = allUsers.find((u) => u.id === match.id);

    if (!foundUser) {
      setLoading(false);
      return { success: false, error: 'Utilizador não encontrado' };
    }

    setUser(foundUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));
    setLoading(false);
    return { success: true };
  };

  const register = async (
    data: RegisterData,
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const allUsers = JSON.parse(
      localStorage.getItem(ALL_USERS_KEY) || '[]',
    ) as User[];

    const credentials = JSON.parse(
      localStorage.getItem(CREDENTIALS_KEY) || '[]',
    ) as { id: string; email: string; password: string }[];

    if (allUsers.some((u) => u.email === data.email)) {
      setLoading(false);
      return { success: false, error: 'Este email já está registado' };
    }

    const newId = String(Date.now());

    const newUser: User = {
      id: newId,
      name: data.name,
      email: data.email,
      type: data.type,
      verified: false,
      createdAt: new Date(),
    };

    allUsers.push(newUser);
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers));

    credentials.push({ id: newId, email: data.email, password: data.password });
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));

    if (data.type === 'student') {
      mockStudentProfiles.push({ userId: newId });
    } else if (data.type === 'landlord') {
      mockLandlordProfiles.push({ userId: newId });
    }

    setUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    setLoading(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
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
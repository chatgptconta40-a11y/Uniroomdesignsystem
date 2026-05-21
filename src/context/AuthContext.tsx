import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterData } from '../types/auth';
import { mockUsers, mockStudentProfiles, mockLandlordProfiles } from '../data/mockUsers';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEY = 'uniroom_user';
const USERS_KEY = 'uniroom_all_users';

// Initialize localStorage with mock users if not exists
const initializeStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeStorage();

    // Check if user is logged in
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const allUsers: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const foundUser = allUsers.find(u => u.email === email && u.password === password);

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
      setLoading(false);
      return { success: true };
    }

    setLoading(false);
    return { success: false, error: 'Email ou palavra-passe incorretos' };
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const allUsers: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

    // Check if email already exists
    if (allUsers.some(u => u.email === data.email)) {
      setLoading(false);
      return { success: false, error: 'Este email já está registado' };
    }

    // Create new user
    const newUser: User = {
      id: String(allUsers.length + 1),
      name: data.name,
      email: data.email,
      password: data.password,
      type: data.type,
      verified: false,
      createdAt: new Date(),
    };

    allUsers.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));

    // Create profile based on type
    if (data.type === 'student') {
      const profiles = mockStudentProfiles;
      profiles.push({ userId: newUser.id });
    } else if (data.type === 'landlord') {
      const profiles = mockLandlordProfiles;
      profiles.push({ userId: newUser.id });
    }

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setLoading(false);

    return { success: true };
  };

  const logout = () => {
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

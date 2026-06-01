import type { StudentProfile as FullStudentProfile } from './profile';

export type UserType = 'student' | 'landlord' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  type: UserType;
  verified: boolean;
  status?: 'active' | 'suspended' | 'blocked';
  onboardingCompleted?: boolean;
  profileCompleteness?: {
    personal: number;
    lifestyle: number;
    preferences: number;
    overall: number;
  };
  createdAt: Date;
}

export interface StudentProfile {
  userId: string;
  university?: string;
  course?: string;
  year?: number;
}

export interface LandlordProfile {
  userId: string;
  phoneNumber?: string;
  properties?: number;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (
    data: RegisterData
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  saveStudentProfile: (
    profile: FullStudentProfile
  ) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  type: UserType;
}
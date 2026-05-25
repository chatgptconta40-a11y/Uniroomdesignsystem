export type UserType = 'student' | 'landlord' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  type: UserType;
  verified: boolean;
  onboardingCompleted?: boolean;
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
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  saveStudentProfile: (profile: object, completeness: object) => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  type: UserType;
}

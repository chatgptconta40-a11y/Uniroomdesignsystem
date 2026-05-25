import { User, StudentProfile, LandlordProfile } from '../types/auth';

// User records
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'estudante@uniroom.pt',
    password: 'password123',
    type: 'student',
    verified: true,
    createdAt: new Date('2026-01-15'),
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'senhorio@uniroom.pt',
    password: 'password123',
    type: 'landlord',
    verified: true,
    createdAt: new Date('2026-01-10'),
  },
  {
    id: '3',
    name: 'Admin UniRoom',
    email: 'admin@uniroom.pt',
    password: 'password123',
    type: 'admin',
    verified: true,
    createdAt: new Date('2026-01-01'),
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana.costa@student.pt',
    password: 'password123',
    type: 'student',
    verified: true,
    createdAt: new Date('2026-02-01'),
  },
  {
    id: '5',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@student.pt',
    password: 'password123',
    type: 'student',
    verified: true,
    createdAt: new Date('2026-02-15'),
  },
];


// Credentials for authentication
export const mockCredentials = mockUsers.map(user => ({
  id: user.id,
  email: user.email,
  password: user.password!,
}));

export const mockStudentProfiles: StudentProfile[] = [
  {
    userId: '1',
    university: 'Universidade de Lisboa',
    course: 'Engenharia Informática',
    year: 2,
  },
];

export const mockLandlordProfiles: LandlordProfile[] = [
  {
    userId: '2',
    phoneNumber: '+351 912 345 678',
    properties: 3,
  },
];

import { Application } from '../types/accommodation';
import { getApplicationsForLandlord as getApps, updateApplicationStatus as updateStatus } from './mockApplications';
import { mockAccommodations } from './mockAccommodations';
import { getRoom, getProperty } from './mockProperties';

const USERS_STORAGE_KEY = 'uniroom_all_users';
const PROFILES_STORAGE_KEY = 'uniroom_profiles';

export interface DetailedApplication extends Application {
  applicantName: string;
  applicantEmail: string;
  applicantCourse: string;
  applicantUniversity: string;
  applicantYear: number;
  compatibilityScore: number;
  trustScore: number;
  trustLevel: 'new' | 'confirmed' | 'trusted';
  verificationLevel: 'none' | 'bronze' | 'silver' | 'gold';
  listingTitle: string;
  listingPrice: number;
}

function getUserById(userId: string) {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  const users = stored ? JSON.parse(stored) : [];
  return users.find((u: any) => u.id === userId);
}

function getProfileById(userId: string) {
  const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
  const profiles = stored ? JSON.parse(stored) : [];
  return profiles.find((p: any) => p.personal?.userId === userId);
}

export function getApplicationsForLandlord(landlordId: string, listingId?: string): DetailedApplication[] {
  const applications = getApps(landlordId);

  const detailed: DetailedApplication[] = applications.map(app => {
    const user = getUserById(app.userId);
    const profile = getProfileById(app.userId);
    const room = app.roomId ? getRoom(app.roomId) : null;
    const property = room ? getProperty(room.propertyId) : null;
    const accommodation = mockAccommodations.find(a => a.id === app.accommodationId);

    const compatibilityScore = Math.floor(Math.random() * 30) + 70;
    const trustScore = user ? 75 : 50;
    const trustLevel = trustScore >= 80 ? 'trusted' : trustScore >= 60 ? 'confirmed' : 'new';
    const verificationLevel = trustScore >= 80 ? 'gold' : trustScore >= 60 ? 'silver' : trustScore >= 40 ? 'bronze' : 'none';

    return {
      ...app,
      applicantName: user?.name || 'Utilizador',
      applicantEmail: user?.email || 'email@exemplo.com',
      applicantCourse: profile?.personal?.course || 'Não especificado',
      applicantUniversity: profile?.personal?.institution || 'Não especificado',
      applicantYear: profile?.personal?.yearOfStudy || 1,
      compatibilityScore,
      trustScore,
      trustLevel: trustLevel as any,
      verificationLevel: verificationLevel as any,
      listingTitle: room && property
        ? `${room.title} · ${property.title}`
        : accommodation?.title || 'Alojamento',
      listingPrice: room?.price || accommodation?.price || 0,
    };
  });

  if (listingId) {
    return detailed.filter(app => app.accommodationId === listingId || app.roomId === listingId || app.propertyId === listingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return detailed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateApplicationStatus(
  applicationId: string,
  status: Application['status']
): boolean {
  return updateStatus(applicationId, status);
}

export function getApplicationStats(landlordId: string) {
  const all = getApps(landlordId);
  return {
    total: all.length,
    pending: all.filter(a => a.status === 'pending').length,
    underReview: all.filter(a => a.status === 'under_review').length,
    accepted: all.filter(a => a.status === 'accepted').length,
    rejected: all.filter(a => a.status === 'rejected').length,
  };
}
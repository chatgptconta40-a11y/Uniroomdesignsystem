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

function safeReadArray<T>(key: string): T[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function getUserById(userId: string) {
  const users = safeReadArray<any>(USERS_STORAGE_KEY);
  return users.find(user => user.id === userId);
}

function getProfileById(userId: string) {
  const profiles = safeReadArray<any>(PROFILES_STORAGE_KEY);
  return profiles.find(profile => profile.personal?.userId === userId);
}

function hashToRange(seed: string, min: number, max: number): number {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  const span = max - min + 1;
  return min + (Math.abs(hash) % span);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getCompatibilityScore(app: Application): number {
  const seed = `${app.id}:${app.userId}:${app.propertyId ?? ''}:${app.roomId ?? app.accommodationId}`;
  const base = hashToRange(seed, 66, 91);
  const messageBonus = app.message.length >= 180 ? 6 : app.message.length >= 100 ? 3 : 0;
  const moveInBonus = app.moveInDate ? 2 : 0;

  return clamp(base + messageBonus + moveInBonus, 55, 98);
}

function getTrustScore(user: any, profile: any, app: Application): number {
  let score = 46 + hashToRange(app.userId, 0, 16);

  if (user?.name) score += 6;
  if (user?.email && !String(user.email).includes('exemplo.com')) score += 8;
  if (profile?.personal) score += 10;
  if (profile?.personal?.institution) score += 5;
  if (profile?.personal?.course) score += 4;
  if (profile?.preferences) score += 4;
  if (profile?.documents?.studentCard || profile?.verification?.studentCard) score += 8;

  return clamp(score, 35, 96);
}

function getTrustLevel(score: number): DetailedApplication['trustLevel'] {
  if (score >= 80) return 'trusted';
  if (score >= 60) return 'confirmed';
  return 'new';
}

function getVerificationLevel(score: number): DetailedApplication['verificationLevel'] {
  if (score >= 84) return 'gold';
  if (score >= 68) return 'silver';
  if (score >= 50) return 'bronze';
  return 'none';
}

export function getApplicationsForLandlord(landlordId: string, listingId?: string): DetailedApplication[] {
  const applications = getApps(landlordId);

  const detailed: DetailedApplication[] = applications.map(app => {
    const user = getUserById(app.userId);
    const profile = getProfileById(app.userId);
    const room = app.roomId ? getRoom(app.roomId) : null;
    const property = room ? getProperty(room.propertyId) : null;
    const accommodation = mockAccommodations.find(a => a.id === app.accommodationId);
    const compatibilityScore = getCompatibilityScore(app);
    const trustScore = getTrustScore(user, profile, app);

    return {
      ...app,
      applicantName: user?.name || 'Utilizador',
      applicantEmail: user?.email || 'email@exemplo.com',
      applicantCourse: profile?.personal?.course || 'Nao especificado',
      applicantUniversity: profile?.personal?.institution || 'Nao especificado',
      applicantYear: profile?.personal?.yearOfStudy || 1,
      compatibilityScore,
      trustScore,
      trustLevel: getTrustLevel(trustScore),
      verificationLevel: getVerificationLevel(trustScore),
      listingTitle: room && property
        ? `${room.title} · ${property.title}`
        : accommodation?.title || 'Alojamento',
      listingPrice: room?.price || accommodation?.price || 0,
    };
  });

  const filtered = listingId
    ? detailed.filter(app =>
      app.accommodationId === listingId ||
      app.roomId === listingId ||
      app.propertyId === listingId
    )
    : detailed;

  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateApplicationStatus(
  applicationId: string,
  status: Application['status'],
  landlordId?: string
): boolean {
  let landlordName = 'Senhorio';

  if (landlordId) {
    const landlord = getUserById(landlordId);
    if (landlord) landlordName = landlord.name;
  }

  return updateStatus(applicationId, status, landlordName);
}

export function getApplicationStats(landlordId: string) {
  const all = getApps(landlordId);

  return {
    total: all.length,
    pending: all.filter(a => a.status === 'pending').length,
    underReview: all.filter(a => a.status === 'under_review').length,
    accepted: all.filter(a => a.status === 'accepted').length,
    confirmed: all.filter(a => a.status === 'confirmed').length,
    rejected: all.filter(a => a.status === 'rejected').length,
    withdrawn: all.filter(a => a.status === 'withdrawn').length,
  };
}
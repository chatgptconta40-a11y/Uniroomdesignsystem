import { Application } from '../types/accommodation';
import { getApplicationsForLandlord as getApps, updateApplicationStatus as updateStatus } from './mockApplications';
import { mockAccommodations } from './mockAccommodations';
import { getRoom, getProperty } from './mockProperties';
import { getProfile } from './mockProfiles';
import { getTrustScore, getVerificationStatus } from './mockTrust';

const USERS_STORAGE_KEY = 'uniroom_all_users';

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
  verificationLabel: string;
  verificationPending: boolean;
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
  const message = app.message || '';
  const messageBonus = message.length >= 180 ? 6 : message.length >= 100 ? 3 : 0;
  const moveInBonus = app.moveInDate ? 2 : 0;

  return clamp(base + messageBonus + moveInBonus, 55, 98);
}

function getTrustLevel(score: number): DetailedApplication['trustLevel'] {
  if (score >= 80) return 'trusted';
  if (score >= 60) return 'confirmed';
  return 'new';
}

function getVerificationLabel(level: DetailedApplication['verificationLevel'], pending: boolean): string {
  if (pending) return 'Documento em análise';
  if (level === 'gold') return 'Verificação Ouro';
  if (level === 'silver') return 'Email universitário confirmado';
  if (level === 'bronze') return 'Email pessoal confirmado';
  return 'Não verificado';
}

function calculateCandidateTrustScore(user: any, app: Application): number {
  const profile = getProfile(app.userId);
  const verification = getVerificationStatus(app.userId);
  const trust = getTrustScore(app.userId);

  let score = 35 + hashToRange(app.userId, 0, 8);

  if (user?.name) score += 6;
  if (user?.email && !String(user.email).includes('exemplo.com')) score += 5;
  if (profile?.personal) score += 10;
  if (profile?.personal?.institution) score += 5;
  if (profile?.personal?.course) score += 4;
  if (profile?.lifestyle) score += 4;
  if (profile?.preferences) score += 4;

  if (verification?.emailVerified) score += 8;
  if (verification?.universityEmailVerified) score += 12;
  if (verification?.documentReviewStatus === 'pending') score += 4;
  if (verification?.documentVerified) score += 18;

  if (trust?.score) {
    score = Math.round(score * 0.65 + trust.score * 0.35);
  }

  return clamp(score, 35, 98);
}

export function getApplicationsForLandlord(landlordId: string, listingId?: string): DetailedApplication[] {
  const applications = getApps(landlordId);

  const detailed: DetailedApplication[] = applications.map(app => {
    const user = getUserById(app.userId);
    const profile = getProfile(app.userId);
    const verification = getVerificationStatus(app.userId);

    const room = app.roomId ? getRoom(app.roomId) : null;
    const property = room ? getProperty(room.propertyId) : app.propertyId ? getProperty(app.propertyId) : null;
    const accommodation = mockAccommodations.find(item => item.id === app.accommodationId);

    const compatibilityScore = getCompatibilityScore(app);
    const trustScore = calculateCandidateTrustScore(user, app);
    const verificationLevel = verification?.level || 'none';
    const verificationPending = verification?.documentReviewStatus === 'pending';

    return {
      ...app,
      applicantName: user?.name || profile?.personal?.fullName || 'Utilizador',
      applicantEmail: user?.email || 'email@exemplo.com',
      applicantCourse: profile?.personal?.course || app.studentCourse || 'Não especificado',
      applicantUniversity: profile?.personal?.institution || app.studentUniversity || 'Não especificado',
      applicantYear: profile?.personal?.yearOfStudy || app.studentYear || 1,
      compatibilityScore,
      trustScore,
      trustLevel: getTrustLevel(trustScore),
      verificationLevel,
      verificationLabel: getVerificationLabel(verificationLevel, verificationPending),
      verificationPending,
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
  landlordId?: string,
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
    pending: all.filter(application => application.status === 'pending').length,
    underReview: all.filter(application => application.status === 'under_review').length,
    accepted: all.filter(application => application.status === 'accepted').length,
    confirmed: all.filter(application => application.status === 'confirmed').length,
    rejected: all.filter(application => application.status === 'rejected').length,
    withdrawn: all.filter(application => application.status === 'withdrawn').length,
  };
}

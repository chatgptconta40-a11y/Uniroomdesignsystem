import {
  Review,
  VerificationStatus,
  Report,
  TrustScore,
  LandlordStats,
  VerificationLevel,
  TrustLevel,
} from '../types/trust';

export type DocumentReviewStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface ExtendedVerificationStatus extends VerificationStatus {
  personalEmail?: string;
  universityEmail?: string;
  documentFileName?: string;
  documentReviewStatus?: DocumentReviewStatus;
  documentSubmittedAt?: Date;
  documentReviewedAt?: Date;
  documentRejectionReason?: string;
}

const REVIEWS_STORAGE_KEY = 'uniroom_reviews';
const VERIFICATIONS_STORAGE_KEY = 'uniroom_verification_statuses';
const TRUST_STORAGE_KEY = 'uniroom_trust_scores';
const REPORTS_STORAGE_KEY = 'uniroom_reports';

export const mockReviews: Review[] = [];
export const mockVerifications: Record<string, ExtendedVerificationStatus> = {};
export const mockReports: Report[] = [];
export const mockTrustScores: Record<string, TrustScore> = {};
export const mockLandlordStats: Record<string, LandlordStats> = {};

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function readLocalArray<T>(key: string): T[] {
  const value = safeParse<T[]>(localStorage.getItem(key), []);
  return Array.isArray(value) ? value : [];
}

function writeLocalArray<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function readLocalRecord<T>(key: string): Record<string, T> {
  const value = safeParse<Record<string, T>>(localStorage.getItem(key), {});
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function writeLocalRecord<T>(key: string, value: Record<string, T>): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function calculateVerificationLevel(
  emailVerified: boolean,
  universityEmailVerified: boolean,
  documentVerified: boolean,
): VerificationLevel {
  if (emailVerified && universityEmailVerified && documentVerified) return 'gold';
  if (emailVerified && universityEmailVerified) return 'silver';
  if (emailVerified) return 'bronze';
  return 'none';
}

function normalizeVerification(value: any): ExtendedVerificationStatus {
  const emailVerified = !!value?.emailVerified;
  const universityEmailVerified = !!value?.universityEmailVerified;
  const documentVerified = !!value?.documentVerified;

  const documentReviewStatus: DocumentReviewStatus =
    value?.documentReviewStatus ||
    (documentVerified ? 'approved' : value?.documentFileName ? 'pending' : 'not_submitted');

  return {
    userId: String(value?.userId || ''),
    level: calculateVerificationLevel(emailVerified, universityEmailVerified, documentVerified),
    emailVerified,
    universityEmailVerified,
    documentVerified,
    photoVerified: !!value?.photoVerified,
    verifiedAt: toDate(value?.verifiedAt),
    personalEmail: value?.personalEmail,
    universityEmail: value?.universityEmail,
    documentFileName: value?.documentFileName,
    documentReviewStatus,
    documentSubmittedAt: toDate(value?.documentSubmittedAt),
    documentReviewedAt: toDate(value?.documentReviewedAt),
    documentRejectionReason: value?.documentRejectionReason,
  };
}

function normalizeReview(value: any): Review | null {
  if (!value?.id || !value?.userId || !value?.reviewerId) return null;

  return {
    id: String(value.id),
    accommodationId: value.accommodationId,
    userId: String(value.userId),
    reviewerId: String(value.reviewerId),
    reviewerName: value.reviewerName || 'Utilizador',
    reviewerAvatar: value.reviewerAvatar,
    rating: Number(value.rating || 0),
    criteria: value.criteria || {
      quality: 0,
      coexistence: 0,
      landlordResponse: 0,
      location: 0,
      valueForMoney: 0,
    },
    comment: value.comment || '',
    recommend: Boolean(value.recommend),
    helpful: Number(value.helpful || 0),
    createdAt: toDate(value.createdAt) || new Date(),
    verified: value.verified !== false,
  };
}

function normalizeReport(value: any): Report | null {
  if (!value?.id || !value?.reporterId || !value?.reportedType || !value?.reportedId) return null;

  return {
    id: String(value.id),
    reporterId: String(value.reporterId),
    reportedType: value.reportedType,
    reportedId: String(value.reportedId),
    reason: value.reason || 'other',
    description: value.description || '',
    status: value.status || 'pending',
    createdAt: toDate(value.createdAt) || new Date(),
    resolvedAt: toDate(value.resolvedAt),
  };
}

function normalizeTrust(value: any): TrustScore | null {
  if (!value?.userId) return null;

  return {
    userId: String(value.userId),
    level: value.level || 'new',
    score: Number(value.score || 0),
    verificationLevel: value.verificationLevel || 'none',
    reviewsCount: Number(value.reviewsCount || 0),
    averageRating: Number(value.averageRating || 0),
    responseRate: Number(value.responseRate || 0),
    responseTime: Number(value.responseTime || 0),
    memberSince: toDate(value.memberSince) || new Date(),
    resolvedReports: Number(value.resolvedReports || 0),
    totalReports: Number(value.totalReports || 0),
  };
}

function readReviews(): Review[] {
  return readLocalArray<any>(REVIEWS_STORAGE_KEY)
    .map(normalizeReview)
    .filter((item): item is Review => Boolean(item));
}

function writeReviews(reviews: Review[]): void {
  writeLocalArray(REVIEWS_STORAGE_KEY, reviews);
}

function readVerifications(): Record<string, ExtendedVerificationStatus> {
  const raw = readLocalRecord<any>(VERIFICATIONS_STORAGE_KEY);
  const normalized: Record<string, ExtendedVerificationStatus> = {};

  Object.values(raw).forEach(value => {
    const verification = normalizeVerification(value);
    if (verification.userId) normalized[verification.userId] = verification;
  });

  return normalized;
}

function writeVerifications(record: Record<string, ExtendedVerificationStatus>): void {
  writeLocalRecord(VERIFICATIONS_STORAGE_KEY, record);
}

function readTrustScores(): Record<string, TrustScore> {
  const raw = readLocalRecord<any>(TRUST_STORAGE_KEY);
  const normalized: Record<string, TrustScore> = {};

  Object.values(raw).forEach(value => {
    const trust = normalizeTrust(value);
    if (trust) normalized[trust.userId] = trust;
  });

  return normalized;
}

function writeTrustScores(record: Record<string, TrustScore>): void {
  writeLocalRecord(TRUST_STORAGE_KEY, record);
}

function readReports(): Report[] {
  return readLocalArray<any>(REPORTS_STORAGE_KEY)
    .map(normalizeReport)
    .filter((item): item is Report => Boolean(item));
}

function writeReports(reports: Report[]): void {
  writeLocalArray(REPORTS_STORAGE_KEY, reports);
}

function syncMirrors(): void {
  const reviews = readReviews();
  const verifications = readVerifications();
  const trustScores = readTrustScores();
  const reports = readReports();

  mockReviews.length = 0;
  mockReviews.push(...reviews);

  Object.keys(mockVerifications).forEach(key => delete mockVerifications[key]);
  Object.assign(mockVerifications, verifications);

  Object.keys(mockTrustScores).forEach(key => delete mockTrustScores[key]);
  Object.assign(mockTrustScores, trustScores);

  mockReports.length = 0;
  mockReports.push(...reports);

  Object.keys(mockLandlordStats).forEach(key => delete mockLandlordStats[key]);

  Object.values(trustScores).forEach(trust => {
    mockLandlordStats[trust.userId] = {
      userId: trust.userId,
      verified: trust.verificationLevel === 'gold' || trust.verificationLevel === 'silver',
      averageRating: trust.averageRating,
      totalReviews: trust.reviewsCount,
      responseRate: trust.responseRate,
      averageResponseTime: trust.responseTime,
      memberSince: trust.memberSince,
      activeListings: 0,
      completedRentals: 0,
      resolvedIssues: trust.resolvedReports,
      totalIssues: trust.totalReports,
    };
  });
}

syncMirrors();

export function getReviewsForAccommodation(accommodationId: string): Review[] {
  return readReviews().filter(review => review.accommodationId === accommodationId);
}

export function getVerificationStatus(userId: string): ExtendedVerificationStatus | null {
  if (!userId) return null;

  const verifications = readVerifications();
  return verifications[userId] ?? null;
}

export function getAllVerificationStatuses(): ExtendedVerificationStatus[] {
  return Object.values(readVerifications()).sort((a, b) => {
    const aDate = a.documentSubmittedAt?.getTime() ?? a.verifiedAt?.getTime() ?? 0;
    const bDate = b.documentSubmittedAt?.getTime() ?? b.verifiedAt?.getTime() ?? 0;
    return bDate - aDate;
  });
}

export function getPendingVerificationReviews(): ExtendedVerificationStatus[] {
  return getAllVerificationStatuses().filter(item => item.documentReviewStatus === 'pending');
}

export function getTrustScore(userId: string): TrustScore | null {
  if (!userId) return null;

  const trustScores = readTrustScores();
  const existing = trustScores[userId];

  if (existing) return existing;

  const verification = getVerificationStatus(userId);
  const verificationLevel = verification?.level ?? 'none';

  const baseScore =
    verificationLevel === 'gold' ? 88 :
    verificationLevel === 'silver' ? 72 :
    verificationLevel === 'bronze' ? 55 :
    35;

  const generated: TrustScore = {
    userId,
    level: baseScore >= 80 ? 'trusted' : baseScore >= 55 ? 'confirmed' : 'new',
    score: baseScore,
    verificationLevel,
    reviewsCount: 0,
    averageRating: 0,
    responseRate: 0,
    responseTime: 0,
    memberSince: new Date(),
    resolvedReports: 0,
    totalReports: 0,
  };

  trustScores[userId] = generated;
  writeTrustScores(trustScores);
  syncMirrors();

  return generated;
}

export function getLandlordStats(userId: string): LandlordStats | null {
  syncMirrors();
  return mockLandlordStats[userId] ?? null;
}

export function getVerificationBadge(level: VerificationLevel): { icon: string; label: string; color: string } {
  const badges = {
    none: { icon: '', label: 'Não verificado', color: 'text-gray-400' },
    bronze: { icon: '🥉', label: 'Bronze', color: 'text-amber-700' },
    silver: { icon: '🥈', label: 'Prata', color: 'text-gray-500' },
    gold: { icon: '🥇', label: 'Ouro', color: 'text-yellow-500' },
  };

  return badges[level];
}

export function getTrustBadge(level: TrustLevel): { label: string; color: string; bgColor: string } {
  const badges = {
    new: { label: 'Novo Membro', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    confirmed: { label: 'Membro Confirmado', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    trusted: { label: 'Membro de Confiança', color: 'text-green-700', bgColor: 'bg-green-100' },
  };

  return badges[level];
}

export function createReview(
  accommodationId: string,
  userId: string,
  reviewerId: string,
  reviewerName: string,
  rating: number,
  criteria: Review['criteria'],
  comment: string,
  recommend: boolean,
): Review {
  const reviews = readReviews();

  const review: Review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    accommodationId,
    userId,
    reviewerId,
    reviewerName,
    rating,
    criteria,
    comment,
    recommend,
    helpful: 0,
    createdAt: new Date(),
    verified: true,
  };

  writeReviews([review, ...reviews]);
  syncMirrors();

  return review;
}

export function createReport(
  reporterId: string,
  reportedType: Report['reportedType'],
  reportedId: string,
  reason: Report['reason'],
  description: string,
): Report {
  const reports = readReports();

  const newReport: Report = {
    id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    reporterId,
    reportedType,
    reportedId,
    reason,
    description,
    status: 'pending',
    createdAt: new Date(),
  };

  writeReports([newReport, ...reports]);
  syncMirrors();

  return newReport;
}

export function updateVerificationStatus(
  userId: string,
  updates: Partial<ExtendedVerificationStatus>,
): ExtendedVerificationStatus {
  if (!userId) throw new Error('userId é obrigatório para atualizar verificação.');

  const verifications = readVerifications();
  const current = verifications[userId] ?? {
    userId,
    level: 'none' as VerificationLevel,
    emailVerified: false,
    universityEmailVerified: false,
    documentVerified: false,
    photoVerified: false,
    documentReviewStatus: 'not_submitted' as DocumentReviewStatus,
  };

  const updated = normalizeVerification({
    ...current,
    ...updates,
    userId,
  });

  if (updated.documentVerified) {
    updated.documentReviewStatus = 'approved';
    updated.documentReviewedAt = updated.documentReviewedAt ?? new Date();
    updated.verifiedAt = updated.verifiedAt ?? new Date();
  }

  verifications[userId] = updated;
  writeVerifications(verifications);

  const trustScores = readTrustScores();
  const currentTrust = getTrustScore(userId);

  if (currentTrust) {
    const verificationLevel = updated.level;
    const baseScore =
      verificationLevel === 'gold' ? 88 :
      verificationLevel === 'silver' ? 72 :
      verificationLevel === 'bronze' ? 55 :
      35;

    trustScores[userId] = {
      ...currentTrust,
      verificationLevel,
      score: Math.max(currentTrust.score, baseScore),
      level: baseScore >= 80 ? 'trusted' : baseScore >= 55 ? 'confirmed' : 'new',
    };

    writeTrustScores(trustScores);
  }

  syncMirrors();

  return updated;
}

export function submitVerificationDocument(
  userId: string,
  fileName: string,
): ExtendedVerificationStatus {
  return updateVerificationStatus(userId, {
    documentVerified: false,
    documentFileName: fileName,
    documentReviewStatus: 'pending',
    documentSubmittedAt: new Date(),
    documentReviewedAt: undefined,
    documentRejectionReason: undefined,
  });
}

export function approveVerificationDocument(userId: string): ExtendedVerificationStatus {
  return updateVerificationStatus(userId, {
    documentVerified: true,
    documentReviewStatus: 'approved',
    documentReviewedAt: new Date(),
    verifiedAt: new Date(),
  });
}

export function rejectVerificationDocument(
  userId: string,
  reason = 'Documento rejeitado pelo administrador.',
): ExtendedVerificationStatus {
  return updateVerificationStatus(userId, {
    documentVerified: false,
    documentReviewStatus: 'rejected',
    documentReviewedAt: new Date(),
    documentRejectionReason: reason,
  });
}

export function markReviewHelpful(reviewId: string): void {
  const reviews = readReviews();
  const next = reviews.map(review =>
    review.id === reviewId
      ? { ...review, helpful: review.helpful + 1 }
      : review,
  );

  writeReviews(next);
  syncMirrors();
}

export function getAverageRatingBreakdown(accommodationId: string) {
  const reviews = getReviewsForAccommodation(accommodationId);

  if (reviews.length === 0) {
    return {
      average: 0,
      total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      criteriaAverages: {
        quality: 0,
        coexistence: 0,
        landlordResponse: 0,
        location: 0,
        valueForMoney: 0,
      },
    };
  }

  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reviews.forEach(review => {
    const rounded = Math.round(review.rating) as keyof typeof distribution;
    if (distribution[rounded] !== undefined) distribution[rounded] += 1;
  });

  const criteriaKeys = ['quality', 'coexistence', 'landlordResponse', 'location', 'valueForMoney'] as const;

  const criteriaAverages = criteriaKeys.reduce((acc, key) => {
    acc[key] = reviews.reduce((sum, review) => sum + review.criteria[key], 0) / reviews.length;
    return acc;
  }, {} as Review['criteria']);

  return {
    average,
    total: reviews.length,
    distribution,
    criteriaAverages,
  };
}

export function resolveReport(reportId: string, status: Report['status'] = 'resolved'): void {
  const reports = readReports();

  const next = reports.map(report =>
    report.id === reportId
      ? {
          ...report,
          status,
          resolvedAt: new Date(),
        }
      : report,
  );

  writeReports(next);
  syncMirrors();
}

import {
  Review,
  VerificationStatus,
  Report,
  TrustScore,
  LandlordStats,
  VerificationLevel,
  TrustLevel,
} from '../types/trust';
import { supabase } from '../lib/supabase';

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

const reviewsCache = new Map<string, Review>();
const verifsCache = new Map<string, ExtendedVerificationStatus>();
const trustCache = new Map<string, TrustScore>();
const landlordStatsCache = new Map<string, LandlordStats>();
const reportsCache: Report[] = [];

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

export const mockReviews: Review[] = [];
export const mockVerifications: Record<string, ExtendedVerificationStatus> = {};
export const mockReports: Report[] = reportsCache;
export const mockTrustScores: Record<string, TrustScore> = {};
export const mockLandlordStats: Record<string, LandlordStats> = {};

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function readLocalArray<T>(key: string): T[] {
  return safeParse<T[]>(localStorage.getItem(key), []);
}

function writeLocalArray<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readLocalRecord<T>(key: string): Record<string, T> {
  return safeParse<Record<string, T>>(localStorage.getItem(key), {});
}

function writeLocalRecord<T>(key: string, value: Record<string, T>) {
  localStorage.setItem(key, JSON.stringify(value));
}

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeVerification(value: any): ExtendedVerificationStatus {
  const emailVerified = !!value.emailVerified;
  const universityEmailVerified = !!value.universityEmailVerified;
  const documentVerified = !!value.documentVerified;
  const reviewStatus: DocumentReviewStatus =
    value.documentReviewStatus ||
    (documentVerified ? 'approved' : value.documentFileName ? 'pending' : 'not_submitted');

  return {
    userId: value.userId,
    level: calculateVerificationLevel(emailVerified, universityEmailVerified, documentVerified),
    emailVerified,
    universityEmailVerified,
    documentVerified,
    photoVerified: !!value.photoVerified,
    verifiedAt: toDate(value.verifiedAt),
    personalEmail: value.personalEmail,
    universityEmail: value.universityEmail,
    documentFileName: value.documentFileName,
    documentReviewStatus: reviewStatus,
    documentSubmittedAt: toDate(value.documentSubmittedAt),
    documentReviewedAt: toDate(value.documentReviewedAt),
    documentRejectionReason: value.documentRejectionReason,
  };
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

function saveVerificationsToLocal() {
  const record: Record<string, ExtendedVerificationStatus> = {};
  verifsCache.forEach((value, key) => {
    record[key] = value;
  });
  writeLocalRecord(VERIFICATIONS_STORAGE_KEY, record);
}

function saveReviewsToLocal() {
  writeLocalArray(REVIEWS_STORAGE_KEY, Array.from(reviewsCache.values()));
}

function saveTrustToLocal() {
  const record: Record<string, TrustScore> = {};
  trustCache.forEach((value, key) => {
    record[key] = value;
  });
  writeLocalRecord(TRUST_STORAGE_KEY, record);
}

function saveReportsToLocal() {
  writeLocalArray(REPORTS_STORAGE_KEY, reportsCache);
}

function syncMirrors(): void {
  mockReviews.length = 0;
  for (const review of reviewsCache.values()) mockReviews.push(review);

  for (const key of Object.keys(mockVerifications)) delete mockVerifications[key];
  for (const verification of verifsCache.values()) mockVerifications[verification.userId] = verification;

  for (const key of Object.keys(mockTrustScores)) delete mockTrustScores[key];
  for (const trust of trustCache.values()) mockTrustScores[trust.userId] = trust;

  for (const key of Object.keys(mockLandlordStats)) delete mockLandlordStats[key];
  for (const stats of landlordStatsCache.values()) mockLandlordStats[stats.userId] = stats;
}

function rebuildLandlordStats() {
  landlordStatsCache.clear();

  for (const trust of trustCache.values()) {
    landlordStatsCache.set(trust.userId, {
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
    });
  }
}

function rowToReview(row: any): Review {
  return {
    id: row.id,
    accommodationId: row.property_id ?? '',
    userId: row.reviewed_user_id ?? '',
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name ?? 'Utilizador',
    rating: Number(row.rating ?? 0),
    criteria: row.criteria ?? {
      quality: 0,
      coexistence: 0,
      landlordResponse: 0,
      location: 0,
      valueForMoney: 0,
    },
    comment: row.comment ?? '',
    recommend: row.recommend ?? false,
    helpful: row.helpful ?? 0,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    verified: !!row.verified,
  };
}

function rowToVerification(row: any): ExtendedVerificationStatus {
  return normalizeVerification({
    userId: row.user_id,
    level: row.level,
    emailVerified: row.email_verified,
    universityEmailVerified: row.university_email_verified,
    documentVerified: row.document_verified,
    photoVerified: row.photo_verified,
    verifiedAt: row.verified_at,
    personalEmail: row.personal_email,
    universityEmail: row.university_email,
    documentFileName: row.document_file_name,
    documentReviewStatus: row.document_review_status,
    documentSubmittedAt: row.document_submitted_at,
    documentReviewedAt: row.document_reviewed_at,
    documentRejectionReason: row.document_rejection_reason,
  });
}

function rowToTrust(row: any): TrustScore {
  return {
    userId: row.user_id,
    level: row.level ?? 'new',
    score: Number(row.score ?? 0),
    verificationLevel: row.verification_level ?? 'none',
    reviewsCount: row.reviews_count ?? 0,
    averageRating: Number(row.average_rating ?? 0),
    responseRate: Number(row.response_rate ?? 0),
    responseTime: Number(row.response_time ?? 0),
    memberSince: row.member_since ? new Date(row.member_since) : new Date(),
    resolvedReports: row.resolved_reports ?? 0,
    totalReports: row.total_reports ?? 0,
  };
}

function loadLocalFirst() {
  const localReviews = readLocalArray<any>(REVIEWS_STORAGE_KEY);
  const localVerifications = readLocalRecord<any>(VERIFICATIONS_STORAGE_KEY);
  const localTrust = readLocalRecord<any>(TRUST_STORAGE_KEY);
  const localReports = readLocalArray<any>(REPORTS_STORAGE_KEY);

  localReviews.forEach(review => {
    reviewsCache.set(review.id, {
      ...review,
      createdAt: toDate(review.createdAt) ?? new Date(),
    });
  });

  Object.values(localVerifications).forEach(value => {
    const normalized = normalizeVerification(value);
    verifsCache.set(normalized.userId, normalized);
  });

  Object.values(localTrust).forEach((value: any) => {
    trustCache.set(value.userId, {
      ...value,
      memberSince: toDate(value.memberSince) ?? new Date(),
    });
  });

  reportsCache.length = 0;
  localReports.forEach(report => {
    reportsCache.push({
      ...report,
      createdAt: toDate(report.createdAt) ?? new Date(),
      resolvedAt: toDate(report.resolvedAt),
    });
  });

  rebuildLandlordStats();
  syncMirrors();
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    loadLocalFirst();

    const [reviewsResponse, verificationsResponse, trustResponse] = await Promise.all([
      supabase.from('reviews').select('*'),
      supabase.from('verification_status').select('*'),
      supabase.from('trust_scores').select('*'),
    ]);

    if (!reviewsResponse.error) {
      (reviewsResponse.data ?? []).forEach(row => {
        const review = rowToReview(row);
        reviewsCache.set(review.id, review);
      });
      saveReviewsToLocal();
    } else {
      console.error('Trust hydrate reviews:', reviewsResponse.error.message);
    }

    if (!verificationsResponse.error) {
      (verificationsResponse.data ?? []).forEach(row => {
        const verification = rowToVerification(row);
        const local = verifsCache.get(verification.userId);

        /*
          Se houver estado local pendente/rejeitado mais recente, não o esmagamos.
          Isto mantém a UI consistente mesmo se o Supabase ainda não tiver estas colunas.
        */
        if (
          local?.documentReviewStatus === 'pending' ||
          local?.documentReviewStatus === 'rejected'
        ) {
          verifsCache.set(local.userId, local);
        } else {
          verifsCache.set(verification.userId, verification);
        }
      });
      saveVerificationsToLocal();
    } else {
      console.error('Trust hydrate verifs:', verificationsResponse.error.message);
    }

    if (!trustResponse.error) {
      (trustResponse.data ?? []).forEach(row => {
        const trust = rowToTrust(row);
        trustCache.set(trust.userId, trust);
      });
      saveTrustToLocal();
    } else {
      console.error('Trust hydrate scores:', trustResponse.error.message);
    }

    rebuildLandlordStats();
    syncMirrors();
    hydrated = true;
  })();

  return hydratePromise;
}

void hydrate();

export function getReviewsForAccommodation(accommodationId: string): Review[] {
  loadLocalFirst();
  return Array.from(reviewsCache.values()).filter(review => review.accommodationId === accommodationId);
}

export function getVerificationStatus(userId: string): ExtendedVerificationStatus | null {
  if (!userId) return null;
  loadLocalFirst();
  return verifsCache.get(userId) ?? null;
}

export function getAllVerificationStatuses(): ExtendedVerificationStatus[] {
  loadLocalFirst();
  return Array.from(verifsCache.values()).sort((a, b) => {
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
  loadLocalFirst();

  const existing = trustCache.get(userId);
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

  trustCache.set(userId, generated);
  saveTrustToLocal();
  syncMirrors();

  return generated;
}

export function getLandlordStats(userId: string): LandlordStats | null {
  loadLocalFirst();
  return landlordStatsCache.get(userId) ?? null;
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
  const id = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const review: Review = {
    id,
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

  reviewsCache.set(id, review);
  saveReviewsToLocal();
  syncMirrors();

  void supabase.from('reviews').insert({
    id,
    property_id: accommodationId || null,
    reviewed_user_id: userId || null,
    reviewer_id: reviewerId,
    reviewer_name: reviewerName,
    rating,
    criteria,
    comment,
    recommend,
    helpful: 0,
    verified: true,
  }).then(({ error }) => {
    if (error) console.error('Review insert error:', error.message);
  });

  return review;
}

export function createReport(
  reporterId: string,
  reportedType: Report['reportedType'],
  reportedId: string,
  reason: Report['reason'],
  description: string,
): Report {
  const id = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const newReport: Report = {
    id,
    reporterId,
    reportedType,
    reportedId,
    reason,
    description,
    status: 'pending',
    createdAt: new Date(),
  };

  reportsCache.push(newReport);
  saveReportsToLocal();
  syncMirrors();

  const targetType = reportedType === 'accommodation' ? 'listing' : reportedType;

  void supabase.from('reports').insert({
    id,
    reporter_id: reporterId,
    target_type: targetType,
    target_id: reportedId,
    reason: String(reason),
    description,
    status: 'pending',
    severity: 'medium',
  }).then(({ error }) => {
    if (error) console.error('Report insert error:', error.message);
  });

  return newReport;
}

export function updateVerificationStatus(
  userId: string,
  updates: Partial<ExtendedVerificationStatus>,
): ExtendedVerificationStatus {
  if (!userId) throw new Error('userId é obrigatório para atualizar verificação.');

  const current = getVerificationStatus(userId) ?? {
    userId,
    level: 'none' as VerificationLevel,
    emailVerified: false,
    universityEmailVerified: false,
    documentVerified: false,
    photoVerified: false,
    documentReviewStatus: 'not_submitted' as DocumentReviewStatus,
  };

  const updated: ExtendedVerificationStatus = normalizeVerification({
    ...current,
    ...updates,
    userId,
  });

  if (updated.documentVerified) {
    updated.documentReviewStatus = 'approved';
    updated.documentReviewedAt = updated.documentReviewedAt ?? new Date();
    updated.verifiedAt = updated.verifiedAt ?? new Date();
  }

  updated.level = calculateVerificationLevel(
    updated.emailVerified,
    updated.universityEmailVerified,
    updated.documentVerified,
  );

  verifsCache.set(userId, updated);
  saveVerificationsToLocal();
  syncMirrors();

  void supabase.from('verification_status').upsert({
    user_id: userId,
    level: updated.level,
    email_verified: updated.emailVerified,
    university_email_verified: updated.universityEmailVerified,
    document_verified: updated.documentVerified,
    photo_verified: updated.photoVerified,
    verified_at: updated.verifiedAt ? updated.verifiedAt.toISOString() : new Date().toISOString(),
  }, { onConflict: 'user_id' }).then(({ error }) => {
    if (error) console.error('Verification upsert error:', error.message);
  });

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
  const review = reviewsCache.get(reviewId);
  if (!review) return;

  const next = { ...review, helpful: review.helpful + 1 };
  reviewsCache.set(reviewId, next);
  saveReviewsToLocal();
  syncMirrors();

  void supabase.from('reviews').update({ helpful: next.helpful }).eq('id', reviewId);
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

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reviews.forEach(review => {
    const rounded = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
    distribution[rounded]++;
  });

  const criteriaAverages = {
    quality: reviews.reduce((sum, review) => sum + (review.criteria.quality ?? 0), 0) / reviews.length,
    coexistence: reviews.reduce((sum, review) => sum + (review.criteria.coexistence ?? 0), 0) / reviews.length,
    landlordResponse: reviews.reduce((sum, review) => sum + (review.criteria.landlordResponse ?? 0), 0) / reviews.length,
    location: reviews.reduce((sum, review) => sum + (review.criteria.location ?? 0), 0) / reviews.length,
    valueForMoney: reviews.reduce((sum, review) => sum + (review.criteria.valueForMoney ?? 0), 0) / reviews.length,
  };

  return {
    average: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length,
    total: reviews.length,
    distribution,
    criteriaAverages,
  };
}

export async function refreshTrustState(): Promise<void> {
  hydrated = false;
  hydratePromise = null;
  await hydrate();
}
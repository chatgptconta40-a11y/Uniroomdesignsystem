// Reviews, verification, trust scores, reports — backed by Supabase
// (tables: reviews, verification_status, trust_scores). Preserves the
// original synchronous API via in-memory caches hydrated on import.

import { Review, VerificationStatus, Report, TrustScore, LandlordStats, VerificationLevel, TrustLevel } from '../types/trust';
import { supabase } from '../lib/supabase';

const reviewsCache = new Map<string, Review>();
const verifsCache = new Map<string, VerificationStatus>();
const trustCache = new Map<string, TrustScore>();
const landlordStatsCache = new Map<string, LandlordStats>();
const reportsCache: Report[] = [];

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

// Re-exports for compatibility (now derived from cache)
export const mockReviews: Review[] = [];
export const mockVerifications: Record<string, VerificationStatus> = {};
export const mockReports: Report[] = reportsCache;
export const mockTrustScores: Record<string, TrustScore> = {};
export const mockLandlordStats: Record<string, LandlordStats> = {};

function rowToReview(row: any): Review {
  return {
    id: row.id,
    accommodationId: row.property_id ?? '',
    userId: row.reviewed_user_id ?? '',
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name ?? 'Utilizador',
    rating: Number(row.rating),
    criteria: row.criteria ?? { quality: 0, coexistence: 0, landlordResponse: 0, location: 0, valueForMoney: 0 },
    comment: row.comment ?? '',
    recommend: row.recommend ?? false,
    helpful: row.helpful ?? 0,
    createdAt: new Date(row.created_at),
    verified: !!row.verified,
  };
}

function rowToVerification(row: any): VerificationStatus {
  return {
    userId: row.user_id,
    level: row.level,
    emailVerified: !!row.email_verified,
    universityEmailVerified: !!row.university_email_verified,
    documentVerified: !!row.document_verified,
    photoVerified: !!row.photo_verified,
    verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
  };
}

function rowToTrust(row: any): TrustScore {
  return {
    userId: row.user_id,
    level: row.level,
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

function syncMirrors(): void {
  mockReviews.length = 0;
  for (const r of reviewsCache.values()) mockReviews.push(r);

  for (const k of Object.keys(mockVerifications)) delete mockVerifications[k];
  for (const v of verifsCache.values()) mockVerifications[v.userId] = v;

  for (const k of Object.keys(mockTrustScores)) delete mockTrustScores[k];
  for (const t of trustCache.values()) mockTrustScores[t.userId] = t;

  for (const k of Object.keys(mockLandlordStats)) delete mockLandlordStats[k];
  for (const s of landlordStatsCache.values()) mockLandlordStats[s.userId] = s;
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    const [revsRes, verifsRes, trustRes] = await Promise.all([
      supabase.from('reviews').select('*'),
      supabase.from('verification_status').select('*'),
      supabase.from('trust_scores').select('*'),
    ]);
    if (revsRes.error) console.error('Trust hydrate reviews:', revsRes.error.message);
    if (verifsRes.error) console.error('Trust hydrate verifs:', verifsRes.error.message);
    if (trustRes.error) console.error('Trust hydrate scores:', trustRes.error.message);

    reviewsCache.clear();
    (revsRes.data ?? []).forEach(r => reviewsCache.set(r.id, rowToReview(r)));
    verifsCache.clear();
    (verifsRes.data ?? []).forEach(r => verifsCache.set(r.user_id, rowToVerification(r)));
    trustCache.clear();
    (trustRes.data ?? []).forEach(r => trustCache.set(r.user_id, rowToTrust(r)));

    // Derive landlord stats from trust + reviews aggregated by user
    landlordStatsCache.clear();
    for (const t of trustCache.values()) {
      landlordStatsCache.set(t.userId, {
        userId: t.userId,
        verified: t.verificationLevel === 'gold' || t.verificationLevel === 'silver',
        averageRating: t.averageRating,
        totalReviews: t.reviewsCount,
        responseRate: t.responseRate,
        averageResponseTime: t.responseTime,
        memberSince: t.memberSince,
        activeListings: 0,
        completedRentals: 0,
        resolvedIssues: t.resolvedReports,
        totalIssues: t.totalReports,
      });
    }

    syncMirrors();
    hydrated = true;
  })();
  return hydratePromise;
}

void hydrate();

// ─── Read API ─────────────────────────────────────────────────────────────

export function getReviewsForAccommodation(accommodationId: string): Review[] {
  return Array.from(reviewsCache.values()).filter(r => r.accommodationId === accommodationId);
}

export function getVerificationStatus(userId: string): VerificationStatus | null {
  return verifsCache.get(userId) ?? null;
}

export function getTrustScore(userId: string): TrustScore | null {
  return trustCache.get(userId) ?? null;
}

export function getLandlordStats(userId: string): LandlordStats | null {
  return landlordStatsCache.get(userId) ?? null;
}

export function getVerificationBadge(level: VerificationLevel): { icon: string; label: string; color: string } {
  const badges = {
    none: { icon: '', label: 'Não verificado', color: 'text-gray-400' },
    bronze: { icon: '🥉', label: 'Bronze', color: 'text-amber-700' },
    silver: { icon: '🥈', label: 'Prata', color: 'text-gray-400' },
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

// ─── Write API ────────────────────────────────────────────────────────────

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
    id, accommodationId, userId, reviewerId, reviewerName,
    rating, criteria, comment, recommend, helpful: 0,
    createdAt: new Date(), verified: true,
  };
  reviewsCache.set(id, review);
  mockReviews.push(review);

  void supabase.from('reviews').insert({
    id, property_id: accommodationId || null,
    reviewed_user_id: userId || null, reviewer_id: reviewerId,
    rating, criteria, comment, recommend, helpful: 0, verified: true,
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
    id, reporterId, reportedType, reportedId, reason, description,
    status: 'pending', createdAt: new Date(),
  };
  reportsCache.push(newReport);

  // Map mock report type to DB target_type
  const targetType = reportedType === 'accommodation' ? 'listing' : reportedType;
  void supabase.from('reports').insert({
    id, reporter_id: reporterId, target_type: targetType,
    target_id: reportedId, reason: String(reason), description,
    status: 'pending', severity: 'medium',
  }).then(({ error }) => {
    if (error) console.error('Report insert error:', error.message);
  });

  return newReport;
}

export function updateVerificationStatus(
  userId: string,
  updates: Partial<VerificationStatus>,
): VerificationStatus {
  const current = verifsCache.get(userId) ?? {
    userId, level: 'none' as VerificationLevel,
    emailVerified: false, universityEmailVerified: false,
    documentVerified: false, photoVerified: false,
  };
  const updated: VerificationStatus = { ...current, ...updates };

  if (updated.emailVerified && updated.universityEmailVerified && updated.documentVerified && updated.photoVerified) {
    updated.level = 'gold';
  } else if (updated.emailVerified && updated.universityEmailVerified) {
    updated.level = 'silver';
  } else if (updated.emailVerified) {
    updated.level = 'bronze';
  } else {
    updated.level = 'none';
  }

  verifsCache.set(userId, updated);
  mockVerifications[userId] = updated;

  void supabase.from('verification_status').upsert({
    user_id: userId, level: updated.level,
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

export function markReviewHelpful(reviewId: string): void {
  const review = reviewsCache.get(reviewId);
  if (!review) return;
  const next = { ...review, helpful: review.helpful + 1 };
  reviewsCache.set(reviewId, next);
  const idx = mockReviews.findIndex(r => r.id === reviewId);
  if (idx >= 0) mockReviews[idx] = next;
  void supabase.from('reviews').update({ helpful: next.helpful }).eq('id', reviewId);
}

export function getAverageRatingBreakdown(accommodationId: string) {
  const reviews = getReviewsForAccommodation(accommodationId);
  if (reviews.length === 0) {
    return {
      average: 0, total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      criteriaAverages: { quality: 0, coexistence: 0, landlordResponse: 0, location: 0, valueForMoney: 0 },
    };
  }
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const rounded = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
    distribution[rounded]++;
  });
  const criteriaAverages = {
    quality: reviews.reduce((s, r) => s + (r.criteria.quality ?? 0), 0) / reviews.length,
    coexistence: reviews.reduce((s, r) => s + (r.criteria.coexistence ?? 0), 0) / reviews.length,
    landlordResponse: reviews.reduce((s, r) => s + (r.criteria.landlordResponse ?? 0), 0) / reviews.length,
    location: reviews.reduce((s, r) => s + (r.criteria.location ?? 0), 0) / reviews.length,
    valueForMoney: reviews.reduce((s, r) => s + (r.criteria.valueForMoney ?? 0), 0) / reviews.length,
  };
  return {
    average: reviews.reduce((s, r) => s + r.rating, 0) / reviews.length,
    total: reviews.length,
    distribution, criteriaAverages,
  };
}

export async function refreshTrustState(): Promise<void> {
  hydrated = false;
  hydratePromise = null;
  await hydrate();
}

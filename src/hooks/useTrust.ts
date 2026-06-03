import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { computeVerificationLevel } from '../utils/trustLabels';
import { useDataBusRefresh } from '../lib/dataBus';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrustScore {
  userId: string;        // text in DB
  level: string;
  score: number;
  verificationLevel: string;
  reviewsCount: number;
  averageRating: number;
  responseRate: number;
  responseTime: string;  // text in DB (e.g. "2", "< 1")
  memberSince: string;   // date string
  resolvedReports: number;
  totalReports: number;
  updatedAt: string;
}

export interface VerificationStatus {
  userId: string;        // text in DB
  level: string;
  emailVerified: boolean;
  universityEmailVerified: boolean;
  documentVerified: boolean;
  photoVerified: boolean;
  verifiedAt?: string;
  personalEmail?: string;
  universityEmail?: string;
  documentFileName?: string;
  documentReviewStatus?: string;
  documentSubmittedAt?: string;
  documentReviewedAt?: string;
  documentRejectionReason?: string;
  updatedAt: string;
}

export interface Review {
  id: string;               // text in DB
  propertyId: string;       // text in DB (FK → properties.id)
  reviewedUserId: string;   // uuid
  reviewerId: string;       // uuid
  rating: number;
  criteria?: Record<string, number>;
  comment?: string;
  recommend: boolean;
  helpful: number;
  verified: boolean;
  createdAt: string;
  reviewerName?: string;
  reviewerAvatar?: string;
}

export interface CreateReviewInput {
  propertyId: string;
  reviewedUserId: string;
  rating: number;
  criteria?: Record<string, number>;
  comment?: string;
  recommend: boolean;
  reviewerName?: string;
  reviewerAvatar?: string;
}

export interface CreateReportInput {
  targetType: string;
  targetId: string;
  targetName?: string;
  reason: string;
  description?: string;
  severity?: string;
}

// ── DB Mappers ────────────────────────────────────────────────────────────────

function dbToTrustScore(row: any): TrustScore {
  return {
    userId: row.user_id,
    level: row.level ?? 'new',
    score: Number(row.score ?? 0),
    verificationLevel: row.verification_level ?? 'none',
    reviewsCount: Number(row.reviews_count ?? 0),
    averageRating: Number(row.average_rating ?? 0),
    responseRate: Number(row.response_rate ?? 0),
    responseTime: row.response_time ?? '0',
    memberSince: row.member_since ?? new Date().toISOString().slice(0, 10),
    resolvedReports: Number(row.resolved_reports ?? 0),
    totalReports: Number(row.total_reports ?? 0),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function dbToVerificationStatus(row: any): VerificationStatus {
  return {
    userId: row.user_id,
    level: row.level ?? 'none',
    emailVerified: !!row.email_verified,
    universityEmailVerified: !!row.university_email_verified,
    documentVerified: !!row.document_verified,
    photoVerified: !!row.photo_verified,
    verifiedAt: row.verified_at ?? undefined,
    personalEmail: row.personal_email ?? undefined,
    universityEmail: row.university_email ?? undefined,
    documentFileName: row.document_file_name ?? undefined,
    documentReviewStatus: row.document_review_status ?? undefined,
    documentSubmittedAt: row.document_submitted_at ?? undefined,
    documentReviewedAt: row.document_reviewed_at ?? undefined,
    documentRejectionReason: row.document_rejection_reason ?? undefined,
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function dbToReview(row: any): Review {
  return {
    id: row.id,
    propertyId: row.property_id,
    reviewedUserId: row.reviewed_user_id,
    reviewerId: row.reviewer_id,
    rating: Number(row.rating ?? 0),
    criteria: row.criteria ?? undefined,
    comment: row.comment ?? undefined,
    recommend: !!row.recommend,
    helpful: Number(row.helpful ?? 0),
    verified: !!row.verified,
    createdAt: row.created_at,
    reviewerName: row.reviewer_name ?? undefined,
    reviewerAvatar: row.reviewer_avatar ?? undefined,
  };
}

// ── useTrustScore ─────────────────────────────────────────────────────────────

export function useTrustScore(userId: string | undefined) {
  const [score, setScore] = useState<TrustScore | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) { setScore(null); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('trust_scores')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setLoading(false);
    if (!error && data) setScore(dbToTrustScore(data));
    else if (!error) setScore(null);
    else console.error('[TRUST] fetch trust_score', error);
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`realtime:trust-score:${userId}:${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trust_scores', filter: `user_id=eq.${userId}` },
        () => { void refresh(); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, refresh]);

  return { score, loading, refresh };
}

// ── useVerificationStatus ─────────────────────────────────────────────────────

export function useVerificationStatus(userId: string | undefined) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) { setStatus(null); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('verification_status')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setLoading(false);
    if (!error && data) setStatus(dbToVerificationStatus(data));
    else if (!error) setStatus(null);
    else console.error('[TRUST] fetch verification_status', error);
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);
  useDataBusRefresh('verifications', refresh);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`realtime:verification:${userId}:${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verification_status', filter: `user_id=eq.${userId}` },
        () => { void refresh(); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, refresh]);

  const upsert = useCallback(async (
    fields: Partial<Omit<VerificationStatus, 'userId' | 'updatedAt'>>,
  ) => {
    if (!userId) return null;

    const emailVerified = fields.emailVerified ?? status?.emailVerified ?? false;
    const uniVerified = fields.universityEmailVerified ?? status?.universityEmailVerified ?? false;
    const docVerified = fields.documentVerified ?? status?.documentVerified ?? false;
    const level = computeVerificationLevel(emailVerified, uniVerified, docVerified);

    const row: Record<string, any> = {
      user_id: userId,
      level,
      email_verified: emailVerified,
      university_email_verified: uniVerified,
      document_verified: docVerified,
      photo_verified: fields.photoVerified ?? status?.photoVerified ?? false,
      updated_at: new Date().toISOString(),
    };

    if (fields.personalEmail !== undefined) row.personal_email = fields.personalEmail;
    if (fields.universityEmail !== undefined) row.university_email = fields.universityEmail;
    if (fields.documentFileName !== undefined) row.document_file_name = fields.documentFileName;
    if (fields.documentReviewStatus !== undefined) row.document_review_status = fields.documentReviewStatus;
    if (fields.documentSubmittedAt !== undefined) row.document_submitted_at = fields.documentSubmittedAt;
    if (fields.documentRejectionReason !== undefined) row.document_rejection_reason = fields.documentRejectionReason;

    const { data, error } = await supabase
      .from('verification_status')
      .upsert(row, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) { console.error('[TRUST] upsert verification_status', error); return null; }
    await refresh();
    return data ? dbToVerificationStatus(data) : null;
  }, [userId, status, refresh]);

  const submitDocument = useCallback(async (fileName: string) => {
    return upsert({
      documentFileName: fileName,
      documentReviewStatus: 'pending',
      documentSubmittedAt: new Date().toISOString(),
      documentVerified: false,
      documentRejectionReason: undefined,
    });
  }, [upsert]);

  return { status, loading, refresh, upsert, submitDocument };
}

// ── useAllVerificationStatuses ────────────────────────────────────────────────

export function useAllVerificationStatuses() {
  const [statuses, setStatuses] = useState<VerificationStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('verification_status')
      .select('*')
      .order('updated_at', { ascending: false });
    setLoading(false);
    if (!error && data) setStatuses(data.map(dbToVerificationStatus));
    else if (error) console.error('[TRUST] fetch all verification_status', error);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useDataBusRefresh('verifications', refresh);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:verification:all:${Math.random().toString(36).slice(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_status' }, () => {
        void refresh();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refresh]);

  const statusMap: Record<string, VerificationStatus> = {};
  statuses.forEach(s => { statusMap[s.userId] = s; });

  return { statuses, statusMap, loading, refresh };
}

// ── useReviews ────────────────────────────────────────────────────────────────

export function useReviews(params: { propertyId?: string; reviewedUserId?: string }) {
  const { propertyId, reviewedUserId } = params;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const paramsKey = `${propertyId ?? ''}|${reviewedUserId ?? ''}`;

  const refresh = useCallback(async () => {
    if (!propertyId && !reviewedUserId) { setReviews([]); return; }
    setLoading(true);
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    else if (reviewedUserId) query = query.eq('reviewed_user_id', reviewedUserId);
    const { data, error } = await query;
    setLoading(false);
    if (!error && data) setReviews(data.map(dbToReview));
    else if (error) console.error('[TRUST] fetch reviews', error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => { void refresh(); }, [refresh]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const createReview = useCallback(async (input: CreateReviewInput): Promise<Review | null> => {
    const row = {
      property_id: input.propertyId,
      reviewed_user_id: input.reviewedUserId,
      rating: input.rating,
      criteria: input.criteria ?? null,
      comment: input.comment ?? null,
      recommend: input.recommend,
      helpful: 0,
      verified: true,
      reviewer_name: input.reviewerName ?? null,
      reviewer_avatar: input.reviewerAvatar ?? null,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('reviews')
      .insert(row)
      .select()
      .single();
    if (error) { console.error('[TRUST] create review', error); return null; }
    await refresh();
    return data ? dbToReview(data) : null;
  }, [refresh]);

  return { reviews, averageRating, total: reviews.length, loading, refresh, createReview };
}

// ── useReport ─────────────────────────────────────────────────────────────────

const SEVERITY_EN: Record<string, string> = {
  critica: 'critical',
  alta: 'high',
  media: 'medium',
  baixa: 'low',
};

export function useReport() {
  const [loading, setLoading] = useState(false);

  const createReport = useCallback(async (input: CreateReportInput): Promise<boolean> => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const row = {
      reporter_id: session?.user?.id ?? null,
      target_type: input.targetType,
      target_id: input.targetId,
      target_name: input.targetName ?? null,
      reason: input.reason,
      description: input.description ?? null,
      severity: SEVERITY_EN[input.severity ?? ''] ?? input.severity ?? null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('reports').insert(row);
    setLoading(false);
    if (error) { console.error('[TRUST] create report', error); return false; }
    return true;
  }, []);

  return { createReport, loading };
}

// ── Admin functions ────────────────────────────────────────────────────────────

export async function adminApproveDocument(userId: string): Promise<boolean> {
  const { data: current, error: fetchErr } = await supabase
    .from('verification_status')
    .select('email_verified, university_email_verified, verified_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr) {
    console.error('[TRUST] adminApproveDocument fetch:', fetchErr.message);
    return false;
  }

  const emailVerified = !!current?.email_verified;
  const uniVerified = !!current?.university_email_verified;
  const level = computeVerificationLevel(emailVerified, uniVerified, true);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('verification_status')
    .update({
      document_verified: true,
      document_review_status: 'approved',
      document_reviewed_at: now,
      document_rejection_reason: null,
      verified_at: current?.verified_at ?? now,
      level,
      updated_at: now,
    })
    .eq('user_id', userId);

  if (error) {
    console.warn('[TRUST] adminApproveDocument error:', error.message);
    return false;
  }
  return true;
}

export async function adminRejectDocument(userId: string, reason = 'Documento rejeitado pelo administrador.'): Promise<boolean> {
  const { data: current, error: fetchErr } = await supabase
    .from('verification_status')
    .select('email_verified, university_email_verified')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr) {
    console.error('[TRUST] adminRejectDocument fetch:', fetchErr.message);
    return false;
  }

  const emailVerified = !!current?.email_verified;
  const uniVerified = !!current?.university_email_verified;
  const level = computeVerificationLevel(emailVerified, uniVerified, false);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('verification_status')
    .update({
      document_verified: false,
      document_review_status: 'rejected',
      document_reviewed_at: now,
      document_rejection_reason: reason,
      level,
      updated_at: now,
    })
    .eq('user_id', userId);

  if (error) {
    console.warn('[TRUST] adminRejectDocument error:', error.message);
    return false;
  }
  return true;
}

export async function adminUpsertVerification(userId: string, fields: Partial<VerificationStatus>): Promise<boolean> {
  const emailVerified = fields.emailVerified ?? false;
  const uniVerified = fields.universityEmailVerified ?? false;
  const docVerified = fields.documentVerified ?? false;
  const level = computeVerificationLevel(emailVerified, uniVerified, docVerified);

  const row: Record<string, any> = {
    user_id: userId,
    level,
    email_verified: emailVerified,
    university_email_verified: uniVerified,
    document_verified: docVerified,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('verification_status')
    .upsert(row, { onConflict: 'user_id' });
  if (error) {
    console.warn('[TRUST] adminUpsertVerification blocked by RLS (admin policy needed):', error.message);
    return false;
  }
  return true;
}

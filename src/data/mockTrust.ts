import { Review, VerificationStatus, Report, TrustScore, LandlordStats, VerificationLevel, TrustLevel } from '../types/trust';

export const mockReviews: Review[] = [
  {
    id: 'rev1',
    accommodationId: '1',
    userId: 'senhorio',
    reviewerId: 'u1',
    reviewerName: 'Miguel Ferreira',
    rating: 5,
    criteria: {
      quality: 5,
      coexistence: 5,
      landlordResponse: 5,
      location: 5,
      valueForMoney: 4,
    },
    comment: 'Excelente experiência! O alojamento é exatamente como descrito, muito limpo e bem localizado. O senhorio sempre foi muito prestável e respondia rapidamente a qualquer questão.',
    recommend: true,
    helpful: 12,
    createdAt: new Date('2026-03-15'),
    verified: true,
  },
  {
    id: 'rev2',
    accommodationId: '1',
    userId: 'senhorio',
    reviewerId: 'u2',
    reviewerName: 'Sofia Martins',
    rating: 4,
    criteria: {
      quality: 4,
      coexistence: 4,
      landlordResponse: 5,
      location: 5,
      valueForMoney: 3,
    },
    comment: 'Boa experiência no geral. A casa é confortável e a localização é perfeita para ir a pé para a faculdade. O senhorio é atencioso. Único ponto negativo é que às vezes a internet ficava lenta.',
    recommend: true,
    helpful: 8,
    createdAt: new Date('2026-02-20'),
    verified: true,
  },
];

export const mockVerifications: Record<string, VerificationStatus> = {
  'estudante': {
    userId: 'estudante',
    level: 'silver',
    emailVerified: true,
    universityEmailVerified: true,
    documentVerified: false,
    photoVerified: false,
    verifiedAt: new Date('2026-04-01'),
  },
  'senhorio': {
    userId: 'senhorio',
    level: 'gold',
    emailVerified: true,
    universityEmailVerified: false,
    documentVerified: true,
    photoVerified: true,
    verifiedAt: new Date('2025-01-15'),
  },
};

export const mockReports: Report[] = [];

export const mockTrustScores: Record<string, TrustScore> = {
  'estudante': {
    userId: 'estudante',
    level: 'confirmed',
    score: 75,
    verificationLevel: 'silver',
    reviewsCount: 0,
    averageRating: 0,
    responseRate: 0,
    responseTime: 0,
    memberSince: new Date('2026-04-01'),
    resolvedReports: 0,
    totalReports: 0,
  },
  'senhorio': {
    userId: 'senhorio',
    level: 'trusted',
    score: 95,
    verificationLevel: 'gold',
    reviewsCount: 24,
    averageRating: 4.7,
    responseRate: 98,
    responseTime: 2,
    memberSince: new Date('2024-06-10'),
    resolvedReports: 2,
    totalReports: 2,
  },
};

export const mockLandlordStats: Record<string, LandlordStats> = {
  'senhorio': {
    userId: 'senhorio',
    verified: true,
    averageRating: 4.7,
    totalReviews: 24,
    responseRate: 98,
    averageResponseTime: 2,
    memberSince: new Date('2024-06-10'),
    activeListings: 8,
    completedRentals: 45,
    resolvedIssues: 2,
    totalIssues: 2,
  },
};

// Helper functions
export function getReviewsForAccommodation(accommodationId: string): Review[] {
  return mockReviews.filter(r => r.accommodationId === accommodationId);
}

export function getVerificationStatus(userId: string): VerificationStatus | null {
  return mockVerifications[userId] || null;
}

export function getTrustScore(userId: string): TrustScore | null {
  return mockTrustScores[userId] || null;
}

export function getLandlordStats(userId: string): LandlordStats | null {
  return mockLandlordStats[userId] || null;
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

export function createReview(
  accommodationId: string,
  userId: string,
  reviewerId: string,
  reviewerName: string,
  rating: number,
  criteria: Review['criteria'],
  comment: string,
  recommend: boolean
): Review {
  const newReview: Review = {
    id: `rev${mockReviews.length + 1}`,
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

  mockReviews.push(newReview);
  return newReview;
}

export function createReport(
  reporterId: string,
  reportedType: Report['reportedType'],
  reportedId: string,
  reason: Report['reason'],
  description: string
): Report {
  const newReport: Report = {
    id: `rep${mockReports.length + 1}`,
    reporterId,
    reportedType,
    reportedId,
    reason,
    description,
    status: 'pending',
    createdAt: new Date(),
  };

  mockReports.push(newReport);
  return newReport;
}

export function updateVerificationStatus(
  userId: string,
  updates: Partial<VerificationStatus>
): VerificationStatus {
  const current = mockVerifications[userId] || {
    userId,
    level: 'none' as VerificationLevel,
    emailVerified: false,
    universityEmailVerified: false,
    documentVerified: false,
    photoVerified: false,
  };

  const updated = { ...current, ...updates };

  // Calculate level based on verifications
  if (updated.emailVerified && updated.universityEmailVerified && updated.documentVerified && updated.photoVerified) {
    updated.level = 'gold';
  } else if (updated.emailVerified && updated.universityEmailVerified) {
    updated.level = 'silver';
  } else if (updated.emailVerified) {
    updated.level = 'bronze';
  } else {
    updated.level = 'none';
  }

  mockVerifications[userId] = updated;
  return updated;
}

export function markReviewHelpful(reviewId: string): void {
  const review = mockReviews.find(r => r.id === reviewId);
  if (review) {
    review.helpful++;
  }
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
    const roundedRating = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
    distribution[roundedRating]++;
  });

  const criteriaAverages = {
    quality: reviews.reduce((sum, r) => sum + r.criteria.quality, 0) / reviews.length,
    coexistence: reviews.reduce((sum, r) => sum + r.criteria.coexistence, 0) / reviews.length,
    landlordResponse: reviews.reduce((sum, r) => sum + r.criteria.landlordResponse, 0) / reviews.length,
    location: reviews.reduce((sum, r) => sum + r.criteria.location, 0) / reviews.length,
    valueForMoney: reviews.reduce((sum, r) => sum + r.criteria.valueForMoney, 0) / reviews.length,
  };

  return {
    average: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
    total: reviews.length,
    distribution,
    criteriaAverages,
  };
}

export interface Review {
  id: string;
  accommodationId?: string;
  userId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  criteria: {
    quality: number;
    coexistence: number;
    landlordResponse: number;
    location: number;
    valueForMoney: number;
  };
  comment: string;
  recommend: boolean;
  helpful: number;
  createdAt: Date;
  verified: boolean;
}

export type VerificationLevel = 'none' | 'bronze' | 'silver' | 'gold';

export interface VerificationStatus {
  userId: string;
  level: VerificationLevel;
  emailVerified: boolean;
  universityEmailVerified: boolean;
  documentVerified: boolean;
  photoVerified: boolean;
  verifiedAt?: Date;
}

export type ReportReason =
  | 'inappropriate_content'
  | 'fake_listing'
  | 'scam'
  | 'harassment'
  | 'discrimination'
  | 'spam'
  | 'other';

export interface Report {
  id: string;
  reporterId: string;
  reportedType: 'accommodation' | 'user' | 'message' | 'review';
  reportedId: string;
  reason: ReportReason;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  resolvedAt?: Date;
}

export type TrustLevel = 'new' | 'confirmed' | 'trusted';

export interface TrustScore {
  userId: string;
  level: TrustLevel;
  score: number; // 0-100
  verificationLevel: VerificationLevel;
  reviewsCount: number;
  averageRating: number;
  responseRate: number;
  responseTime: number; // in hours
  memberSince: Date;
  resolvedReports: number;
  totalReports: number;
}

export interface LandlordStats {
  userId: string;
  verified: boolean;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  averageResponseTime: number; // in hours
  memberSince: Date;
  activeListings: number;
  completedRentals: number;
  resolvedIssues: number;
  totalIssues: number;
}

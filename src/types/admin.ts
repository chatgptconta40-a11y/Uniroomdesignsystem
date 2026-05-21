export interface AdminMetrics {
  totalUsers: number;
  totalStudents: number;
  totalLandlords: number;
  activeListings: number;
  pendingReports: number;
  monthlyGrowth: number;
  newUsersToday: number;
  newListingsToday: number;
}

export interface GrowthData {
  month: string;
  users: number;
  listings: number;
  applications: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  link?: string;
}

export interface ActivityLog {
  id: string;
  type: 'user_registration' | 'listing_created' | 'report_submitted' | 'application_accepted';
  userId: string;
  userName: string;
  description: string;
  timestamp: Date;
}

export interface SuspiciousActivity {
  id: string;
  type: 'user' | 'listing';
  targetId: string;
  targetName: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface PlatformStats {
  conversionRate: number;
  averageResponseTime: number;
  userSatisfaction: number;
  activeListingsRate: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  type: 'student' | 'landlord' | 'admin';
  status: 'active' | 'suspended' | 'blocked';
  verified: boolean;
  verificationLevel: 'none' | 'bronze' | 'silver' | 'gold';
  trustScore: number;
  createdAt: Date;
  lastActive: Date;
  totalListings?: number;
  totalApplications?: number;
  reportsReceived: number;
  reportsSubmitted: number;
}

export interface AdminListing {
  id: string;
  title: string;
  landlordId: string;
  landlordName: string;
  city: string;
  zone: string;
  price: number;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  views: number;
  applications: number;
  createdAt: Date;
  updatedAt: Date;
  flags: number;
  suspiciousScore: number;
}

export interface AdminReport {
  id: string;
  type: 'user' | 'listing';
  targetId: string;
  targetName: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface BusinessMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  averageBookingValue: number;
  successfulMatches: number;
  conversionRate: number;
  churnRate: number;
}

export interface RetentionData {
  period: string;
  studentsRetained: number;
  landlordsRetained: number;
  studentsTotal: number;
  landlordsTotal: number;
}

export interface CityActivity {
  city: string;
  activeListings: number;
  activeUsers: number;
  applications: number;
  growth: number;
}

export interface ModerationMetrics {
  totalReports: number;
  resolvedReports: number;
  averageResolutionTime: number;
  accuracyRate: number;
  falsePositives: number;
  automatedActions: number;
}

export interface SystemSettings {
  maxListingsPerLandlord: number;
  maxApplicationsPerStudent: number;
  minTrustScoreForListing: number;
  autoSuspendThreshold: number;
  reportReviewTimeLimit: number;
}

export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
  action: 'flag' | 'suspend' | 'block';
  threshold: number;
}
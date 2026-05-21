export interface ListingAnalytics {
  listingId: string;
  listingTitle: string;
  period: 'week' | 'month' | 'all';
  views: number;
  favorites: number;
  applications: number;
  messages: number;
  conversionRate: number; // applications / views * 100
  favoriteRate: number; // favorites / views * 100
  viewTrend: number; // % change from previous period
  applicationTrend: number;
}

export interface PerformanceInsight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  action?: string;
}

export interface ComparisonData {
  metric: string;
  yourValue: number;
  average: number;
  topPerformer: number;
}

export interface LandlordMetrics {
  activeListings: number;
  pendingApplications: number;
  unreadMessages: number;
  averageRating: number;
  totalViews: number;
  totalFavorites: number;
  responseRate: number;
}

export interface ListingStats {
  listingId: string;
  views: number;
  favorites: number;
  applications: number;
  conversionRate: number;
}

export type ListingStatus = 'active' | 'inactive' | 'draft' | 'paused';

export interface LandlordListing {
  id: string;
  title: string;
  city: string;
  zone: string;
  price: number;
  image: string;
  status: ListingStatus;
  views: number;
  favorites: number;
  applications: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardActivity {
  type: 'application' | 'message' | 'favorite' | 'view';
  id: string;
  listingTitle: string;
  userName: string;
  timestamp: Date;
  read: boolean;
}

export interface PerformanceData {
  date: string;
  views: number;
  applications: number;
  messages: number;
}

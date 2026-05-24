import { LandlordMetrics, LandlordListing, DashboardActivity, PerformanceData, ListingStatus } from '../types/landlord';

export const mockLandlordMetrics: Record<string, LandlordMetrics> = {
  'senhorio': {
    activeListings: 8,
    pendingApplications: 12,
    unreadMessages: 5,
    averageRating: 4.7,
    totalViews: 1248,
    totalFavorites: 89,
    responseRate: 98,
  },
};

export const mockLandlordListings: LandlordListing[] = [
  {
    id: '1',
    title: 'Quarto confortável em Viseu Centro',
    city: 'Viseu',
    zone: 'Centro',
    price: 280,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    status: 'active',
    views: 245,
    favorites: 18,
    applications: 8,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-15'),
  },
  {
    id: '3',
    title: 'Quarto Confortável no Porto',
    city: 'Porto',
    zone: 'Cedofeita',
    price: 320,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    status: 'active',
    views: 189,
    favorites: 15,
    applications: 6,
    createdAt: new Date('2026-03-20'),
    updatedAt: new Date('2026-04-12'),
  },
  {
    id: '5',
    title: 'Apartamento T2 Perto da Universidade',
    city: 'Coimbra',
    zone: 'Polo II',
    price: 450,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    status: 'active',
    views: 312,
    favorites: 24,
    applications: 12,
    createdAt: new Date('2026-03-10'),
    updatedAt: new Date('2026-04-18'),
  },
  {
    id: '7',
    title: 'Quarto em Casa Partilhada - Braga',
    city: 'Braga',
    zone: 'São Victor',
    price: 260,
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
    status: 'paused',
    views: 156,
    favorites: 9,
    applications: 3,
    createdAt: new Date('2026-02-28'),
    updatedAt: new Date('2026-04-10'),
  },
  {
    id: '9',
    title: 'Apartamento T1 Mobilado - Lisboa',
    city: 'Lisboa',
    zone: 'Saldanha',
    price: 520,
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    status: 'draft',
    views: 0,
    favorites: 0,
    applications: 0,
    createdAt: new Date('2026-04-19'),
    updatedAt: new Date('2026-04-19'),
  },
];

export const mockDashboardActivity: DashboardActivity[] = [
  {
    type: 'application',
    id: 'app1',
    listingTitle: 'Quarto confortável em Viseu Centro',
    userName: 'Estudante UniRoom',
    timestamp: new Date('2026-04-19T09:00:00'),
    read: false,
  },
  {
    type: 'message',
    id: 'msg1',
    listingTitle: 'Quarto Confortável no Porto',
    userName: 'Maria Silva',
    timestamp: new Date('2026-04-18T15:30:00'),
    read: false,
  },
  {
    type: 'application',
    id: 'app2',
    listingTitle: 'Apartamento T2 Perto da Universidade',
    userName: 'João Santos',
    timestamp: new Date('2026-04-18T11:20:00'),
    read: true,
  },
  {
    type: 'favorite',
    id: 'fav1',
    listingTitle: 'Quarto confortável em Viseu Centro',
    userName: 'Ana Costa',
    timestamp: new Date('2026-04-17T16:45:00'),
    read: true,
  },
  {
    type: 'message',
    id: 'msg2',
    listingTitle: 'Quarto Confortável no Porto',
    userName: 'Pedro Oliveira',
    timestamp: new Date('2026-04-17T10:15:00'),
    read: true,
  },
];

export const mockPerformanceData: PerformanceData[] = [
  { date: '2026-03-20', views: 28, applications: 2, messages: 4 },
  { date: '2026-03-21', views: 35, applications: 3, messages: 5 },
  { date: '2026-03-22', views: 42, applications: 1, messages: 3 },
  { date: '2026-03-23', views: 31, applications: 4, messages: 6 },
  { date: '2026-03-24', views: 38, applications: 2, messages: 4 },
  { date: '2026-03-25', views: 45, applications: 3, messages: 7 },
  { date: '2026-03-26', views: 52, applications: 5, messages: 8 },
  { date: '2026-03-27', views: 48, applications: 3, messages: 5 },
  { date: '2026-03-28', views: 41, applications: 2, messages: 4 },
  { date: '2026-03-29', views: 36, applications: 4, messages: 6 },
  { date: '2026-03-30', views: 44, applications: 3, messages: 5 },
  { date: '2026-03-31', views: 50, applications: 5, messages: 9 },
  { date: '2026-04-01', views: 55, applications: 6, messages: 10 },
  { date: '2026-04-02', views: 48, applications: 4, messages: 7 },
  { date: '2026-04-03', views: 52, applications: 5, messages: 8 },
  { date: '2026-04-04', views: 46, applications: 3, messages: 6 },
  { date: '2026-04-05', views: 58, applications: 7, messages: 11 },
  { date: '2026-04-06', views: 62, applications: 8, messages: 12 },
  { date: '2026-04-07', views: 55, applications: 5, messages: 9 },
  { date: '2026-04-08', views: 51, applications: 4, messages: 7 },
  { date: '2026-04-09', views: 47, applications: 3, messages: 6 },
  { date: '2026-04-10', views: 54, applications: 6, messages: 10 },
  { date: '2026-04-11', views: 60, applications: 7, messages: 11 },
  { date: '2026-04-12', views: 65, applications: 8, messages: 13 },
  { date: '2026-04-13', views: 58, applications: 6, messages: 10 },
  { date: '2026-04-14', views: 52, applications: 5, messages: 8 },
  { date: '2026-04-15', views: 49, applications: 4, messages: 7 },
  { date: '2026-04-16', views: 56, applications: 6, messages: 9 },
  { date: '2026-04-17', views: 61, applications: 7, messages: 12 },
  { date: '2026-04-18', views: 68, applications: 9, messages: 14 },
];

// Helper functions
export function getLandlordMetrics(landlordId: string): LandlordMetrics | null {
  return mockLandlordMetrics[landlordId] || null;
}

export function getLandlordListings(landlordId: string, status?: ListingStatus): LandlordListing[] {
  let listings = mockLandlordListings;

  if (status) {
    listings = listings.filter(l => l.status === status);
  }

  return listings;
}

export function getDashboardActivity(landlordId: string): DashboardActivity[] {
  return mockDashboardActivity;
}

export function getPerformanceData(landlordId: string, days: number = 30): PerformanceData[] {
  return mockPerformanceData.slice(-days);
}

export function updateListingStatus(listingId: string, status: ListingStatus): boolean {
  const listing = mockLandlordListings.find(l => l.id === listingId);
  if (listing) {
    listing.status = status;
    listing.updatedAt = new Date();
    return true;
  }
  return false;
}

export function deleteListing(listingId: string): boolean {
  const index = mockLandlordListings.findIndex(l => l.id === listingId);
  if (index !== -1) {
    mockLandlordListings.splice(index, 1);
    return true;
  }
  return false;
}

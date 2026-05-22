export type RoomType = 'shared' | 'private' | 'studio' | 'apartment';
export type AccommodationStatus = 'active' | 'paused' | 'draft' | 'archived';

export interface Accommodation {
  id: string;
  title: string;
  description: string;
  city: string;
  zone: string;
  address: string;
  price: number; // monthly
  images: string[];
  landlordId: string;

  // Room details
  roomType: RoomType;
  currentOccupants: number;
  maxOccupants: number;

  // Location
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceToUniversity: number; // in km
  universityName: string;

  // Amenities
  amenities: {
    furnished: boolean;
    wifi: boolean;
    utilitiesIncluded: boolean;
    kitchen: boolean;
    washingMachine: boolean;
    balcony: boolean;
    parking: boolean;
    airConditioning: boolean;
    heating: boolean;
    elevator: boolean;
  };

  // Costs
  utilities?: number; // monthly utilities cost if not included

  // Availability
  availableFrom: Date;
  minimumStay: number; // in months
  status: AccommodationStatus;

  // Verification
  verified: boolean;

  // Compatibility (calculated based on user profile)
  compatibilityScore?: number; // 0-100

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  views: number;
}

export interface SearchFilters {
  cities?: string[];
  minPrice?: number;
  maxPrice?: number;
  roomTypes?: RoomType[];
  minCompatibility?: number;
  maxDistance?: number;
  availableFrom?: Date;
  amenities?: string[];
  sortBy?: 'compatibility' | 'price_asc' | 'price_desc' | 'distance' | 'recent';
}

export interface FavoriteAccommodation {
  userId: string;
  accommodationId: string;
  savedAt: Date;
}

export type ApplicationStatus = 'pending' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';

export interface Application {
  id: string;
  userId: string;
  accommodationId: string;
  roomId?: string;
  propertyId?: string;
  landlordId: string;
  status: ApplicationStatus;
  message: string;
  moveInDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'application_update' | 'message' | 'favorite_available' | 'reminder';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

export interface ActiveHome {
  id: string;
  studentId: string;
  propertyId: string;
  roomId: string;
  applicationId: string;
  landlordId: string;
  landlordName: string;
  moveInDate: Date;
  contractEndDate: Date;
  paymentDay: number;
  createdAt: Date;
}
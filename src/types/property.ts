export interface Property {
  id: string;
  landlordId: string;
  title: string;
  description: string;

  address: string;
  city: string;
  zone: string;
  distanceToUniversity: number;
  coordinates?: { lat: number; lng: number };

  images: string[];

  amenities: {
    wifi: boolean;
    parking: boolean;
    gym: boolean;
    laundry: boolean;
    kitchen: boolean;
    livingRoom: boolean;
    backyard: boolean;
    airConditioning: boolean;
    heating: boolean;
    dishwasher: boolean;
    microwave: boolean;
    elevator: boolean;
  };

  houseRules?: {
    smoking: boolean;
    pets: boolean;
    parties: boolean;
    quietHours?: string;
  };

  totalRooms: number;
  roomIds: string[];

  wholePropertyAvailable: boolean;
  wholePropertyPrice?: number;
  wholePropertyUtilities?: number;
  wholePropertyMinimumStay?: number;

  status: 'active' | 'paused' | 'draft' | 'archived';
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  views: number;
}

export interface Room {
  id: string;
  propertyId: string;
  landlordId: string;

  roomNumber: string;
  title: string;
  description: string;

  images: string[];

  size?: number;
  roomType: 'private' | 'shared' | 'studio' | 'apartment';
  maxOccupants: number;

  privateBathroom: boolean;
  balcony: boolean;
  desk: boolean;
  wardrobe: boolean;
  airConditioning: boolean;

  price: number;
  utilities?: number;
  availableFrom: Date;
  minimumStay: number;

  status: 'available' | 'reserved' | 'occupied' | 'paused' | 'draft';

  // Reservation/Occupation info
  reservedBy?: string; // student ID
  occupiedBy?: string; // student ID
  moveInDate?: Date; // Expected or actual move-in date

  compatibilityScore?: number;

  createdAt: Date;
  updatedAt: Date;
  views: number;
}

export type PropertyStatus = 'active' | 'paused' | 'draft' | 'archived';

export type RoomStatus = 'available' | 'reserved' | 'occupied' | 'paused' | 'draft';
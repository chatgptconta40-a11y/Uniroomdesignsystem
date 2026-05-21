import { LifestyleProfile } from './profile';

export interface Roommate {
  id: string;
  name: string;
  age: number;
  course: string;
  university: string;
  photoUrl?: string;
  verified: boolean;
  lifestyle: LifestyleProfile;
  bio?: string;
}

export interface Review {
  id: string;
  accommodationId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
  helpful: number;
}

export interface HouseRules {
  smokingAllowed: boolean;
  smokingLocation?: string;
  petsAllowed: boolean;
  guestsPolicy: string;
  quietHours?: string;
  sharedSpaces: string[];
  cleaningSchedule?: string;
  other?: string[];
}

export interface CompatibilityBreakdown {
  overall: number; // 0-100
  categories: {
    schedule: number;
    cleanliness: number;
    noise: number;
    habits: number;
    guests: number;
    social: number;
  };
  summary: string;
}

export interface ComfortScore {
  overall: number; // 0-10
  breakdown: {
    compatibility: number;
    reviews: number;
    location: number;
    amenities: number;
  };
  label: string; // "Excelente", "Muito Bom", etc.
}

export interface ListingFormData {
  // Step 1: Basic Info
  title: string;
  description: string;
  city: string;
  zone: string;
  address: string;

  // Step 2: Characteristics
  roomType: 'shared' | 'private' | 'studio' | 'apartment';
  maxOccupants: number;
  currentOccupants: number;

  // Step 3: Photos
  images: string[];

  // Step 4: Price
  price: number;
  utilities?: number;
  utilitiesIncluded: boolean;

  // Step 5: Availability
  availableFrom: string;
  minimumStay: number;

  // Step 6: Rules
  smokingAllowed: boolean;
  smokingLocation?: string;
  petsAllowed: boolean;
  guestsPolicy: string;
  quietHours?: string;
  cleaningSchedule?: string;
  otherRules: string[];

  // Step 7: Ideal Occupant
  idealOccupant: {
    preferredGender?: 'male' | 'female' | 'any';
    preferredAge?: { min: number; max: number };
    studentOnly: boolean;
    smoking: boolean;
    pets: boolean;
    personality?: 'introvert' | 'moderate' | 'extrovert' | 'any';
  };

  // Step 8: Amenities
  amenities: {
    furnished: boolean;
    wifi: boolean;
    kitchen: boolean;
    washingMachine: boolean;
    balcony: boolean;
    parking: boolean;
    airConditioning: boolean;
    heating: boolean;
    elevator: boolean;
  };
}

export const defaultFormData: ListingFormData = {
  title: '',
  description: '',
  city: '',
  zone: '',
  address: '',
  roomType: 'private',
  maxOccupants: 1,
  currentOccupants: 0,
  images: [],
  price: 0,
  utilitiesIncluded: false,
  availableFrom: '',
  minimumStay: 6,
  smokingAllowed: false,
  petsAllowed: false,
  guestsPolicy: '',
  otherRules: [],
  idealOccupant: {
    studentOnly: false,
    smoking: false,
    pets: false,
  },
  amenities: {
    furnished: false,
    wifi: false,
    kitchen: false,
    washingMachine: false,
    balcony: false,
    parking: false,
    airConditioning: false,
    heating: false,
    elevator: false,
  },
};

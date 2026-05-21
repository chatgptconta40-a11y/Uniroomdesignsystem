export interface PersonalProfile {
  userId: string;
  photoUrl?: string;
  fullName: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  course?: string;
  institution?: string;
  yearOfStudy?: number;
  hometown?: string;
  bio?: string;
  languages?: string[];
}

export interface LifestyleProfile {
  userId: string;
  // Horários
  bedtime?: 'early' | 'moderate' | 'late'; // antes 22h, 22h-00h, depois 00h
  wakeupTime?: 'early' | 'moderate' | 'late'; // antes 7h, 7h-9h, depois 9h
  schedule?: 'morning' | 'flexible' | 'night'; // matutino, flexível, noturno

  // Limpeza
  cleanliness?: number; // 1-5 (1=muito desorganizado, 5=muito organizado)
  cleaningFrequency?: 'daily' | 'weekly' | 'monthly'; // diário, semanal, mensal

  // Ruído
  noiseTolerance?: number; // 1-5 (1=nenhuma, 5=muita)
  musicVolume?: 'quiet' | 'moderate' | 'loud'; // baixo, moderado, alto

  // Visitas
  guestsFrequency?: 'never' | 'rarely' | 'sometimes' | 'often'; // nunca, raramente, às vezes, frequentemente
  guestsAcceptance?: number; // 1-5 (1=não aceita, 5=totalmente aberto)

  // Hábitos
  smoking?: boolean;
  pets?: boolean;
  cooking?: 'never' | 'rarely' | 'sometimes' | 'often';

  // Social
  personality?: 'introvert' | 'moderate' | 'extrovert';
  socialPreference?: 'quiet' | 'moderate' | 'social'; // casa tranquila, equilibrada, social
}

export interface AccommodationPreferences {
  userId: string;
  maxBudget?: number;
  preferredCities?: string[];
  maxDistanceFromUniversity?: number; // em km
  moveInDate?: Date;
  stayDuration?: number; // em meses
  roomType?: 'shared' | 'private' | 'studio' | 'apartment';
  amenities?: {
    furnished?: boolean;
    wifi?: boolean;
    utilitiesIncluded?: boolean;
    kitchen?: boolean;
    washingMachine?: boolean;
    balcony?: boolean;
    parking?: boolean;
  };
}

export interface StudentProfile {
  personal: PersonalProfile;
  lifestyle: LifestyleProfile;
  preferences: AccommodationPreferences;
  completeness: {
    personal: number; // 0-100
    lifestyle: number; // 0-100
    preferences: number; // 0-100
    overall: number; // 0-100
  };
  onboardingCompleted: boolean;
}

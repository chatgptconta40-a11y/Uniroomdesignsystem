import type { StudentProfile } from '../types/profile';
import type { Room, Property } from '../types/property';

export interface PersonalizedCompatibility {
  overall: number;
  categories: {
    schedule: number;
    cleanliness: number;
    noise: number;
    habits: number;
    guests: number;
    social: number;
    budget: number;
    location: number;
    rules: number;
  };
  label: string;
  summary: string;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function scoreByDifference(value: number | undefined, target: number, penalty = 16) {
  const safeValue = typeof value === 'number' ? value : target;
  return clamp(100 - Math.abs(safeValue - target) * penalty);
}

function scoreChoice(value: unknown, idealValues: unknown[], partialValues: unknown[] = []) {
  if (idealValues.includes(value)) return 100;
  if (partialValues.includes(value)) return 75;
  if (value === undefined || value === null || value === '') return 65;
  return 55;
}

function inferRoomLifestyle(room: Room, property: Property) {
  const isStudioLike = room.roomType === 'studio' || room.roomType === 'apartment';
  const quietRules = Boolean(property.houseRules?.quietHours || property.houseRules?.parties === false);
  const billsIncluded = !room.utilities || room.utilities <= 0;

  return {
    scheduleTarget: quietRules ? 'regular' : 'flexible',
    cleanlinessTarget: property.amenities.kitchen ? 4 : 3,
    noiseTarget: quietRules ? 2 : 3,
    guestsTarget: property.houseRules?.parties === false ? 'rarely' : 'sometimes',
    socialTarget: isStudioLike ? 'calm' : 'moderate',
    smokingAllowed: Boolean(property.houseRules?.smoking),
    petsAllowed: Boolean(property.houseRules?.pets),
    cookingTarget: property.amenities.kitchen ? 'often' : 'sometimes',
    billsIncluded,
  };
}

export function getPersonalizedCompatibility(
  profile: StudentProfile | null,
  room: Room,
  property: Property,
): PersonalizedCompatibility | null {
  if (!profile) return null;

  const lifestyle = profile.lifestyle || {};
  const preferences = profile.preferences || {};
  const inferred = inferRoomLifestyle(room, property);

  const schedule = scoreChoice(
    lifestyle.schedule,
    [inferred.scheduleTarget, 'flexible'],
    ['moderate', 'regular'],
  );

  const cleanliness = scoreByDifference(
    typeof lifestyle.cleanliness === 'number' ? lifestyle.cleanliness : undefined,
    inferred.cleanlinessTarget,
    14,
  );

  const noise = scoreByDifference(
    typeof lifestyle.noiseTolerance === 'number' ? lifestyle.noiseTolerance : undefined,
    inferred.noiseTarget,
    12,
  );

  const habitsParts = [
    typeof lifestyle.smoking === 'boolean'
      ? inferred.smokingAllowed || lifestyle.smoking === false
        ? 100
        : 45
      : 75,
    typeof lifestyle.pets === 'boolean'
      ? inferred.petsAllowed || lifestyle.pets === false
        ? 100
        : 65
      : 75,
    scoreChoice(lifestyle.cooking, [inferred.cookingTarget], ['sometimes', 'often']),
  ];
  const habits = clamp(habitsParts.reduce((sum, value) => sum + value, 0) / habitsParts.length);

  const guests = clamp(
    (
      scoreChoice(lifestyle.guestsFrequency, [inferred.guestsTarget], ['rarely', 'sometimes']) +
      scoreByDifference(
        typeof lifestyle.guestsAcceptance === 'number' ? lifestyle.guestsAcceptance : undefined,
        property.houseRules?.parties === false ? 2 : 3,
        12,
      )
    ) / 2,
  );

  const social = clamp(
    (
      scoreChoice(lifestyle.socialPreference, [inferred.socialTarget], ['moderate', 'calm']) +
      scoreChoice(lifestyle.personality, ['moderate', inferred.socialTarget], ['introvert', 'extrovert'])
    ) / 2,
  );

  const totalPrice = room.price + (room.utilities || 0);
  const budget = preferences.maxBudget
    ? clamp(100 - Math.max(0, totalPrice - preferences.maxBudget) * 0.7 + Math.max(0, preferences.maxBudget - totalPrice) * 0.05)
    : 75;

  const location = preferences.maxDistanceFromUniversity
    ? clamp(100 - Math.max(0, property.distanceToUniversity - preferences.maxDistanceFromUniversity) * 18)
    : clamp(100 - property.distanceToUniversity * 8);

  const preferredCities = preferences.preferredCities || [];
  const cityBoost = preferredCities.length === 0 || preferredCities.includes(property.city) ? 100 : 75;

  const roomType = preferences.roomType
    ? room.roomType === preferences.roomType
      ? 100
      : room.roomType === 'private' && preferences.roomType === 'shared'
        ? 80
        : 65
    : 75;

  const rules = clamp(
    (
      (property.houseRules?.studentsOnly ? 100 : 85) +
      (property.houseRules?.parties === false ? 95 : 75) +
      (property.verified ? 100 : 80) +
      cityBoost +
      roomType
    ) / 5,
  );

  const overall = clamp(
    schedule * 0.16 +
    cleanliness * 0.18 +
    noise * 0.16 +
    habits * 0.12 +
    guests * 0.08 +
    social * 0.10 +
    budget * 0.10 +
    location * 0.06 +
    rules * 0.04,
  );

  const label =
    overall >= 85
      ? 'Compatibilidade alta'
      : overall >= 70
        ? 'Boa compatibilidade'
        : overall >= 55
          ? 'Compatibilidade moderada'
          : 'Compatibilidade baixa';

  const summary =
    overall >= 85
      ? 'Este quarto encaixa muito bem no teu perfil de convivência e preferências.'
      : overall >= 70
        ? 'Este quarto parece uma boa opção para o teu perfil, com alguns pontos a validar.'
        : overall >= 55
          ? 'Este quarto pode funcionar, mas há diferenças relevantes nos hábitos ou preferências.'
          : 'Este quarto tem pouca compatibilidade com o teu perfil atual.';

  return {
    overall,
    categories: {
      schedule,
      cleanliness,
      noise,
      habits,
      guests,
      social,
      budget,
      location,
      rules,
    },
    label,
    summary,
  };
}

export function getRoomCompatibilityScore(
  profile: StudentProfile | null,
  room: Room,
  property: Property,
): number | undefined {
  return getPersonalizedCompatibility(profile, room, property)?.overall;
}

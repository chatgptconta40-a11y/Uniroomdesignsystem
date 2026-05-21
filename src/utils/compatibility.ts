import { LifestyleProfile } from '../types/profile';
import { Roommate, CompatibilityBreakdown, ComfortScore } from '../types/roommate';
import { Accommodation } from '../types/accommodation';

// Calculate compatibility between user and roommates
export function calculateCompatibility(
  userLifestyle: LifestyleProfile,
  roommates: Roommate[]
): CompatibilityBreakdown {
  if (roommates.length === 0) {
    return {
      overall: 100,
      categories: {
        schedule: 100,
        cleanliness: 100,
        noise: 100,
        habits: 100,
        guests: 100,
        social: 100,
      },
      summary: 'Sem moradores atuais para comparar.',
    };
  }

  // Calculate average roommate lifestyle
  const avgLifestyle = averageLifestyles(roommates.map(r => r.lifestyle));

  // Calculate category scores
  const schedule = calculateScheduleScore(userLifestyle, avgLifestyle);
  const cleanliness = calculateCleanlinessScore(userLifestyle, avgLifestyle);
  const noise = calculateNoiseScore(userLifestyle, avgLifestyle);
  const habits = calculateHabitsScore(userLifestyle, avgLifestyle);
  const guests = calculateGuestsScore(userLifestyle, avgLifestyle);
  const social = calculateSocialScore(userLifestyle, avgLifestyle);

  // Weighted overall score
  const overall = Math.round(
    schedule * 0.20 +
    cleanliness * 0.25 +
    noise * 0.20 +
    habits * 0.15 +
    guests * 0.10 +
    social * 0.10
  );

  const summary = generateCompatibilitySummary(overall);

  return {
    overall,
    categories: {
      schedule,
      cleanliness,
      noise,
      habits,
      guests,
      social,
    },
    summary,
  };
}

function averageLifestyles(lifestyles: LifestyleProfile[]): LifestyleProfile {
  // Simplified average - in real implementation would be more sophisticated
  return lifestyles[0] || {};
}

function calculateScheduleScore(user: LifestyleProfile, avg: LifestyleProfile): number {
  let score = 100;

  // Compare bedtime
  if (user.bedtime !== avg.bedtime) {
    score -= 15;
  }

  // Compare wakeup time
  if (user.wakeupTime !== avg.wakeupTime) {
    score -= 15;
  }

  // Compare schedule preference
  if (user.schedule !== avg.schedule) {
    score -= 10;
  }

  return Math.max(0, score);
}

function calculateCleanlinessScore(user: LifestyleProfile, avg: LifestyleProfile): number {
  let score = 100;

  const userCleanliness = user.cleanliness || 3;
  const avgCleanliness = avg.cleanliness || 3;

  // Penalize based on difference
  const diff = Math.abs(userCleanliness - avgCleanliness);
  score -= diff * 15;

  // Compare cleaning frequency
  if (user.cleaningFrequency !== avg.cleaningFrequency) {
    score -= 10;
  }

  return Math.max(0, score);
}

function calculateNoiseScore(user: LifestyleProfile, avg: LifestyleProfile): number {
  let score = 100;

  const userTolerance = user.noiseTolerance || 3;
  const avgTolerance = avg.noiseTolerance || 3;

  const diff = Math.abs(userTolerance - avgTolerance);
  score -= diff * 12;

  if (user.musicVolume !== avg.musicVolume) {
    score -= 12;
  }

  return Math.max(0, score);
}

function calculateHabitsScore(user: LifestyleProfile, avg: LifestyleProfile): number {
  let score = 100;

  // Smoking compatibility
  if (user.smoking !== avg.smoking) {
    score -= 20;
  }

  // Pets compatibility
  if (user.pets !== avg.pets) {
    score -= 15;
  }

  // Cooking frequency
  if (user.cooking !== avg.cooking) {
    score -= 10;
  }

  return Math.max(0, score);
}

function calculateGuestsScore(user: LifestyleProfile, avg: LifestyleProfile): number {
  let score = 100;

  if (user.guestsFrequency !== avg.guestsFrequency) {
    score -= 15;
  }

  const userAcceptance = user.guestsAcceptance || 3;
  const avgAcceptance = avg.guestsAcceptance || 3;
  const diff = Math.abs(userAcceptance - avgAcceptance);
  score -= diff * 10;

  return Math.max(0, score);
}

function calculateSocialScore(user: LifestyleProfile, avg: LifestyleProfile): number {
  let score = 100;

  if (user.personality !== avg.personality) {
    score -= 15;
  }

  if (user.socialPreference !== avg.socialPreference) {
    score -= 15;
  }

  return Math.max(0, score);
}

function generateCompatibilitySummary(score: number): string {
  if (score >= 90) return 'Tens hábitos muito alinhados com os atuais moradores!';
  if (score >= 80) return 'Ótima compatibilidade com os moradores atuais.';
  if (score >= 70) return 'Boa compatibilidade geral com alguns pequenos ajustes.';
  if (score >= 60) return 'Compatibilidade moderada. Algumas diferenças nos hábitos.';
  return 'Compatibilidade baixa. Considera se os hábitos são compatíveis.';
}

// Calculate comfort score
export function calculateComfortScore(
  accommodation: Accommodation,
  compatibility: number,
  reviews: number = 0
): ComfortScore {
  // Compatibility weight: 40%
  const compatibilityScore = (compatibility / 100) * 4;

  // Reviews weight: 25%
  const reviewsScore = reviews > 0 ? (reviews / 5) * 2.5 : 2;

  // Location weight: 20%
  const locationScore = accommodation.distanceToUniversity <= 2 ? 2 :
                        accommodation.distanceToUniversity <= 5 ? 1.5 : 1;

  // Amenities weight: 15%
  const amenitiesCount = Object.values(accommodation.amenities).filter(v => v).length;
  const amenitiesScore = (amenitiesCount / 9) * 1.5;

  const overall = compatibilityScore + reviewsScore + locationScore + amenitiesScore;

  let label = '';
  if (overall >= 9) label = 'Excelente';
  else if (overall >= 8) label = 'Muito Bom';
  else if (overall >= 7) label = 'Bom';
  else if (overall >= 6) label = 'Razoável';
  else label = 'Adequado';

  return {
    overall: Number(overall.toFixed(1)),
    breakdown: {
      compatibility: Number(compatibilityScore.toFixed(1)),
      reviews: Number(reviewsScore.toFixed(1)),
      location: Number(locationScore.toFixed(1)),
      amenities: Number(amenitiesScore.toFixed(1)),
    },
    label,
  };
}

export function getCategoryColor(score: number): 'success' | 'warning' | 'default' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'default';
}

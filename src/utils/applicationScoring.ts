import type { Property, Room } from '../types/property';
import type { LifestyleProfile, AccommodationPreferences } from '../types/profile';

export interface CompatibilityResult {
  score: number;
  label: string;
  reasons: string[];
  conflicts: string[];
  hasEnoughData: boolean;
}

export interface TrustResult {
  score: number;
  level: 'new' | 'confirmed' | 'trusted';
  label: string;
  isFallback: boolean;
}

export interface TrustScoreLike {
  score: number;
  level: string;
  reviewsCount?: number;
  averageRating?: number;
}

export interface TrustProfileSignals {
  verified?: boolean;
  onboardingCompleted?: boolean;
  status?: string | null;
}

// ── Compatibility ─────────────────────────────────────────────────────────────

function compatLabel(score: number): string {
  if (score >= 80) return 'Match forte';
  if (score >= 65) return 'Boa compatibilidade';
  if (score >= 45) return 'Match moderado';
  return 'Pode haver conflito';
}

export function computeCompatibility(input: {
  lifestyle?: LifestyleProfile | null;
  preferences?: AccommodationPreferences | null;
  room?: Room | null;
  property?: Property | null;
  moveInDate?: Date | string | null;
}): CompatibilityResult {
  const { lifestyle, preferences, room, property, moveInDate } = input;
  const reasons: string[] = [];
  const conflicts: string[] = [];

  let points = 0;
  let maxPoints = 0;

  // ── Budget ────────────────────────────────────────────────────────────────
  if (room?.price != null && preferences?.maxBudget != null) {
    maxPoints += 20;
    const price = room.price;
    const budget = preferences.maxBudget;
    if (price <= budget) {
      points += 20;
      reasons.push('Dentro do orçamento');
    } else if (price <= budget * 1.1) {
      points += 10;
      reasons.push('Ligeiramente acima do orçamento');
    } else {
      conflicts.push('Preço acima do orçamento');
    }
  }

  // ── City / preferred cities ───────────────────────────────────────────────
  if (property?.city && preferences?.preferredCities?.length) {
    maxPoints += 10;
    const wanted = preferences.preferredCities.map(c => c.toLowerCase());
    if (wanted.includes(property.city.toLowerCase())) {
      points += 10;
      reasons.push('Cidade entre as preferidas');
    } else {
      conflicts.push('Cidade fora das preferidas');
    }
  }

  // ── Distance to university ────────────────────────────────────────────────
  if (property?.distanceToUniversity != null && preferences?.maxDistanceFromUniversity != null) {
    maxPoints += 10;
    if (property.distanceToUniversity <= preferences.maxDistanceFromUniversity) {
      points += 10;
      reasons.push('Distância à universidade dentro do limite');
    } else {
      conflicts.push('Mais longe da universidade do que o desejado');
    }
  }

  // ── Room type ─────────────────────────────────────────────────────────────
  if (room?.roomType && preferences?.roomType) {
    maxPoints += 10;
    if (room.roomType === preferences.roomType) {
      points += 10;
      reasons.push('Tipo de quarto compatível');
    } else {
      conflicts.push('Tipo de quarto diferente do preferido');
    }
  }

  // ── Move-in date alignment ────────────────────────────────────────────────
  const applicationMoveIn = moveInDate ? new Date(moveInDate) : null;
  if (applicationMoveIn && room?.availableFrom) {
    maxPoints += 10;
    const avail = new Date(room.availableFrom).getTime();
    const want = applicationMoveIn.getTime();
    const diffDays = Math.abs(want - avail) / (1000 * 60 * 60 * 24);
    if (want >= avail && diffDays <= 30) {
      points += 10;
      reasons.push('Entrada compatível');
    } else if (diffDays <= 60) {
      points += 5;
      reasons.push('Entrada próxima da data disponível');
    } else {
      conflicts.push('Data de entrada distante da disponibilidade');
    }
  }

  // ── House rules vs lifestyle ──────────────────────────────────────────────
  const rules = property?.houseRules;
  if (rules && lifestyle) {
    if (typeof rules.smoking === 'boolean' && typeof lifestyle.smoking === 'boolean') {
      maxPoints += 8;
      if (!lifestyle.smoking || rules.smoking) {
        points += 8;
      } else {
        conflicts.push('Estudante fuma mas a casa não permite');
      }
    }

    if (typeof rules.pets === 'boolean' && typeof lifestyle.pets === 'boolean') {
      maxPoints += 6;
      if (!lifestyle.pets || rules.pets) {
        points += 6;
      } else {
        conflicts.push('Estudante tem animais mas a casa não permite');
      }
    }
  }

  // ── Lifestyle-only signals (soft) ─────────────────────────────────────────
  if (lifestyle) {
    if (lifestyle.guestsFrequency && lifestyle.guestsAcceptance != null) {
      maxPoints += 4;
      const freqOk =
        lifestyle.guestsFrequency === 'never' ||
        lifestyle.guestsFrequency === 'rarely' ||
        lifestyle.guestsAcceptance >= 3;
      if (freqOk) points += 4;
    }
    if (lifestyle.noiseTolerance != null) {
      maxPoints += 3;
      if (lifestyle.noiseTolerance >= 3) points += 3;
    }
    if (lifestyle.cleanliness != null) {
      maxPoints += 3;
      if (lifestyle.cleanliness >= 3) points += 3;
    }
    if (lifestyle.schedule) {
      maxPoints += 2;
      points += 2;
    }
  }

  // ── Final score ───────────────────────────────────────────────────────────
  const hasEnoughData = maxPoints >= 20;
  let score: number;

  if (!hasEnoughData) {
    // Honest neutral range when there's not enough signal to judge.
    score = conflicts.length > 0 ? 45 : 55;
  } else {
    score = Math.round((points / maxPoints) * 100);
    // Hard cap: explicit conflicts should pull the score down so it's never misleadingly high.
    if (conflicts.length >= 2 && score > 50) score = Math.min(score, 50);
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: hasEnoughData ? compatLabel(score) : 'Dados insuficientes',
    reasons,
    conflicts,
    hasEnoughData,
  };
}

// ── Trust ─────────────────────────────────────────────────────────────────────

function trustLabel(level: TrustResult['level']): string {
  if (level === 'trusted') return 'Confiável';
  if (level === 'confirmed') return 'Confirmado';
  return 'Perfil recente';
}

function levelFromScore(score: number): TrustResult['level'] {
  if (score >= 75) return 'trusted';
  if (score >= 50) return 'confirmed';
  return 'new';
}

export function computeTrust(input: {
  trust?: TrustScoreLike | null;
  profile?: TrustProfileSignals | null;
}): TrustResult {
  const { trust, profile } = input;

  if (trust && typeof trust.score === 'number' && trust.score > 0) {
    const level =
      (trust.level === 'trusted' || trust.level === 'confirmed' || trust.level === 'new')
        ? (trust.level as TrustResult['level'])
        : levelFromScore(trust.score);
    return {
      score: Math.round(trust.score),
      level,
      label: trustLabel(level),
      isFallback: false,
    };
  }

  // ── Fallback from profile signals ─────────────────────────────────────────
  if (profile?.status === 'suspended' || profile?.status === 'blocked') {
    return { score: 0, level: 'new', label: 'Conta suspensa', isFallback: true };
  }

  const verified = !!profile?.verified;
  const onboarded = !!profile?.onboardingCompleted;

  let score: number;
  if (verified && onboarded) score = 55;
  else if (onboarded) score = 35;
  else score = 18;

  const level = levelFromScore(score);
  return { score, level, label: trustLabel(level), isFallback: true };
}

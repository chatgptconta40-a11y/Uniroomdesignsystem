import type { Room, Property } from '../types/property';
import type { StudentProfile } from '../types/profile';

export interface CompatibilityInsights {
  shortLabel: string;
  tone: 'positive' | 'neutral' | 'caution';
  strengths: string[];
  conflicts: string[];
  protectiveRules: string[];
  naturalSummary: string;
}

/**
 * Derives a human-readable short label for a compatibility score.
 * Does NOT require a student profile — uses only room/property data.
 * Used in RoomCard and search results.
 */
export function getCompatibilityShortLabel(
  score: number,
  room: Room,
  property: Property
): { label: string; tone: 'positive' | 'neutral' | 'caution' } {
  const rules = property.houseRules;

  if (score >= 80) {
    if (rules?.quietHours && rules?.parties === false) return { label: 'ambiente silencioso compatível', tone: 'positive' };
    if (rules?.quietHours) return { label: 'horários compatíveis', tone: 'positive' };
    if (rules?.parties === false) return { label: 'casa focada no estudo', tone: 'positive' };
    if (room.desk && property.amenities.wifi) return { label: 'equipada para estudar', tone: 'positive' };
    if (!room.utilities) return { label: 'boa compatibilidade', tone: 'positive' };
    return { label: 'excelente ajuste ao perfil', tone: 'positive' };
  }

  if (score >= 65) {
    if (rules?.parties === true) return { label: 'verifica regras de visitas', tone: 'neutral' };
    if (!rules?.quietHours) return { label: 'ambiente social moderado', tone: 'neutral' };
    return { label: 'boa compatibilidade geral', tone: 'neutral' };
  }

  // score < 65
  if (rules?.parties === true) return { label: 'possível diferença no ruído', tone: 'caution' };
  return { label: 'possível diferença de hábitos', tone: 'caution' };
}

/**
 * Full compatibility insights — requires a student profile for personalization.
 * Used in ComfortScorePanel (room detail).
 */
export function getCompatibilityInsights(
  room: Room,
  property: Property,
  score: number,
  profile?: StudentProfile | null
): CompatibilityInsights {
  const lifestyle = profile?.lifestyle;
  const rules = property.houseRules;

  const strengths: string[] = [];
  const conflicts: string[] = [];
  const protectiveRules: string[] = [];

  /* ── Protective rules (factual house rules that reduce risk) ─────────── */
  if (rules?.quietHours) {
    protectiveRules.push(`Silêncio obrigatório — ${rules.quietHours}`);
  }
  if (rules?.parties === false) protectiveRules.push('Festas não permitidas');
  if (rules?.smoking === false) protectiveRules.push('Proibido fumar');
  if (rules?.pets === false) protectiveRules.push('Animais de estimação não permitidos');

  /* ── Strengths ───────────────────────────────────────────────────────── */

  // Overall score
  if (score >= 80) {
    strengths.push('Alta compatibilidade geral com o perfil da casa');
  } else if (score >= 65) {
    strengths.push('Compatibilidade razoável com a maioria dos critérios');
  }

  // Distance — objective strength
  const walk = Math.round(property.distanceToUniversity * 13);
  if (property.distanceToUniversity <= 2) {
    strengths.push(`A ${walk} minutos a pé das aulas`);
  }

  // Quiet hours aligned with profile
  if (rules?.quietHours) {
    const isNightOwlAlert = lifestyle?.bedtime === 'late';
    if (!isNightOwlAlert) {
      strengths.push('Horário de silêncio garante tranquilidade noturna');
    }
  }

  // No-party rule aligned with low social preference
  if (rules?.parties === false) {
    const likesSocialLife = lifestyle?.guestsFrequency === 'often' || lifestyle?.socialPreference === 'social';
    if (!likesSocialLife) {
      strengths.push('Casa tranquila — sem festas nem grande agitação');
    }
  }

  // Non-smoking match
  if (rules?.smoking === false && lifestyle?.smoking === false) {
    strengths.push('Casa sem fumadores, de acordo com as tuas preferências');
  } else if (rules?.smoking === false && !lifestyle) {
    strengths.push('Ambiente sem fumo');
  }

  // Study setup
  if (room.desk && property.amenities.wifi) {
    strengths.push('Secretária e Wi-Fi incluídos — ambiente de estudo em casa');
  } else if (property.amenities.wifi) {
    strengths.push('Wi-Fi garantido para estudar e trabalhar');
  }

  // Privacy
  if (room.privateBathroom) {
    strengths.push('Casa de banho privativa — mais privacidade diária');
  }

  // Bills included
  if (!room.utilities) {
    strengths.push('Despesas incluídas — sem surpresas no final do mês');
  }

  // Verified trust
  if (property.verified) {
    strengths.push('Anúncio verificado pela UniRoom');
  }

  /* ── Conflicts ───────────────────────────────────────────────────────── */

  // Parties allowed but student is quiet
  if (rules?.parties === true) {
    if (lifestyle?.noiseTolerance !== undefined && lifestyle.noiseTolerance <= 2) {
      conflicts.push('Esta casa permite festas — pode ser difícil se tens pouca tolerância ao barulho');
    } else if (lifestyle?.guestsFrequency === 'never' || lifestyle?.guestsFrequency === 'rarely') {
      conflicts.push('Festas são permitidas — verifica com que frequência acontecem');
    } else {
      conflicts.push('Visitas e festas são permitidas nesta casa');
    }
  }

  // No quiet hours but student sleeps early or is noise-sensitive
  if (!rules?.quietHours) {
    const sensitiveToNoise = lifestyle?.noiseTolerance !== undefined && lifestyle.noiseTolerance <= 2;
    const sleepsEarly = lifestyle?.bedtime === 'early';
    if (sensitiveToNoise || sleepsEarly) {
      conflicts.push('Sem horário de silêncio definido — pode ser difícil descansar cedo');
    }
  }

  // Smoking allowed but student doesn't smoke
  if (rules?.smoking === true && lifestyle?.smoking === false) {
    conflicts.push('Fumar é permitido nesta casa — considera se isso te incomoda');
  }

  // Late-night household vs early riser
  if (rules?.quietHours && lifestyle?.bedtime === 'late') {
    const [hoursStr] = (rules.quietHours).split('-');
    const quietHour = parseInt(hoursStr?.replace('h', '') || '22', 10);
    if (quietHour <= 22) {
      conflicts.push('Horário de silêncio começa cedo — pode limitar a tua vida social em casa');
    }
  }

  // General low score caution (only if no specific conflicts found)
  if (score < 65 && conflicts.length === 0) {
    conflicts.push('Pode haver diferenças no ritmo e hábitos do dia-a-dia');
  }

  /* ── Natural summary ─────────────────────────────────────────────────── */
  let naturalSummary: string;

  if (score >= 80) {
    if (rules?.quietHours && rules?.parties === false) {
      naturalSummary = 'Esta casa parece adequada para quem valoriza silêncio à noite e ambiente focado no estudo.';
    } else if (property.distanceToUniversity <= 1) {
      naturalSummary = 'Boa compatibilidade e localização excelente para chegar às aulas.';
    } else if (!room.utilities && room.desk) {
      naturalSummary = 'Ambiente de estudo completo e sem surpresas de custos — bom ajuste ao teu perfil.';
    } else {
      naturalSummary = 'O perfil desta casa alinha bem com as tuas preferências de convivência.';
    }
  } else if (score >= 65) {
    if (rules?.parties === true) {
      naturalSummary = 'Pode haver algum atrito se receberes visitas com frequência ou preferires casa mais calma.';
    } else if (!rules?.quietHours) {
      naturalSummary = 'Compatibilidade razoável — confirma o ambiente da casa numa visita presencial.';
    } else {
      naturalSummary = 'Bom ponto de partida — alguns critérios encaixam, outros valem a pena confirmar pessoalmente.';
    }
  } else {
    naturalSummary = 'Existem algumas diferenças entre o teu perfil e o desta casa — lê as regras com atenção antes de te candidatares.';
  }

  const { label: shortLabel, tone } = getCompatibilityShortLabel(score, room, property);

  return {
    shortLabel,
    tone,
    strengths: strengths.slice(0, 4),
    conflicts: conflicts.slice(0, 3),
    protectiveRules: protectiveRules.slice(0, 4),
    naturalSummary,
  };
}

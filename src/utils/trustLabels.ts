export type VerificationLevel = 'none' | 'bronze' | 'silver' | 'gold';
export type TrustLevel = 'new' | 'confirmed' | 'trusted';

export function computeVerificationLevel(
  emailVerified: boolean,
  universityEmailVerified: boolean,
  documentVerified: boolean,
): VerificationLevel {
  if (emailVerified && universityEmailVerified && documentVerified) return 'gold';
  if (emailVerified && universityEmailVerified) return 'silver';
  if (emailVerified) return 'bronze';
  return 'none';
}

export function getVerificationBadge(level: string): { icon: string; label: string; color: string } {
  const badges: Record<string, { icon: string; label: string; color: string }> = {
    none: { icon: '', label: 'Não verificado', color: 'text-gray-400' },
    bronze: { icon: '🥉', label: 'Bronze', color: 'text-amber-700' },
    silver: { icon: '🥈', label: 'Prata', color: 'text-gray-500' },
    gold: { icon: '🥇', label: 'Ouro', color: 'text-yellow-500' },
  };
  return badges[level] ?? badges.none;
}

export function getTrustBadge(level: string): { label: string; color: string; bgColor: string } {
  const badges: Record<string, { label: string; color: string; bgColor: string }> = {
    new: { label: 'Novo Membro', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    confirmed: { label: 'Membro Confirmado', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    trusted: { label: 'Membro de Confiança', color: 'text-green-700', bgColor: 'bg-green-100' },
  };
  return badges[level] ?? badges.new;
}

export function parseResponseTimeHours(time: string | undefined | null): number {
  if (!time) return 0;
  const parsed = parseFloat(time);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function responseTimeLabel(hours: number): string {
  if (hours < 1) return 'Responde geralmente em menos de 1 hora';
  if (hours <= 3) return `Responde tipicamente em ${Math.round(hours)}–${Math.round(hours) + 1} horas`;
  if (hours <= 12) return 'Responde geralmente no mesmo dia';
  return 'Responde geralmente dentro de 24 horas';
}

export function memberSinceLabel(date: Date | string | undefined | null): string {
  if (!date) return 'Membro recente';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return 'Membro recente';
  const diff = Date.now() - d.getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  if (years >= 1) return `Membro há ${years} ${years === 1 ? 'ano' : 'anos'}`;
  if (months >= 1) return `Membro há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  return 'Membro recente';
}

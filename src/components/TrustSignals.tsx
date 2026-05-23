import { ShieldCheck, Star, Flag, Clock, MessageCircle, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { Room, Property } from '../types/property';
import { Card } from './Card';
import { TrustPill } from './TrustPill';
import {
  getLandlordStats,
  getTrustScore,
  getVerificationStatus,
  getAverageRatingBreakdown,
} from '../data/mockTrust';
import { mockUsers } from '../data/mockUsers';

interface TrustSignalsProps {
  room: Room;
  property: Property;
  onReport: () => void;
}

function responseTimeLabel(hours: number): string {
  if (hours < 1) return 'Responde geralmente em menos de 1 hora';
  if (hours <= 3) return `Responde tipicamente em ${hours}–${hours + 1} horas`;
  if (hours <= 12) return 'Responde geralmente no mesmo dia';
  return 'Responde geralmente dentro de 24 horas';
}

function memberSinceLabel(date: Date): string {
  const diff = Date.now() - date.getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  if (years >= 1) return `Membro há ${years} ${years === 1 ? 'ano' : 'anos'}`;
  if (months >= 1) return `Membro há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  return 'Membro recente';
}

export function TrustSignals({ room, property, onReport }: TrustSignalsProps) {
  const landlordId = room.landlordId;
  const landlordStats = getLandlordStats(landlordId);
  const landlordTrust = getTrustScore(landlordId);
  const landlordVerification = getVerificationStatus(landlordId);
  const roomRating = getAverageRatingBreakdown(room.id);

  const landlord = mockUsers.find(u => u.id === landlordId);
  const landlordName = landlord?.name ?? 'Senhorio';
  const landlordInitial = landlordName.charAt(0).toUpperCase();

  const isVerifiedLandlord = landlordVerification?.level === 'gold' || landlordVerification?.level === 'silver';
  const isTrustedMember = landlordTrust?.level === 'trusted';

  const signals: { icon: React.ReactNode; text: string; ok: boolean }[] = [
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      text: property.verified ? 'Anúncio verificado pela UniRoom' : 'Anúncio ainda não verificado',
      ok: property.verified,
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      text: isVerifiedLandlord ? 'Senhorio com identidade confirmada' : 'Verificação de identidade pendente',
      ok: isVerifiedLandlord,
    },
    {
      icon: <Star className="w-4 h-4" />,
      text: isTrustedMember ? 'Membro de confiança UniRoom' : 'Membro em avaliação',
      ok: isTrustedMember,
    },
    {
      icon: <MessageCircle className="w-4 h-4" />,
      text: landlordStats
        ? responseTimeLabel(landlordStats.averageResponseTime)
        : 'Tempo de resposta a calcular',
      ok: !!landlordStats,
    },
  ];

  return (
    <Card className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="font-bold text-foreground">Confiança e segurança</h3>
      </div>

      {/* Landlord row */}
      <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {landlordInitial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{landlordName}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {property.verified && <TrustPill type="verified-landlord" size="xs" />}
            {isTrustedMember && <TrustPill type="trusted-member" size="xs" />}
            {!property.verified && !isTrustedMember && <TrustPill type="new-member" size="xs" />}
          </div>
        </div>
        {landlordStats && (
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-amber-600 justify-end">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-bold">{landlordStats.averageRating.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{landlordStats.totalReviews} avaliações</p>
          </div>
        )}
      </div>

      {/* Trust signals list */}
      <ul className="space-y-2.5">
        {signals.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={`mt-0.5 flex-shrink-0 ${s.ok ? 'text-green-600' : 'text-muted-foreground/50'}`}>
              {s.icon}
            </span>
            <span className={`text-sm leading-snug ${s.ok ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s.text}
            </span>
          </li>
        ))}

        {landlordStats && (
          <li className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
            <span className="text-sm text-foreground leading-snug">
              {landlordStats.responseRate}% de taxa de resposta
            </span>
          </li>
        )}

        {landlordStats && (
          <li className="flex items-start gap-2.5">
            <Users className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
            <span className="text-sm text-foreground leading-snug">
              {landlordStats.completedRentals} arrendamentos concluídos
              {landlordStats.memberSince && (
                <span className="text-muted-foreground"> · {memberSinceLabel(new Date(landlordStats.memberSince))}</span>
              )}
            </span>
          </li>
        )}
      </ul>

      {/* Room rating from reviews */}
      {roomRating.total > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.round(roomRating.average) ? 'fill-amber-400 text-amber-400' : 'text-amber-200'}`}
              />
            ))}
          </div>
          <div>
            <span className="font-bold text-amber-900 text-sm">{roomRating.average.toFixed(1)}</span>
            <span className="text-amber-700 text-xs ml-1">({roomRating.total} {roomRating.total === 1 ? 'avaliação' : 'avaliações'})</span>
          </div>
          <TrustPill type="positive-review" size="xs" className="ml-auto" />
        </div>
      )}

      {/* Alert if not verified */}
      {!property.verified && (
        <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-xl">
          <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-snug">
            Este anúncio ainda não foi verificado pela UniRoom. Verifica sempre o espaço antes de assinar qualquer contrato.
          </p>
        </div>
      )}

      {/* Report button */}
      <div className="border-t border-border pt-3">
        <button
          onClick={onReport}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 group"
        >
          <Flag className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Denunciar este anúncio</span>
        </button>
      </div>

      {/* Footer explanation */}
      <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
        A UniRoom usa verificações, avaliações e denúncias para tornar a procura de alojamento mais segura e transparente para todos.
      </p>
    </Card>
  );
}

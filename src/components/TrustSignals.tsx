import { ShieldCheck, Star, Flag, Clock, MessageCircle, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { Room, Property } from '../types/property';
import { Card } from './Card';
import { TrustPill } from './TrustPill';
import { useTrustScore, useReviews } from '../hooks/useTrust';
import { parseResponseTimeHours, responseTimeLabel, memberSinceLabel } from '../utils/trustLabels';
import { mockUsers } from '../data/mockUsers';

interface TrustSignalsProps {
  room: Room;
  property: Property;
  onReport: () => void;
}

export function TrustSignals({ room, property, onReport }: TrustSignalsProps) {
  const landlordId = room.landlordId;
  const { score: landlordTrust } = useTrustScore(landlordId);
  const { averageRating: roomAvgRating, total: reviewTotal } = useReviews({ propertyId: property.id });

  const landlord = mockUsers.find(u => u.id === landlordId);
  const landlordName = landlord?.name ?? 'Senhorio';
  const landlordInitial = landlordName.charAt(0).toUpperCase();

  const isVerifiedLandlord = landlordTrust?.verificationLevel === 'gold' || landlordTrust?.verificationLevel === 'silver';
  const isTrustedMember = landlordTrust?.level === 'trusted';
  const responseHours = parseResponseTimeHours(landlordTrust?.responseTime);

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
      text: landlordTrust
        ? responseTimeLabel(responseHours)
        : 'Tempo de resposta a calcular',
      ok: !!landlordTrust,
    },
  ];

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="font-bold text-foreground">Responsável e segurança</h3>
      </div>

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
        {landlordTrust && landlordTrust.reviewsCount > 0 && (
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-amber-600 justify-end">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-bold">{landlordTrust.averageRating.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{landlordTrust.reviewsCount} avaliações</p>
          </div>
        )}
      </div>

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

        {landlordTrust && (
          <li className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
            <span className="text-sm text-foreground leading-snug">
              {landlordTrust.responseRate}% de taxa de resposta
            </span>
          </li>
        )}

        {landlordTrust && (
          <li className="flex items-start gap-2.5">
            <Users className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
            <span className="text-sm text-foreground leading-snug">
              {memberSinceLabel(landlordTrust.memberSince)}
            </span>
          </li>
        )}
      </ul>

      {reviewTotal > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.round(roomAvgRating) ? 'fill-amber-400 text-amber-400' : 'text-amber-200'}`}
              />
            ))}
          </div>
          <div>
            <span className="font-bold text-amber-900 text-sm">{roomAvgRating.toFixed(1)}</span>
            <span className="text-amber-700 text-xs ml-1">({reviewTotal} {reviewTotal === 1 ? 'avaliação' : 'avaliações'})</span>
          </div>
          <TrustPill type="positive-review" size="xs" className="ml-auto" />
        </div>
      )}

      {!property.verified && (
        <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-xl">
          <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-snug">
            Este anúncio ainda não foi verificado pela UniRoom. Verifica sempre o espaço antes de assinar qualquer contrato.
          </p>
        </div>
      )}

      <div className="border-t border-border pt-3">
        <button
          onClick={onReport}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 group"
        >
          <Flag className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Denunciar este anúncio</span>
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
        A UniRoom usa verificações, avaliações e denúncias para tornar a procura de alojamento mais segura e transparente para todos.
      </p>
    </Card>
  );
}

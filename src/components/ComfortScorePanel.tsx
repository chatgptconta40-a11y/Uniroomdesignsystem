import { useMemo } from 'react';
import { MapPin, Wallet, Sparkles, ShieldCheck, Star } from 'lucide-react';
import { Room, Property } from '../types/property';
import { Card } from './Card';

interface ComfortScorePanelProps {
  room: Room;
  property: Property;
  canUseCompatibility?: boolean;
}

interface CategoryScore {
  label: string;
  score: number; // 0–100
  icon: React.ReactNode;
  detail: string;
}

function computeScores(room: Room, property: Property, canUseCompatibility: boolean) {
  // Compatibility (40 pts)
  const compat = room.compatibilityScore ?? 70;
  const compatPts = canUseCompatibility ? (compat / 100) * 40 : 0;

  // Location — lower distance = better (20 pts)
  const maxDist = 10;
  const locFrac = Math.max(0, Math.min(1, (maxDist - property.distanceToUniversity) / maxDist));
  const locPts = locFrac * 20;

  // Price — cheaper relative to 200–500 range (15 pts)
  const priceFrac = Math.max(0, Math.min(1, (500 - room.price) / 300));
  const pricePts = priceFrac * 15;

  // Amenities count (15 pts)
  const amenityKeys: (keyof typeof property.amenities)[] = [
    'wifi', 'kitchen', 'livingRoom', 'laundry', 'parking', 'heating', 'airConditioning', 'elevator',
  ];
  const amenityCount = amenityKeys.filter(k => property.amenities[k]).length;
  const roomExtras = [room.privateBathroom, room.balcony, room.desk, room.wardrobe].filter(Boolean).length;
  const totalAmenities = amenityCount + roomExtras;
  const maxAmenities = amenityKeys.length + 4;
  const amenPts = (totalAmenities / maxAmenities) * 15;

  // Trust (10 pts): verified (6) + utilities (2) + minimumStay short (2)
  const trustPts =
    (property.verified ? 6 : 0) +
    (!room.utilities ? 2 : 0) +
    (room.minimumStay <= 6 ? 2 : 1);

  const total = canUseCompatibility
    ? compatPts + locPts + pricePts + amenPts + trustPts
    : (locFrac * 35) + (priceFrac * 25) + ((totalAmenities / maxAmenities) * 25) + ((trustPts / 10) * 15);
  const score10 = Math.round(Math.min(10, total / 10) * 10) / 10;

  const categories: CategoryScore[] = [
    ...(canUseCompatibility ? [{
      label: 'Compatibilidade',
      score: compat,
      icon: <Sparkles className="w-3.5 h-3.5" />,
      detail: compat >= 80 ? 'Excelente ajuste ao teu perfil' : compat >= 60 ? 'Bom ajuste ao teu perfil' : 'Compatibilidade moderada',
    }] : []),
    {
      label: 'Localização',
      score: Math.round(locFrac * 100),
      icon: <MapPin className="w-3.5 h-3.5" />,
      detail: `${property.distanceToUniversity}km da universidade`,
    },
    {
      label: 'Preço',
      score: Math.round(priceFrac * 100),
      icon: <Wallet className="w-3.5 h-3.5" />,
      detail: room.price <= 300 ? 'Ótimo custo-benefício' : room.price <= 400 ? 'Preço razoável' : 'Preço acima da média',
    },
    {
      label: 'Comodidades',
      score: Math.round((totalAmenities / maxAmenities) * 100),
      icon: <Star className="w-3.5 h-3.5" />,
      detail: `${totalAmenities} comodidades incluídas`,
    },
    {
      label: 'Confiança',
      score: Math.round((trustPts / 10) * 100),
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      detail: property.verified ? 'Senhorio verificado UniRoom' : 'Ainda a verificar',
    },
  ];

  return { score10, categories };
}

function getLabel(score: number): { text: string; color: string; bg: string } {
  if (score >= 8.5) return { text: 'Excelente escolha', color: 'text-green-700', bg: 'bg-green-50 border-green-200' };
  if (score >= 7)   return { text: 'Boa opção', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
  if (score >= 5)   return { text: 'Opção equilibrada', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
  return { text: 'Requer atenção', color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
}

function barColor(score: number): string {
  if (score >= 75) return 'bg-green-500';
  if (score >= 50) return 'bg-blue-500';
  if (score >= 30) return 'bg-amber-500';
  return 'bg-red-400';
}

function buildReasons(room: Room, property: Property, score10: number, canUseCompatibility: boolean): string[] {
  const reasons: string[] = [];
  if (canUseCompatibility && room.compatibilityScore && room.compatibilityScore >= 80) reasons.push(`${room.compatibilityScore}% de compatibilidade com o teu perfil`);
  if (property.distanceToUniversity <= 2) reasons.push(`A apenas ${property.distanceToUniversity}km da universidade`);
  if (property.verified) reasons.push('Senhorio verificado pela UniRoom');
  if (room.privateBathroom) reasons.push('Casa de banho privativa incluída');
  if (property.amenities.wifi) reasons.push('Wi-Fi incluído');
  if (!room.utilities) reasons.push('Despesas incluídas no preço');
  if (room.balcony) reasons.push('Varanda disponível');
  if (room.price <= 300) reasons.push('Preço abaixo da média de mercado');
  if (reasons.length === 0 && score10 >= 5) reasons.push('Quarto com bom equilíbrio de características');
  return reasons.slice(0, 4);
}

export function ComfortScorePanel({ room, property, canUseCompatibility = true }: ComfortScorePanelProps) {
  const { score10, categories } = useMemo(
    () => computeScores(room, property, canUseCompatibility),
    [room, property, canUseCompatibility]
  );
  const label = getLabel(score10);
  const reasons = useMemo(
    () => buildReasons(room, property, score10, canUseCompatibility),
    [room, property, score10, canUseCompatibility]
  );

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">Score de Conforto UniRoom</h3>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Beta</span>
      </div>

      {/* Overall score */}
      <div className={`flex items-center gap-4 p-3 rounded-xl border ${label.bg}`}>
        <div className="flex-shrink-0 text-center">
          <div className={`text-3xl font-bold ${label.color}`}>{score10.toFixed(1)}</div>
          <div className="text-[10px] text-muted-foreground leading-tight">/ 10</div>
        </div>
        <div>
          <p className={`font-bold text-sm ${label.color}`}>{label.text}</p>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">
            {canUseCompatibility
              ? 'Calculado com base nas características do quarto, localização, preço, confiança e compatibilidade com o teu perfil.'
              : 'Calculado com base nas características do quarto, localização, preço, comodidades e confiança.'}
          </p>
        </div>
      </div>

      {/* Category bars */}
      <div className="space-y-2.5">
        {categories.map(cat => (
          <div key={cat.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="text-muted-foreground/70">{cat.icon}</span>
                {cat.label}
              </div>
              <span className="text-xs font-semibold text-foreground">{cat.score}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor(cat.score)}`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{cat.detail}</p>
          </div>
        ))}
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-semibold text-foreground mb-2">Porque recomendamos este quarto</p>
          <ul className="space-y-1.5">
            {reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                </span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

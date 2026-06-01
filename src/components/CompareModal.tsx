import { useNavigate } from 'react-router';
import {
  X, Check, MapPin, Maximize, Bath, Star, Navigation,
  Calendar, Clock, Wifi, WashingMachine, Trophy, TrendingDown,
  Zap, Award,
} from 'lucide-react';
import { CompareItem } from '../context/CompareContext';
import { Button } from './Button';

interface CompareModalProps {
  items: CompareItem[];
  onClose: () => void;
  onRemove: (roomId: string) => void;
}

function CheckIcon({ value }: { value: boolean | undefined }) {
  if (value === true) return <Check className="w-4 h-4 text-green-600 mx-auto" />;
  return <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />;
}

function HighlightBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${color}`}>
      {label}
    </span>
  );
}

export function CompareModal({ items, onClose, onRemove }: CompareModalProps) {
  const navigate = useNavigate();

  if (items.length === 0) return null;

  // Compute highlights
  const prices = items.map(i => i.room.price);
  const compats = items.map(i => i.room.compatibilityScore ?? 0);
  const distances = items.map(i => i.property.distanceToUniversity);
  const amenityCounts = items.map(({ room, property }) => {
    const propKeys = ['wifi', 'kitchen', 'livingRoom', 'laundry', 'parking', 'heating', 'airConditioning', 'elevator'] as const;
    const propCount = propKeys.filter(k => property.amenities[k]).length;
    const roomCount = [room.privateBathroom, room.balcony, room.desk, room.wardrobe].filter(Boolean).length;
    return propCount + roomCount;
  });

  const minPrice = Math.min(...prices);
  const maxCompat = Math.max(...compats);
  const minDist = Math.min(...distances);
  const maxAmenities = Math.max(...amenityCounts);

  const badges = items.map((item, idx) => {
    const list: { label: string; color: string; icon: React.ReactNode }[] = [];
    if (prices[idx] === minPrice) list.push({ label: 'Mais barato', color: 'bg-green-100 text-green-800', icon: <TrendingDown className="w-3 h-3" /> });
    if (compats[idx] === maxCompat && maxCompat > 0) list.push({ label: 'Melhor compat.', color: 'bg-blue-100 text-blue-800', icon: <Star className="w-3 h-3" /> });
    if (distances[idx] === minDist) list.push({ label: 'Mais próximo', color: 'bg-purple-100 text-purple-800', icon: <Navigation className="w-3 h-3" /> });
    if (amenityCounts[idx] === maxAmenities) list.push({ label: 'Mais comodidades', color: 'bg-amber-100 text-amber-800', icon: <Award className="w-3 h-3" /> });
    return list;
  });

  // Best overall (most badges)
  const badgeCounts = badges.map(b => b.length);
  const maxBadges = Math.max(...badgeCounts);

  type RowDef = {
    label: string;
    icon?: React.ReactNode;
    render: (item: CompareItem, idx: number) => React.ReactNode;
  };

  const rows: RowDef[] = [
    {
      label: 'Preço',
      icon: <span className="text-base">€</span>,
      render: ({ room }, idx) => (
        <div className="text-center">
          <span className={`font-bold ${prices[idx] === minPrice ? 'text-green-700' : 'text-foreground'}`}>
            €{room.price}
          </span>
          <span className="text-muted-foreground text-xs">/mês</span>
          {prices[idx] === minPrice && (
            <div className="mt-1"><HighlightBadge label="Mais barato" color="bg-green-100 text-green-800" /></div>
          )}
        </div>
      ),
    },
    {
      label: 'Cidade / Zona',
      icon: <MapPin className="w-3.5 h-3.5" />,
      render: ({ property }) => (
        <div className="text-center text-sm text-foreground">
          <div>{property.city}</div>
          <div className="text-muted-foreground text-xs">{property.zone}</div>
        </div>
      ),
    },
    {
      label: 'Distância à uni',
      icon: <Navigation className="w-3.5 h-3.5" />,
      render: ({ property }, idx) => (
        <div className="text-center">
          <span className={`font-semibold text-sm ${distances[idx] === minDist ? 'text-purple-700' : 'text-foreground'}`}>
            {property.distanceToUniversity}km
          </span>
          {distances[idx] === minDist && (
            <div className="mt-1"><HighlightBadge label="Mais próximo" color="bg-purple-100 text-purple-800" /></div>
          )}
        </div>
      ),
    },
    {
      label: 'Compatibilidade',
      icon: <Star className="w-3.5 h-3.5" />,
      render: ({ room }, idx) => (
        <div className="text-center">
          {room.compatibilityScore ? (
            <>
              <span className={`font-bold text-sm ${compats[idx] === maxCompat ? 'text-blue-700' : 'text-foreground'}`}>
                {room.compatibilityScore}%
              </span>
              {compats[idx] === maxCompat && (
                <div className="mt-1"><HighlightBadge label="Melhor compat." color="bg-blue-100 text-blue-800" /></div>
              )}
            </>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </div>
      ),
    },
    {
      label: 'Tamanho',
      icon: <Maximize className="w-3.5 h-3.5" />,
      render: ({ room }) => (
        <div className="text-center text-sm">
          {room.size ? `${room.size}m²` : <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      label: 'WC privativo',
      icon: <Bath className="w-3.5 h-3.5" />,
      render: ({ room }) => <CheckIcon value={room.privateBathroom} />,
    },
    {
      label: 'Varanda',
      render: ({ room }) => <CheckIcon value={room.balcony} />,
    },
    {
      label: 'Secretária',
      render: ({ room }) => <CheckIcon value={room.desk} />,
    },
    {
      label: 'Roupeiro',
      render: ({ room }) => <CheckIcon value={room.wardrobe} />,
    },
    {
      label: 'Wi-Fi',
      icon: <Wifi className="w-3.5 h-3.5" />,
      render: ({ property }) => <CheckIcon value={property.amenities.wifi} />,
    },
    {
      label: 'Lavandaria',
      icon: <WashingMachine className="w-3.5 h-3.5" />,
      render: ({ property }) => <CheckIcon value={property.amenities.laundry} />,
    },
    {
      label: 'Fumar',
      render: ({ property }) => (
        <div className="text-center text-xs text-muted-foreground">
          {property.houseRules?.smoking ? 'Permitido' : 'Não permitido'}
        </div>
      ),
    },
    {
      label: 'Animais',
      render: ({ property }) => (
        <div className="text-center text-xs text-muted-foreground">
          {property.houseRules?.pets ? 'Permitidos' : 'Não permitidos'}
        </div>
      ),
    },
    {
      label: 'Disponível a partir',
      icon: <Calendar className="w-3.5 h-3.5" />,
      render: ({ room }) => (
        <div className="text-center text-xs text-foreground">
          {new Date(room.availableFrom).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      ),
    },
    {
      label: 'Estadia mínima',
      icon: <Clock className="w-3.5 h-3.5" />,
      render: ({ room }) => (
        <div className="text-center text-sm text-foreground">
          {room.minimumStay} {room.minimumStay === 1 ? 'mês' : 'meses'}
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative flex flex-col bg-background w-full h-full max-h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Trophy className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Comparação de quartos</h2>
              <p className="text-xs text-muted-foreground">{items.length} quartos selecionados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse" style={{ minWidth: `${240 + items.length * 200}px` }}>
            <thead className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
              <tr>
                {/* Label column */}
                <th className="w-44 min-w-44 text-left px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/40">
                  Atributo
                </th>
                {/* Room columns */}
                {items.map(({ room, property }, idx) => (
                  <th key={room.id} className="min-w-48 text-center px-4 py-4 bg-card border-l border-border">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <img
                          src={room.images[0] || property.images[0]}
                          alt={room.title}
                          className="w-20 h-16 rounded-xl object-cover shadow-sm"
                        />
                        {badgeCounts[idx] === maxBadges && maxBadges > 0 && (
                          <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                            <Trophy className="w-3 h-3 text-white" />
                          </span>
                        )}
                        <button
                          onClick={() => onRemove(room.id)}
                          className="absolute -top-2 -left-2 w-5 h-5 bg-card border border-border rounded-full flex items-center justify-center hover:bg-destructive hover:text-white hover:border-destructive transition-colors shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground line-clamp-1">{room.title}</p>
                        <p className="text-xs text-muted-foreground">{property.zone}, {property.city}</p>
                      </div>
                      {/* Badges */}
                      {badges[idx].length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1">
                          {badges[idx].map(b => (
                            <span key={b.label} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${b.color}`}>
                              {b.icon}{b.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={row.label} className={rowIdx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                  <td className="px-5 py-3 border-r border-border bg-muted/40">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      {row.icon && <span className="text-muted-foreground/60">{row.icon}</span>}
                      {row.label}
                    </div>
                  </td>
                  {items.map((item, colIdx) => (
                    <td key={item.room.id} className="px-4 py-3 border-l border-border/50 text-center">
                      {row.render(item, colIdx)}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Actions row */}
              <tr className="bg-card border-t-2 border-border sticky bottom-0">
                <td className="px-5 py-4 bg-muted/40 border-r border-border">
                  <span className="text-sm font-semibold text-foreground">Ações</span>
                </td>
                {items.map(({ room }) => (
                  <td key={room.id} className="px-4 py-4 border-l border-border/50">
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => { onClose(); navigate(`/room/${room.id}`); }}
                      >
                        Ver detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => { onClose(); navigate(`/room/${room.id}`); }}
                      >
                        Candidatar-me
                      </Button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

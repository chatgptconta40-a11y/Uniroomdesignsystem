import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  MapPin,
  Home,
  Heart,
  Bath,
  Maximize,
  Check,
  Eye,
  Edit,
  Pause,
  Play,
  Trash2,
  FileText,
  MessageCircle,
  BarChart3,
  Columns,
  ShieldCheck,
  Star,
  Navigation,
  CalendarDays,
  Wifi,
} from 'lucide-react';
import { Room, Property } from '../types/property';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { getAverageRatingBreakdown, getVerificationStatus } from '../data/mockTrust';
import { getRoomCompatibilityScore } from '../utils/profileCompatibility';

function getAvailabilityLabel(date: Date): { text: string; cls: string } {
  const now = new Date();
  const availableDate = new Date(date);
  const diffDays = Math.ceil((availableDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return { text: 'Disponível agora', cls: 'text-green-600' };
  if (diffDays <= 14) return { text: 'Disponível em breve', cls: 'text-green-600' };

  const month = availableDate.toLocaleDateString('pt-PT', { month: 'long' });
  const year = availableDate.getFullYear();
  const sameYear = year === now.getFullYear();

  if (diffDays <= 90) return { text: `A partir de ${month}${sameYear ? '' : ` de ${year}`}`, cls: 'text-amber-600' };
  return { text: `A partir de ${month} de ${year}`, cls: 'text-muted-foreground' };
}

const walkMinutes = (km: number) => Math.round(km * 13);

interface CompareProps {
  isComparing: boolean;
  onToggle: (event: MouseEvent) => void;
  disabled: boolean;
}

interface RoomCardProps {
  room: Room;
  property: Property;
  variant?: 'default' | 'public' | 'management' | 'compact';
  displayMode?: 'grid' | 'list';
  showFavorite?: boolean;
  showPropertyContext?: boolean;
  availableRooms?: number;
  onFavoriteRequiresAuth?: () => void;
  compareProps?: CompareProps;
  managementActions?: {
    statusLabel: string;
    statusVariant?: 'default' | 'success' | 'warning' | 'outline';
    statusClassName?: string;
    onView?: () => void;
    onEdit?: () => void;
    onPause?: () => void;
    onReactivate?: () => void;
    onPublish?: () => void;
    onApplications?: () => void;
    onMessages?: () => void;
    onAnalytics?: () => void;
    onDelete?: () => void;
  };
}

export function RoomCard({
  room,
  property,
  variant = 'default',
  displayMode = 'grid',
  showFavorite = true,
  showPropertyContext = true,
  availableRooms,
  onFavoriteRequiresAuth,
  compareProps,
  managementActions,
}: RoomCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const isFav = isFavorite(room.id);
  const isManagement = variant === 'management';

  const personalizedCompatibility = user?.type === 'student'
    ? getRoomCompatibilityScore(user.id, room, property)
    : undefined;

  const displayCompatibility = personalizedCompatibility ?? room.compatibilityScore;

  const canShowCompatibility = Boolean(
    !isManagement &&
    user?.type === 'student' &&
    displayCompatibility
  );

  const handleClick = () => navigate(`/room/${room.id}`);

  const handlePropertyClick = (event: MouseEvent) => {
    event.stopPropagation();
    navigate(`/property/${property.id}`);
  };

  const handleFavoriteClick = (event: MouseEvent) => {
    event.stopPropagation();

    if (!user) {
      onFavoriteRequiresAuth?.();
      return;
    }

    toggleFavorite(room.id, property.id);
  };

  const roomTypeBadge = (() => {
    const types = {
      private: { label: 'Privado', color: 'bg-blue-100 text-blue-700' },
      shared: { label: 'Partilhado', color: 'bg-accent/15 text-accent' },
      studio: { label: 'Estúdio', color: 'bg-green-100 text-green-700' },
      apartment: { label: 'Apartamento', color: 'bg-orange-100 text-orange-700' },
    };

    return types[room.roomType];
  })();

  const roomRating = getAverageRatingBreakdown(room.id);
  const availability = getAvailabilityLabel(room.availableFrom);
  const walk = walkMinutes(property.distanceToUniversity);
  const totalPrice = room.price + (room.utilities || 0);

  const isVerifiedLandlord = (() => {
    const verification = getVerificationStatus(property.landlordId);
    return verification?.level === 'gold' || verification?.level === 'silver';
  })();

  const compatibilityTone =
    (displayCompatibility || 0) >= 80
      ? 'text-secondary'
      : (displayCompatibility || 0) >= 60
        ? 'text-accent'
        : 'text-muted-foreground';

  const compatibilityChipClasses =
    (displayCompatibility || 0) >= 80
      ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
      : (displayCompatibility || 0) >= 60
        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
        : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';

  if (displayMode === 'list' && !isManagement) {
    return (
      <Card
        className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
        onClick={handleClick}
      >
        <div className="flex">
          <div className="relative w-36 sm:w-44 flex-shrink-0 overflow-hidden bg-muted">
            <img
              src={room.images[0] || property.images[0]}
              alt={room.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              style={{ minHeight: '120px' }}
            />

            <div className="absolute top-2 left-2">
              <Badge variant="default" className={`${roomTypeBadge.color} text-[10px] px-1.5 py-0.5`}>
                {roomTypeBadge.label}
              </Badge>
            </div>

            {showFavorite && (
              <button
                onClick={handleFavoriteClick}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all"
                aria-label={isFav ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
              </button>
            )}
          </div>

          <div className="flex-1 p-4 flex gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1.5 mb-1">
                <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors flex-1 text-sm">
                  {room.title}
                </h3>

                {property.verified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mb-2">
                {showPropertyContext && (
                  <button
                    type="button"
                    onClick={handlePropertyClick}
                    className="flex items-center gap-1 font-medium text-primary hover:underline text-left"
                  >
                    <Home className="w-3 h-3 flex-shrink-0" />
                    Ver página da casa
                    {availableRooms !== undefined && (
                      <span className="text-green-700">
                        · {availableRooms} quarto{availableRooms !== 1 ? 's' : ''} livre{availableRooms !== 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                )}

                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {property.zone}, {property.city}
                </span>

                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3 flex-shrink-0" />
                  ~{walk}min a pé · {property.distanceToUniversity}km
                </span>

                {room.size && (
                  <span className="flex items-center gap-1">
                    <Maximize className="w-3 h-3" />
                    {room.size}m²
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {property.amenities.wifi && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full flex items-center gap-0.5">
                    <Wifi className="w-2.5 h-2.5" /> Wi-Fi
                  </span>
                )}

                {property.amenities.laundry && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">
                    Lavar roupa
                  </span>
                )}

                {property.amenities.kitchen && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">
                    Cozinha
                  </span>
                )}

                {property.houseRules?.parties === false && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">
                    Sem festas
                  </span>
                )}

                {property.houseRules?.quietHours && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">
                    Silêncio {property.houseRules.quietHours}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                <span className={`flex items-center gap-1 font-medium ${availability.cls}`}>
                  <CalendarDays className="w-3 h-3" />
                  {availability.text}
                </span>

                {roomRating.total > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {roomRating.average.toFixed(1)} ({roomRating.total})
                  </span>
                )}

                {isVerifiedLandlord && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <ShieldCheck className="w-3 h-3" /> Senhorio verificado
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0 pl-3 border-l border-border">
              <div className="text-right">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold text-primary">€{room.price}</span>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>

                {room.utilities && room.utilities > 0 ? (
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                    +€{room.utilities} desp. · €{totalPrice} total
                  </p>
                ) : (
                  <p className="text-[10px] text-green-600">Despesas incluídas</p>
                )}
              </div>

              {canShowCompatibility && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${compatibilityChipClasses}`}
                  title="Compatibilidade com o teu perfil"
                >
                  {displayCompatibility}% compatível
                </span>
              )}

              <Button
                variant={variant === 'public' ? 'primary' : 'outline'}
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  handleClick();
                }}
              >
                Ver detalhes
              </Button>

              {compareProps && (
                <button
                  onClick={compareProps.onToggle}
                  disabled={compareProps.disabled}
                  className={`text-[11px] px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 whitespace-nowrap ${
                    compareProps.isComparing
                      ? 'bg-primary/10 text-primary border-primary'
                      : compareProps.disabled
                        ? 'bg-muted text-muted-foreground border-border opacity-40 cursor-not-allowed'
                        : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  {compareProps.isComparing ? (
                    <>
                      <Check className="w-3 h-3" />
                      Comparar
                    </>
                  ) : (
                    <>
                      <Columns className="w-3 h-3" />
                      Comparar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const imageHeight = variant === 'compact' ? 'h-36' : isManagement ? 'h-48' : 'h-52';

  return (
    <Card
      className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group"
      onClick={handleClick}
    >
      <div className={`relative ${imageHeight} overflow-hidden bg-muted`}>
        <img
          src={room.images[0] || property.images[0]}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge variant="default" className={roomTypeBadge.color}>
            {roomTypeBadge.label}
          </Badge>

          {property.verified && (
            <Badge variant="default" className="bg-white/92 text-blue-700 border-blue-200">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Verificado
            </Badge>
          )}

          {isManagement && managementActions && (
            <Badge
              variant={managementActions.statusVariant || 'default'}
              className={`${managementActions.statusClassName || ''} bg-white/95 shadow-sm`}
            >
              {managementActions.statusLabel}
            </Badge>
          )}

          {room.privateBathroom && (
            <Badge variant="default" className="bg-white/90 text-foreground">
              <Bath className="w-3 h-3 mr-1" />
              WC privado
            </Badge>
          )}
        </div>

        {showFavorite && !isManagement && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-sm"
            aria-label={isFav ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {room.title}
        </h3>

        {showPropertyContext && (
          <button
            type="button"
            onClick={handlePropertyClick}
            className="mb-3 flex w-full items-center justify-between gap-3 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-left text-xs text-primary transition-colors hover:border-primary/30 hover:bg-primary/10"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Home className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-semibold text-primary">Ver página da casa</span>
            </span>
            {availableRooms !== undefined && (
              <span className="flex-shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                {availableRooms} quarto{availableRooms !== 1 ? 's' : ''} livre{availableRooms !== 1 ? 's' : ''}
              </span>
            )}
          </button>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            {property.zone}, {property.city}
          </span>

          <span className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
            ~{walk}min a pé · {property.distanceToUniversity}km
          </span>

          {room.size && (
            <span className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5" />
              {room.size}m²
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {property.amenities.wifi && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
              <Wifi className="w-3 h-3" /> Wi-Fi
            </span>
          )}

          {property.amenities.laundry && (
            <span className="text-[11px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
              Lavar roupa
            </span>
          )}

          {property.amenities.kitchen && (
            <span className="text-[11px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
              Cozinha
            </span>
          )}

          {property.houseRules?.parties === false && (
            <span className="text-[11px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
              Sem festas
            </span>
          )}

          {property.houseRules?.quietHours && (
            <span className="text-[11px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
              Silêncio {property.houseRules.quietHours}
            </span>
          )}
        </div>

        <div className={`flex items-center gap-1.5 text-sm font-medium mb-4 ${availability.cls}`}>
          <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
          {availability.text}
        </div>

        <div className="flex items-end justify-between pt-3 border-t border-border">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary">€{room.price}</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>

            {room.utilities && room.utilities > 0 ? (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                +€{room.utilities} desp. · total €{totalPrice}/mês
              </p>
            ) : (
              <p className="text-[11px] text-green-600 mt-0.5">Despesas incluídas</p>
            )}

            {roomRating.total > 0 ? (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-foreground">{roomRating.average.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({roomRating.total})</span>
              </div>
            ) : property.verified ? (
              <div className="flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-600">Anúncio verificado</span>
              </div>
            ) : null}
          </div>

          {canShowCompatibility && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Compatibilidade</div>
              <div className={`text-sm font-bold ${compatibilityTone}`}>
                {displayCompatibility}% compatível
              </div>
            </div>
          )}
        </div>

        {isManagement && managementActions ? (
          <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-border">
            {managementActions.onView && (
              <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); managementActions.onView?.(); }}>
                <Eye className="w-4 h-4 mr-1" /> Ver anúncio
              </Button>
            )}

            {managementActions.onEdit && (
              <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); managementActions.onEdit?.(); }}>
                <Edit className="w-4 h-4 mr-1" /> Editar
              </Button>
            )}

            {managementActions.onPause && (
              <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); managementActions.onPause?.(); }}>
                <Pause className="w-4 h-4 mr-1" /> Pausar
              </Button>
            )}

            {managementActions.onReactivate && (
              <Button variant="primary" size="sm" onClick={(event) => { event.stopPropagation(); managementActions.onReactivate?.(); }}>
                <Play className="w-4 h-4 mr-1" /> Reativar
              </Button>
            )}

            {managementActions.onPublish && (
              <Button variant="primary" size="sm" onClick={(event) => { event.stopPropagation(); managementActions.onPublish?.(); }}>
                <Play className="w-4 h-4 mr-1" /> Publicar
              </Button>
            )}

            {managementActions.onApplications && (
              <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); managementActions.onApplications?.(); }}>
                <FileText className="w-4 h-4 mr-1" /> Candidaturas
              </Button>
            )}

            {managementActions.onMessages && (
              <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); managementActions.onMessages?.(); }}>
                <MessageCircle className="w-4 h-4 mr-1" /> Mensagens
              </Button>
            )}

            {managementActions.onAnalytics && (
              <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); managementActions.onAnalytics?.(); }}>
                <BarChart3 className="w-4 h-4 mr-1" /> Analytics
              </Button>
            )}

            {managementActions.onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={(event) => { event.stopPropagation(); managementActions.onDelete?.(); }}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Arquivar
              </Button>
            )}
          </div>
        ) : (
          <>
            <Button
              variant={variant === 'public' ? 'primary' : 'outline'}
              size="sm"
              className="w-full mt-4"
              onClick={(event) => {
                event.stopPropagation();
                handleClick();
              }}
            >
              Ver detalhes
            </Button>

            {compareProps && (
              <button
                onClick={compareProps.onToggle}
                disabled={compareProps.disabled}
                className={`w-full mt-2 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border ${
                  compareProps.isComparing
                    ? 'bg-primary/10 text-primary border-primary'
                    : compareProps.disabled
                      ? 'bg-muted text-muted-foreground border-border cursor-not-allowed opacity-40'
                      : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
                }`}
              >
                {compareProps.isComparing ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Na comparação
                  </>
                ) : (
                  <>
                    <Columns className="w-3.5 h-3.5" />
                    Comparar
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

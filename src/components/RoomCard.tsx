import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  MapPin,
  Users,
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
} from 'lucide-react';
import { Room, Property } from '../types/property';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { getAverageRatingBreakdown } from '../data/mockTrust';

interface CompareProps {
  isComparing: boolean;
  onToggle: (e: MouseEvent) => void;
  disabled: boolean;
}

interface RoomCardProps {
  room: Room;
  property: Property;
  variant?: 'default' | 'public' | 'management' | 'compact';
  showFavorite?: boolean;
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
  showFavorite = true,
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

  const handleClick = () => {
    navigate(`/room/${room.id}`);
  };

  const handleFavoriteClick = (event: MouseEvent) => {
    event.stopPropagation();

    if (!user) {
      onFavoriteRequiresAuth?.();
      return;
    }

    toggleFavorite(room.id);
  };

  const getRoomTypeBadge = () => {
    const types = {
      private: { label: 'Privado', color: 'bg-blue-100 text-blue-700' },
      shared: { label: 'Partilhado', color: 'bg-accent/15 text-accent' },
      studio: { label: 'Estúdio', color: 'bg-green-100 text-green-700' },
      apartment: { label: 'Apartamento', color: 'bg-orange-100 text-orange-700' },
    };

    return types[room.roomType];
  };

  const roomTypeBadge = getRoomTypeBadge();
  const roomRating = getAverageRatingBreakdown(room.id);

  const compatibilityTone =
    (room.compatibilityScore || 0) >= 80
      ? 'text-secondary'
      : (room.compatibilityScore || 0) >= 60
      ? 'text-accent'
      : 'text-muted-foreground';

  const imageHeight = variant === 'compact' ? 'h-36' : isManagement ? 'h-48' : 'h-56';

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

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
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
              WC Privado
            </Badge>
          )}
        </div>

        {showFavorite && !isManagement && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-sm"
            aria-label={isFav ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
          >
            <Heart
              className={`w-4 h-4 ${
                isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
              }`}
            />
          </button>
        )}

        <div className="absolute bottom-3 left-3">
          <Badge variant="default" className="bg-white/95 text-foreground">
            <Home className="w-3 h-3 mr-1" />
            Casa com {property.totalRooms} quartos
          </Badge>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {room.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Home className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="line-clamp-1">Parte de {property.title}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {property.zone}, {property.city}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
          {property.title}
        </p>

        <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
          {room.size && (
            <div className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5" />
              <span>{room.size}m²</span>
            </div>
          )}

          {room.balcony && (
            <div className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span>Varanda</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{property.distanceToUniversity}km da uni</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Casa</p>
            <p className="text-sm font-semibold text-foreground">
              {property.totalRooms} quartos
            </p>
          </div>

          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Disponibilidade</p>
            <p className="text-sm font-semibold text-foreground">
              {availableRooms !== undefined
                ? `${availableRooms} livres`
                : `Até ${room.maxOccupants} estudante${room.maxOccupants > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between pt-3 border-t border-border">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary">€{room.price}</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
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

          {room.compatibilityScore && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Compatibilidade</div>
              <div className={`text-sm font-bold ${compatibilityTone}`}>
                {room.compatibilityScore}%
              </div>
            </div>
          )}
        </div>

        {isManagement && managementActions ? (
          <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-border">
            {managementActions.onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  managementActions.onView?.();
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver anúncio
              </Button>
            )}

            {managementActions.onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  managementActions.onEdit?.();
                }}
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
            )}

            {managementActions.onPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  managementActions.onPause?.();
                }}
              >
                <Pause className="w-4 h-4 mr-1" />
                Pausar
              </Button>
            )}

            {managementActions.onReactivate && (
              <Button
                variant="primary"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  managementActions.onReactivate?.();
                }}
              >
                <Play className="w-4 h-4 mr-1" />
                Reativar
              </Button>
            )}

            {managementActions.onPublish && (
              <Button
                variant="primary"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  managementActions.onPublish?.();
                }}
              >
                <Play className="w-4 h-4 mr-1" />
                Publicar
              </Button>
            )}

            {managementActions.onApplications && (
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  managementActions.onApplications?.();
                }}
              >
                <FileText className="w-4 h-4 mr-1" />
                Candidaturas
              </Button>
            )}

            {managementActions.onMessages && (
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  managementActions.onMessages?.();
                }}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Mensagens
              </Button>
            )}

            {managementActions.onAnalytics && (
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  managementActions.onAnalytics?.();
                }}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Analytics
              </Button>
            )}

            {managementActions.onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={(event) => {
                  event.stopPropagation();
                  managementActions.onDelete?.();
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Arquivar
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
                {compareProps.isComparing
                  ? <><Check className="w-3.5 h-3.5" /> Na comparação</>
                  : <><Columns className="w-3.5 h-3.5" /> Comparar</>
                }
              </button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
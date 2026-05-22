import { MapPin, BedDouble, Eye, Edit, Pause, Play, Trash2, Navigation, Wifi, Car, Check } from 'lucide-react';
import { Property } from '../types/property';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';

interface PropertyCardProps {
  property: Property;
  roomCount: number;
  availableRooms: number;
  reservedRooms?: number;
  occupiedRooms?: number;
  pausedRooms?: number;
  onView: () => void;
  onEdit: () => void;
  onPause?: () => void;
  onReactivate?: () => void;
  onPublish?: () => void;
  onDelete: () => void;
}

export function PropertyCard({
  property,
  roomCount,
  availableRooms,
  reservedRooms = 0,
  occupiedRooms = 0,
  pausedRooms = 0,
  onView,
  onEdit,
  onPause,
  onReactivate,
  onPublish,
  onDelete,
}: PropertyCardProps) {
  const getStatusBadge = () => {
    const configs = {
      active: { label: 'Ativo', variant: 'success' as const, className: '' },
      paused: { label: 'Pausado', variant: 'warning' as const, className: '' },
      draft: { label: 'Rascunho', variant: 'default' as const, className: 'bg-blue-100 text-blue-700 border-blue-200' },
      archived: { label: 'Arquivado', variant: 'default' as const, className: 'bg-muted text-foreground border-border' },
    };
    return configs[property.status];
  };

  const statusBadge = getStatusBadge();

  const roomStats = [
    { count: availableRooms, label: 'disp.', dotClass: 'bg-green-500', textClass: 'text-green-700', always: true },
    { count: reservedRooms, label: 'res.', dotClass: 'bg-blue-500', textClass: 'text-blue-700', always: false },
    { count: occupiedRooms, label: 'ocup.', dotClass: 'bg-orange-500', textClass: 'text-orange-700', always: false },
    { count: pausedRooms, label: 'paus.', dotClass: 'bg-gray-400', textClass: 'text-gray-500', always: false },
  ].filter(s => s.always || s.count > 0);

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-border">
      <div className="relative h-48 bg-muted">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover"
        />

        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 bg-white/95 px-2.5 py-1.5 rounded-full shadow-sm">
            <BedDouble className="w-3.5 h-3.5 text-foreground/70" />
            <span className="text-xs font-bold text-foreground">{roomCount} quartos</span>
          </div>
        </div>

        <div className="absolute top-3 right-3">
          <Badge variant={statusBadge.variant} className={`${statusBadge.className} font-semibold shadow-md border`}>
            {statusBadge.label}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-base text-foreground mb-2 line-clamp-2 leading-snug">
          {property.title}
        </h3>

        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
            <span className="line-clamp-1 text-xs">{property.zone}, {property.city}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md whitespace-nowrap">
            <Navigation className="w-3 h-3" />
            {property.distanceToUniversity}km
          </div>
        </div>

        {/* Room occupancy strip */}
        <div className="flex items-center gap-2 flex-wrap mb-3 py-2 px-3 bg-muted/50 rounded-lg border border-border/50">
          {roomStats.map(stat => (
            <div key={stat.label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stat.dotClass}`} />
              <span className={`text-xs font-semibold ${stat.textClass}`}>{stat.count}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
          {roomStats.length > 1 && roomStats.map((_, i) => i < roomStats.length - 1 && (
            <span key={`sep-${i}`} className="text-border text-xs select-none">·</span>
          )).filter(Boolean)}
        </div>

        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
          {property.amenities.wifi && (
            <div className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5" />
              <span>WiFi</span>
            </div>
          )}
          {property.amenities.parking && (
            <div className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5" />
              <span>Parking</span>
            </div>
          )}
          {property.verified && (
            <div className="flex items-center gap-1 text-green-600">
              <Check className="w-3.5 h-3.5" />
              <span>Verificado</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>

          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>

          {property.status === 'active' && onPause && (
            <Button variant="outline" size="sm" onClick={onPause}>
              <Pause className="w-4 h-4 mr-1" />
              Pausar
            </Button>
          )}

          {property.status === 'paused' && onReactivate && (
            <Button variant="primary" size="sm" onClick={onReactivate}>
              <Play className="w-4 h-4 mr-1" />
              Reativar
            </Button>
          )}

          {property.status === 'draft' && onPublish && (
            <Button variant="primary" size="sm" onClick={onPublish}>
              <Play className="w-4 h-4 mr-1" />
              Publicar
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Eliminar
          </Button>
        </div>

        <div className="text-xs text-muted-foreground/70 mt-2.5 text-center">
          {property.views} visualizações
        </div>
      </div>
    </Card>
  );
}

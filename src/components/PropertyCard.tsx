import { MapPin, BedDouble, Eye, Edit, Pause, Play, Trash2, Navigation, Wifi, Car, Check } from 'lucide-react';
import { Property } from '../types/property';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';

interface PropertyCardProps {
  property: Property;
  roomCount: number;
  availableRooms: number;
  occupiedRooms?: number;
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
  occupiedRooms = 0,
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

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-border">
      <div className="relative h-56 bg-muted">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover"
        />

        <div className="absolute top-3 right-3">
          <Badge variant={statusBadge.variant} className={`${statusBadge.className} font-semibold shadow-md border`}>
            {statusBadge.label}
          </Badge>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-full">
              <BedDouble className="w-4 h-4 text-[#1F2937]" />
              <span className="text-sm font-bold text-[#111827]">{roomCount} quartos</span>
            </div>
            <div className="flex items-center gap-1.5 bg-green-500 px-3 py-1.5 rounded-full">
              <Check className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">{availableRooms} disponíveis</span>
            </div>
            {occupiedRooms > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500 px-3 py-1.5 rounded-full">
                <span className="text-sm font-bold text-white">{occupiedRooms} ocupados</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-lg text-[#111827] mb-3 line-clamp-2">
          {property.title}
        </h3>

        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-[#4B5563] flex-1 min-w-0">
            <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
            <span className="line-clamp-1">{property.zone}, {property.city}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md whitespace-nowrap">
            <Navigation className="w-3.5 h-3.5" />
            {property.distanceToUniversity}km
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4 text-xs text-[#6B7280]">
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

        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>

          {property.status === 'active' && onPause && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPause}
            >
              <Pause className="w-4 h-4 mr-1" />
              Pausar
            </Button>
          )}

          {property.status === 'paused' && onReactivate && (
            <Button
              variant="primary"
              size="sm"
              onClick={onReactivate}
            >
              <Play className="w-4 h-4 mr-1" />
              Reativar
            </Button>
          )}

          {property.status === 'draft' && onPublish && (
            <Button
              variant="primary"
              size="sm"
              onClick={onPublish}
            >
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

        <div className="text-xs text-[#9CA3AF] mt-3 text-center">
          {property.views} visualizações
        </div>
      </div>
    </Card>
  );
}
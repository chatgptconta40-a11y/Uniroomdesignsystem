import { Link } from 'react-router';
import { MapPin, Heart, Users, Calendar, CheckCircle, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { Accommodation } from '../types/accommodation';
import { Badge } from './Badge';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface AccommodationCardProps {
  accommodation: Accommodation;
}

export function AccommodationCard({ accommodation }: AccommodationCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();

  const maxBudget = user?.studentProfile?.preferences?.maxBudget;
  const isAboveBudget = maxBudget && accommodation.price > maxBudget;

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'success'; // green
    if (score >= 60) return 'warning'; // yellow/orange
    return 'destructive'; // orange/red
  };

  const getCompatibilityBgColor = (score: number) => {
    if (score >= 80) return 'bg-secondary';
    if (score >= 60) return 'bg-accent';
    return 'bg-destructive';
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newState = toggleFavorite(accommodation.id);
    if (newState === false && isFavorite(accommodation.id) === false) {
      toast.error('Precisas de fazer login para guardar favoritos');
      return;
    }
    toast.success(newState ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
  };

  const getRoomTypeLabel = (type: string) => {
    const labels = {
      shared: 'Partilhado',
      private: 'Privado',
      studio: 'Estúdio',
      apartment: 'Apartamento',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Link to={`/accommodation/${accommodation.id}`} className="block h-full">
      <div className="group bg-card rounded-xl border border-border overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={accommodation.images[0]}
            alt={accommodation.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Compatibility Badge */}
          <div className={`absolute top-4 left-4 ${getCompatibilityBgColor(accommodation.compatibilityScore || 0)} text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg`}>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-bold">{accommodation.compatibilityScore || 0}%</span>
          </div>

          {/* Above Budget Badge */}
          {isAboveBudget && (
            <div className="absolute top-16 left-4 bg-destructive text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Acima do orçamento
            </div>
          )}

          {/* Verified Badge */}
          {accommodation.verified && (
            <div className="absolute top-4 right-16 bg-primary text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Verificado
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-4 right-4 w-10 h-10 bg-white/95 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
          >
            <Heart
              className={`w-5 h-5 ${isFavorite(accommodation.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`}
            />
          </button>

          {/* Multiple Images Indicator */}
          {accommodation.images.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              {accommodation.images.length}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {accommodation.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{accommodation.zone}, {accommodation.city}</span>
          </div>

          {/* Price */}
          <div className="mb-4">
            <span className="text-3xl font-bold text-foreground">€{accommodation.price}</span>
            <span className="text-base text-muted-foreground">/mês</span>
          </div>

          {/* Distance */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">
              {accommodation.distanceToUniversity < 1
                ? `${Math.round(accommodation.distanceToUniversity * 1000)}m`
                : `${accommodation.distanceToUniversity}km`}{' '}
              da {accommodation.universityName}
            </span>
          </div>

          {/* Mini Badges */}
          <div className="flex flex-wrap gap-2 mt-auto">
            <Badge variant="outline">
              {getRoomTypeLabel(accommodation.roomType)}
            </Badge>
            <Badge variant="outline">
              <Users className="w-3 h-3" />
              {accommodation.currentOccupants}/{accommodation.maxOccupants}
            </Badge>
            <Badge variant="outline">
              <Calendar className="w-3 h-3" />
              {new Date(accommodation.availableFrom).toLocaleDateString('pt-PT', {
                month: 'short',
                year: 'numeric',
              })}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}

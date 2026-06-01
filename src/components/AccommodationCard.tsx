import type { MouseEvent } from 'react';
import { Link } from 'react-router';
import {
  MapPin,
  Heart,
  Users,
  Calendar,
  CheckCircle,
  Image as ImageIcon,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Accommodation } from '../types/accommodation';
import { Badge } from './Badge';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { hasCompletedCompatibilityProfile } from '../data/mockProfiles';
import { toast } from 'sonner';

interface AccommodationCardProps {
  accommodation: Accommodation;
}

export function AccommodationCard({ accommodation }: AccommodationCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();

  const maxBudget = user?.studentProfile?.preferences?.maxBudget;
  const isAboveBudget = maxBudget && accommodation.price > maxBudget;
  const isFav = isFavorite(accommodation.id);

  const canShowCompatibility = Boolean(
    (user?.type === 'student' || user?.type === 'landlord') &&
      hasCompletedCompatibilityProfile(user.id) &&
      accommodation.compatibilityScore,
  );

  const getCompatibilityChipClasses = (score: number) => {
    if (score >= 80) return 'bg-green-50 text-green-700 ring-1 ring-green-200';
    if (score >= 60) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    return 'bg-slate-50 text-slate-600 ring-1 ring-slate-200';
  };

  const handleToggleFavorite = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast.error('Precisas de fazer login para guardar favoritos');
      return;
    }

    const added = toggleFavorite(accommodation.id);

    toast.success(added ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
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
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={accommodation.images[0]}
            alt={accommodation.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {isAboveBudget && (
            <div className="absolute top-4 left-4 bg-destructive text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Acima do orçamento
            </div>
          )}

          {accommodation.verified && (
            <div className="absolute top-4 right-16 bg-primary text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Verificado
            </div>
          )}

          <button
            type="button"
            onClick={handleToggleFavorite}
            className="absolute top-4 right-4 w-10 h-10 bg-white/95 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
            aria-label={isFav ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
          >
            <Heart
              className={`w-5 h-5 ${
                isFav ? 'fill-destructive text-destructive' : 'text-muted-foreground'
              }`}
            />
          </button>

          {accommodation.images.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              {accommodation.images.length}
            </div>
          )}
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {accommodation.title}
          </h3>

          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">
              {accommodation.zone}, {accommodation.city}
            </span>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-3xl font-bold text-foreground">€{accommodation.price}</span>
              <span className="text-base text-gray-500">/mês</span>
            </div>

            {canShowCompatibility && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${getCompatibilityChipClasses(
                  accommodation.compatibilityScore || 0,
                )}`}
                title="Compatibilidade com o teu perfil"
              >
                <Sparkles className="w-3 h-3" />
                {accommodation.compatibilityScore}% compatível
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-5">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">
              {accommodation.distanceToUniversity < 1
                ? `${Math.round(accommodation.distanceToUniversity * 1000)}m`
                : `${accommodation.distanceToUniversity}km`}{' '}
              da {accommodation.universityName}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-auto">
            <Badge variant="outline">{getRoomTypeLabel(accommodation.roomType)}</Badge>

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
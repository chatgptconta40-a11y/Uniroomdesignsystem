import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useProperties } from '../context/PropertiesContext';
import { Button } from './Button';
import { RoomCard } from './RoomCard';
import { Property, Room } from '../types/property';
import { HomeSearchFilters } from '../app/components/Hero';

interface FeaturedRoom {
  room: Room;
  property: Property;
}

interface FeaturedRoomsSectionProps {
  filters?: HomeSearchFilters | null;
}

function matchesUniversity(property: Property, university: string) {
  if (!university) return true;
  const normalized = university.toLowerCase();

  if (normalized.includes('estgv')) {
    return property.city === 'Viseu' && property.distanceToUniversity <= 1.5;
  }

  if (normalized.includes('lisboa')) return property.city === 'Lisboa';
  if (normalized.includes('porto')) return property.city === 'Porto';
  if (normalized.includes('coimbra')) return property.city === 'Coimbra';
  if (normalized.includes('minho')) return property.city === 'Braga';

  return true;
}

export function FeaturedRoomsSection({ filters }: FeaturedRoomsSectionProps) {
  const { rooms, properties, loading } = useProperties();

  const activeProperties = properties.filter(
    property => property.status === 'active' && !property.adminSuspended
  );
  const propertyById = new Map(activeProperties.map(property => [property.id, property]));

  console.log('[home] total properties:', properties.length);
  console.log('[home] active properties:', activeProperties.length);
  console.log('[home] total rooms:', rooms.length);
  const maxPrice = filters?.maxPrice ? Number(filters.maxPrice) : null;

  const featuredRooms: FeaturedRoom[] = rooms
    .filter(room => {
      const property = propertyById.get(room.propertyId);
      if (!property || room.status !== 'available') return false;

      if (filters?.city && property.city !== filters.city) return false;
      if (filters?.university && !matchesUniversity(property, filters.university)) return false;
      if (maxPrice && room.price > maxPrice) return false;
      if (filters?.roomType && filters.roomType !== 'any' && room.roomType !== filters.roomType) return false;
      if (filters?.moveIn) {
        const selectedMonth = new Date(`${filters.moveIn}-01`);
        const availableFrom = new Date(room.availableFrom);
        if (availableFrom > selectedMonth) return false;
      }

      return true;
    })
    .sort((a, b) => {

      const propertyA = propertyById.get(a.propertyId)!;
      const propertyB = propertyById.get(b.propertyId)!;

      if (propertyA.verified !== propertyB.verified) {
        return propertyA.verified ? -1 : 1;
      }

      if (propertyA.distanceToUniversity !== propertyB.distanceToUniversity) {
        return propertyA.distanceToUniversity - propertyB.distanceToUniversity;
      }

      if (a.price !== b.price) {
        return a.price - b.price;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, filters ? 12 : 6)
    .map(room => ({
      room,
      property: propertyById.get(room.propertyId)!,
    }));

  console.log('[home] visible rooms:', featuredRooms.length);
  console.log('[home] rendered cards:', featuredRooms.map(fr => fr.room.id));

  return (
    <section className="py-10 md:py-12 px-4 md:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-7">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {filters ? 'Resultados da pesquisa' : 'Anúncios destacados'}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {filters
                ? 'Quartos disponíveis que correspondem aos filtros escolhidos na Home.'
                : 'Quartos verificados e perto das instituições, escolhidos para começares a pesquisa com segurança.'}
            </p>
          </div>

          <Link to="/search" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Mostrar tudo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-white animate-pulse h-72" />
            ))}
          </div>
        ) : featuredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {featuredRooms.map(({ room, property }) => (
              <RoomCard
                key={room.id}
                room={room}
                property={property}
                variant="public"
                showFavorite={false}
                availableRooms={rooms.filter(item => item.propertyId === property.id && item.status === 'available').length}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Nenhum quarto encontrado</h3>
            <p className="text-muted-foreground">
              {filters
                ? 'Ajusta a cidade, o preço ou o tipo de quarto para veres mais resultados.'
                : 'Ainda não há quartos disponíveis. Volta em breve.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

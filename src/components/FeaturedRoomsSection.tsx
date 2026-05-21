import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useProperties } from '../context/PropertiesContext';
import { Button } from './Button';
import { RoomCard } from './RoomCard';
import { Property, Room } from '../types/property';

interface FeaturedRoom {
  room: Room;
  property: Property;
}

export function FeaturedRoomsSection() {
  const { rooms, properties } = useProperties();

  const activeProperties = properties.filter(property => property.status === 'active');
  const propertyById = new Map(activeProperties.map(property => [property.id, property]));

  const featuredRooms: FeaturedRoom[] = rooms
    .filter(room => room.status === 'available' && propertyById.has(room.propertyId))
    .sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
    .slice(0, 6)
    .map(room => ({
      room,
      property: propertyById.get(room.propertyId)!,
    }));

  if (featuredRooms.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 px-4 md:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <h2 className="heading-2 mb-4">Quartos disponíveis para estudantes</h2>
            <p className="body-large text-muted-foreground">
              Explora opções reais antes de criares conta. Para te candidatares, guardar favoritos ou contactar o senhorio, só precisas de iniciar sessão.
            </p>
          </div>

          <Link to="/register" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Criar conta UniRoom
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

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
      </div>
    </section>
  );
}
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
    .slice(0, 6)
    .map(room => ({
      room,
      property: propertyById.get(room.propertyId)!,
    }));

  if (featuredRooms.length === 0) {
    return null;
  }

  return (
    <section className="py-10 md:py-12 px-4 md:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-7">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Anúncios destacados
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Quartos verificados e perto das instituições, escolhidos para começares a pesquisa com segurança.
            </p>
          </div>

          <Link to="/search" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Mostrar tudo
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

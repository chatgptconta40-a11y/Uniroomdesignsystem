import { useState, useMemo } from 'react';
import { Heart, Filter } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useProperties } from '../context/PropertiesContext';
import { useCompare } from '../context/CompareContext';
import { RoomCard } from '../components/RoomCard';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Property, Room } from '../types/property';

export function Favorites() {
  const { favoriteIds } = useFavorites();
  const { rooms, properties } = useProperties();
  const { isInCompare, toggleCompare, canAdd } = useCompare();
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  const propertyById = new Map(properties.map(property => [property.id, property]));

  const favoriteRooms = rooms
    .filter(room => favoriteIds.includes(room.id))
    .map(room => {
      const property = propertyById.get(room.propertyId);

      if (!property) return null;

      return {
        room,
        property,
        availableRooms: rooms.filter(item => item.propertyId === property.id && item.status === 'available').length,
      };
    })
    .filter((item): item is { room: Room; property: Property; availableRooms: number } => item !== null);

  const filteredRooms = useMemo(() => {
    if (filter === 'all') return favoriteRooms;

    if (filter === 'available') {
      return favoriteRooms.filter(item => item.room.status === 'available' && item.property.status === 'active');
    }

    return favoriteRooms.filter(item => item.room.status !== 'available' || item.property.status !== 'active');
  }, [favoriteRooms, filter]);

  const counts = {
    all: favoriteRooms.length,
    available: favoriteRooms.filter(item => item.room.status === 'available' && item.property.status === 'active').length,
    unavailable: favoriteRooms.filter(item => item.room.status !== 'available' || item.property.status !== 'active').length,
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-destructive fill-destructive" />
            </div>
            <h1 className="text-3xl font-bold">Os Meus Favoritos</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Guardaste {favoriteRooms.length} {favoriteRooms.length === 1 ? 'quarto' : 'quartos'}
          </p>
        </div>

        {favoriteRooms.length === 0 ? (
          <Card className="p-16 text-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-destructive" />
            </div>

            <h2 className="text-2xl font-bold mb-3">
              Ainda não tens favoritos
            </h2>

            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Começa a guardar quartos que gostes para os encontrar facilmente aqui.
            </p>

            <Button variant="primary" onClick={() => window.location.href = '/search'}>
              Procurar Alojamento
            </Button>
          </Card>
        ) : (
          <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="p-2 bg-muted rounded-lg w-fit">
                <Filter className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                    filter === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-card text-foreground border border-border hover:bg-muted'
                  }`}
                >
                  Todos
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      filter === 'all' ? 'bg-white/20' : 'bg-muted'
                    }`}
                  >
                    {counts.all}
                  </span>
                </button>

                <button
                  onClick={() => setFilter('available')}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                    filter === 'available'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-card text-foreground border border-border hover:bg-muted'
                  }`}
                >
                  Disponíveis
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      filter === 'available' ? 'bg-white/20' : 'bg-muted'
                    }`}
                  >
                    {counts.available}
                  </span>
                </button>

                <button
                  onClick={() => setFilter('unavailable')}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                    filter === 'unavailable'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-card text-foreground border border-border hover:bg-muted'
                  }`}
                >
                  Já não disponíveis
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      filter === 'unavailable' ? 'bg-white/20' : 'bg-muted'
                    }`}
                  >
                    {counts.unavailable}
                  </span>
                </button>
              </div>
            </div>

            {filteredRooms.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground text-lg">
                  Nenhum quarto {filter === 'available' ? 'disponível' : 'indisponível'} nos teus favoritos.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {filteredRooms.map(({ room, property, availableRooms }) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    property={property}
                    availableRooms={availableRooms}
                    compareProps={{
                      isComparing: isInCompare(room.id),
                      onToggle: (e) => { e.stopPropagation(); toggleCompare(room, property); },
                      disabled: !canAdd && !isInCompare(room.id),
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
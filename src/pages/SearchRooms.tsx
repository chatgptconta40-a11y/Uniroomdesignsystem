import { useState, useEffect } from 'react';
import { Search as SearchIcon, SlidersHorizontal, Grid, X } from 'lucide-react';
import { RoomCard } from '../components/RoomCard';
import { Button } from '../components/Button';
import { RangeSlider } from '../components/RangeSlider';
import { Checkbox } from '../components/Checkbox';
import { Card } from '../components/Card';
import { useProperties } from '../context/PropertiesContext';
import { Room, Property } from '../types/property';

interface SearchFilters {
  cities: string[];
  minPrice: number;
  maxPrice: number;
  roomTypes: ('private' | 'shared' | 'studio' | 'apartment')[];
  minCompatibility: number;
  maxDistance: number;
  privateBathroom?: boolean;
  balcony?: boolean;
  sortBy: 'compatibility' | 'price_asc' | 'price_desc' | 'distance' | 'recent';
}

export function SearchRooms() {
  const { rooms, properties } = useProperties();
  const [showFilters, setShowFilters] = useState(true);
  const [results, setResults] = useState<{ room: Room; property: Property; availableRooms: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    cities: [],
    minPrice: 200,
    maxPrice: 500,
    roomTypes: [],
    minCompatibility: 0,
    maxDistance: 10,
    sortBy: 'compatibility',
  });

  const cities = ['Viseu', 'Lisboa', 'Porto', 'Coimbra', 'Braga'];

  const roomTypes = [
    { value: 'private' as const, label: 'Privado' },
    { value: 'shared' as const, label: 'Partilhado' },
    { value: 'studio' as const, label: 'Estúdio' },
    { value: 'apartment' as const, label: 'Apartamento' },
  ];

  useEffect(() => {
    setLoading(true);

    const timeoutId = setTimeout(() => {
      const activeProperties = properties.filter(property => property.status === 'active');
      const activePropertyIds = activeProperties.map(property => property.id);
      const propertiesMap = new Map(activeProperties.map(property => [property.id, property]));

      let filteredRooms = rooms.filter(room =>
        room.status === 'available'
        && activePropertyIds.includes(room.propertyId),
      );

      if (filters.cities.length > 0) {
        filteredRooms = filteredRooms.filter(room => {
          const property = propertiesMap.get(room.propertyId);
          return property && filters.cities.includes(property.city);
        });
      }

      filteredRooms = filteredRooms.filter(room =>
        room.price >= filters.minPrice
        && room.price <= filters.maxPrice,
      );

      if (filters.roomTypes.length > 0) {
        filteredRooms = filteredRooms.filter(room => filters.roomTypes.includes(room.roomType));
      }

      if (filters.minCompatibility > 0) {
        filteredRooms = filteredRooms.filter(room => (room.compatibilityScore || 0) >= filters.minCompatibility);
      }

      filteredRooms = filteredRooms.filter(room => {
        const property = propertiesMap.get(room.propertyId);
        return property && property.distanceToUniversity <= filters.maxDistance;
      });

      if (filters.privateBathroom) {
        filteredRooms = filteredRooms.filter(room => room.privateBathroom);
      }

      if (filters.balcony) {
        filteredRooms = filteredRooms.filter(room => room.balcony);
      }

      const roomPropertyPairs = filteredRooms
        .map(room => {
          const property = propertiesMap.get(room.propertyId);

          if (!property) return null;

          return {
            room,
            property,
            availableRooms: rooms.filter(item => item.propertyId === property.id && item.status === 'available').length,
          };
        })
        .filter((pair): pair is { room: Room; property: Property; availableRooms: number } => pair !== null);

      roomPropertyPairs.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price_asc':
            return a.room.price - b.room.price;
          case 'price_desc':
            return b.room.price - a.room.price;
          case 'distance':
            return a.property.distanceToUniversity - b.property.distanceToUniversity;
          case 'recent':
            return new Date(b.room.createdAt).getTime() - new Date(a.room.createdAt).getTime();
          case 'compatibility':
          default:
            return (b.room.compatibilityScore || 0) - (a.room.compatibilityScore || 0);
        }
      });

      setResults(roomPropertyPairs);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [rooms, properties, filters]);

  const handleClearFilters = () => {
    setFilters({
      cities: [],
      minPrice: 200,
      maxPrice: 500,
      roomTypes: [],
      minCompatibility: 0,
      maxDistance: 10,
      sortBy: 'compatibility',
    });
  };

  const toggleCity = (city: string) => {
    const updated = filters.cities.includes(city)
      ? filters.cities.filter(item => item !== city)
      : [...filters.cities, city];

    setFilters({ ...filters, cities: updated });
  };

  const toggleRoomType = (type: 'private' | 'shared' | 'studio' | 'apartment') => {
    const updated = filters.roomTypes.includes(type)
      ? filters.roomTypes.filter(item => item !== type)
      : [...filters.roomTypes, type];

    setFilters({ ...filters, roomTypes: updated });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className={`lg:w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="sticky top-24 p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold">Filtros</h3>
                </div>

                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block mb-4 text-sm font-semibold text-foreground">
                    Cidade
                  </label>

                  <div className="space-y-3">
                    {cities.map(city => (
                      <Checkbox
                        key={city}
                        label={city}
                        checked={filters.cities.includes(city)}
                        onChange={() => toggleCity(city)}
                      />
                    ))}
                  </div>
                </div>

                <RangeSlider
                  label="Preço (€ / mês)"
                  min={200}
                  max={500}
                  step={10}
                  value={[filters.minPrice, filters.maxPrice]}
                  onChange={([min, max]) => setFilters({ ...filters, minPrice: min, maxPrice: max })}
                  formatValue={(value) => `€${value}`}
                />

                <div>
                  <label className="block mb-4 text-sm font-semibold text-foreground">
                    Tipo de quarto
                  </label>

                  <div className="space-y-3">
                    {roomTypes.map(type => (
                      <Checkbox
                        key={type.value}
                        label={type.label}
                        checked={filters.roomTypes.includes(type.value)}
                        onChange={() => toggleRoomType(type.value)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-4 text-sm font-semibold text-foreground">
                    Comodidades
                  </label>

                  <div className="space-y-3">
                    <Checkbox
                      label="Casa de banho privativa"
                      checked={filters.privateBathroom || false}
                      onChange={(event) => setFilters({ ...filters, privateBathroom: event.target.checked })}
                    />

                    <Checkbox
                      label="Varanda"
                      checked={filters.balcony || false}
                      onChange={(event) => setFilters({ ...filters, balcony: event.target.checked })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-4 text-sm font-semibold text-foreground">
                    Compatibilidade mínima:{' '}
                    <span className="text-primary font-bold">{filters.minCompatibility}%</span>
                  </label>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={filters.minCompatibility}
                    onChange={(event) => setFilters({ ...filters, minCompatibility: Number(event.target.value) })}
                    className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${filters.minCompatibility}%, var(--muted) ${filters.minCompatibility}%, var(--muted) 100%)`,
                    }}
                  />
                </div>

                <div>
                  <label className="block mb-4 text-sm font-semibold text-foreground">
                    Ordenar por
                  </label>

                  <select
                    value={filters.sortBy}
                    onChange={(event) => setFilters({ ...filters, sortBy: event.target.value as SearchFilters['sortBy'] })}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  >
                    <option value="compatibility">Compatibilidade</option>
                    <option value="price_asc">Preço menor</option>
                    <option value="price_desc">Preço maior</option>
                    <option value="distance">Distância</option>
                    <option value="recent">Mais recentes</option>
                  </select>
                </div>

                <div className="space-y-3 pt-6 border-t border-border">
                  <Button variant="outline" className="w-full" onClick={handleClearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Quartos disponíveis</h2>
                <p className="text-muted-foreground text-sm">
                  {loading ? 'A pesquisar...' : `${results.length} quartos encontrados`}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden px-4 py-2 border-2 border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                  <button className="p-2.5 rounded-md bg-card shadow-sm text-primary">
                    <Grid className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-card rounded-xl h-96 animate-pulse" />
                ))
              ) : results.length > 0 ? (
                results.map(({ room, property, availableRooms }) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    property={property}
                    availableRooms={availableRooms}
                  />
                ))
              ) : (
                <div className="col-span-full">
                  <Card className="text-center p-16">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                      <SearchIcon className="w-10 h-10 text-muted-foreground" />
                    </div>

                    <h3 className="text-xl font-bold mb-3">Nenhum quarto encontrado</h3>

                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Não encontrámos quartos que correspondam aos teus filtros. Tenta ajustar os critérios de pesquisa.
                    </p>

                    <Button variant="outline" onClick={handleClearFilters}>
                      Limpar filtros
                    </Button>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
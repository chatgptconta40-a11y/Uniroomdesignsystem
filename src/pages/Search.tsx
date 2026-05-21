import { useState, useEffect } from 'react';
import { Search as SearchIcon, SlidersHorizontal, Grid, Map as MapIcon, X } from 'lucide-react';
import { AccommodationCard } from '../components/AccommodationCard';
import { MapView } from '../components/MapView';
import { Button } from '../components/Button';
import { RangeSlider } from '../components/RangeSlider';
import { Checkbox } from '../components/Checkbox';
import { Card } from '../components/Card';
import { useAccommodations } from '../context/AccommodationsContext';
import { Accommodation, SearchFilters } from '../types/accommodation';

export function Search() {
  const { accommodations } = useAccommodations();
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [results, setResults] = useState<Accommodation[]>([]);
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
    { value: 'private', label: 'Privado' },
    { value: 'shared', label: 'Partilhado' },
    { value: 'studio', label: 'Estúdio' },
    { value: 'apartment', label: 'Apartamento' },
  ];

  // Search whenever accommodations or filters change
  useEffect(() => {
    setLoading(true);

    const timeoutId = setTimeout(() => {
      // Filter accommodations from context
      let filtered = accommodations.filter(a => a.status === 'active');

      // Filter by cities
      if (filters.cities && filters.cities.length > 0) {
        filtered = filtered.filter(a => filters.cities!.includes(a.city));
      }

      // Filter by price range
      if (filters.minPrice !== undefined) {
        filtered = filtered.filter(a => a.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        filtered = filtered.filter(a => a.price <= filters.maxPrice!);
      }

      // Filter by room types
      if (filters.roomTypes && filters.roomTypes.length > 0) {
        filtered = filtered.filter(a => filters.roomTypes!.includes(a.roomType));
      }

      // Filter by compatibility
      if (filters.minCompatibility && filters.minCompatibility > 0) {
        filtered = filtered.filter(a => (a.compatibilityScore || 0) >= filters.minCompatibility!);
      }

      // Filter by distance
      if (filters.maxDistance !== undefined) {
        filtered = filtered.filter(a => a.distanceToUniversity <= filters.maxDistance!);
      }

      // Sort results
      if (filters.sortBy) {
        filtered.sort((a, b) => {
          switch (filters.sortBy) {
            case 'price_asc':
              return a.price - b.price;
            case 'price_desc':
              return b.price - a.price;
            case 'distance':
              return a.distanceToUniversity - b.distanceToUniversity;
            case 'compatibility':
              return (b.compatibilityScore || 0) - (a.compatibilityScore || 0);
            case 'recent':
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            default:
              return 0;
          }
        });
      }

      setResults(filtered);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [accommodations, filters]);

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
    const current = filters.cities || [];
    const updated = current.includes(city)
      ? current.filter(c => c !== city)
      : [...current, city];
    setFilters({ ...filters, cities: updated });
  };

  const toggleRoomType = (type: string) => {
    const current = filters.roomTypes || [];
    const updated = current.includes(type as any)
      ? current.filter(t => t !== type)
      : [...current, type as any];
    setFilters({ ...filters, roomTypes: updated });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
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
                {/* Cities */}
                <div>
                  <label className="block mb-4 text-sm font-semibold text-foreground">
                    Cidade
                  </label>
                  <div className="space-y-3">
                    {cities.map(city => (
                      <Checkbox
                        key={city}
                        label={city}
                        checked={filters.cities?.includes(city) || false}
                        onChange={() => toggleCity(city)}
                      />
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <RangeSlider
                    label="Preço (€/mês)"
                    min={200}
                    max={500}
                    step={10}
                    value={[filters.minPrice || 200, filters.maxPrice || 500]}
                    onChange={([min, max]) => setFilters({ ...filters, minPrice: min, maxPrice: max })}
                    formatValue={(v) => `€${v}`}
                  />
                </div>

                {/* Room Types */}
                <div>
                  <label className="block mb-4 text-sm font-semibold text-foreground">
                    Tipo de alojamento
                  </label>
                  <div className="space-y-3">
                    {roomTypes.map(type => (
                      <Checkbox
                        key={type.value}
                        label={type.label}
                        checked={filters.roomTypes?.includes(type.value as any) || false}
                        onChange={() => toggleRoomType(type.value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Compatibility */}
                <div>
                  <label className="block mb-4 text-sm font-semibold text-foreground">
                    Compatibilidade mínima: <span className="text-primary font-bold">{filters.minCompatibility}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={filters.minCompatibility || 0}
                    onChange={(e) => setFilters({ ...filters, minCompatibility: Number(e.target.value) })}
                    className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${filters.minCompatibility}%, var(--muted) ${filters.minCompatibility}%, var(--muted) 100%)`,
                    }}
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="block mb-4 text-sm font-semibold text-foreground">
                    Ordenar por
                  </label>
                  <select
                    value={filters.sortBy || 'compatibility'}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  >
                    <option value="compatibility">Compatibilidade</option>
                    <option value="price_asc">Preço (menor)</option>
                    <option value="price_desc">Preço (maior)</option>
                    <option value="distance">Distância</option>
                    <option value="recent">Mais recentes</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-6 border-t border-border">
                  <Button variant="outline" className="w-full" onClick={handleClearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Alojamentos disponíveis</h2>
                <p className="text-muted-foreground text-sm">
                  {loading ? 'A procurar...' : `${results.length} alojamentos encontrados`}
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
                  <button
                    onClick={() => setView('grid')}
                    className={`p-2.5 rounded-md transition-colors ${
                      view === 'grid' ? 'bg-card shadow-sm text-primary' : 'hover:bg-card/50 text-muted-foreground'
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setView('map')}
                    className={`p-2.5 rounded-md transition-colors ${
                      view === 'map' ? 'bg-card shadow-sm text-primary' : 'hover:bg-card/50 text-muted-foreground'
                    }`}
                  >
                    <MapIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid View */}
            {view === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl h-96 animate-pulse" />
                  ))
                ) : results.length > 0 ? (
                  results.map(accommodation => (
                    <AccommodationCard key={accommodation.id} accommodation={accommodation} />
                  ))
                ) : (
                  <div className="col-span-full">
                    <Card className="text-center p-16">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <SearchIcon className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">Nenhum alojamento encontrado</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Não encontrámos alojamentos que correspondam aos teus filtros. Tenta ajustar os critérios de pesquisa.
                      </p>
                      <Button variant="outline" onClick={handleClearFilters}>
                        Limpar filtros
                      </Button>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Map View */}
            {view === 'map' && (
              loading ? (
                <div className="bg-card rounded-xl h-[650px] animate-pulse" />
              ) : results.length > 0 ? (
                <MapView accommodations={results} />
              ) : (
                <Card className="p-16 text-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <SearchIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Nenhum alojamento encontrado</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Não encontrámos alojamentos que correspondam aos teus filtros. Tenta ajustar os critérios de pesquisa.
                  </p>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpar filtros
                  </Button>
                </Card>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

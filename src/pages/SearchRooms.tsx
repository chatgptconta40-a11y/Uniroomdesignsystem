import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Search as SearchIcon,
  SlidersHorizontal,
  Grid,
  List,
  Map as MapIcon,
  X,
  MapPin,
  Navigation,
  CalendarDays,
  GraduationCap,
  ChevronDown,
  Home,
  Wifi,
  Bath,
  Maximize,
  Columns,
  Check,
  ArrowRight,
} from 'lucide-react';
import { RoomCard } from '../components/RoomCard';
import { Button } from '../components/Button';
import { Checkbox } from '../components/Checkbox';
import { Card } from '../components/Card';
import { useProperties } from '../context/PropertiesContext';
import { useCompare } from '../context/CompareContext';
import { useAuth } from '../context/AuthContext';
import { useStudentProfile } from '../hooks/useDb';
import { useAllVerificationStatuses } from '../hooks/useTrust';
import { Room, Property } from '../types/property';

type ViewMode = 'grid' | 'list' | 'map';

interface SearchFilters {
  query: string;
  cities: string[];
  university: string;
  entryMonth: string;
  minPrice: number;
  maxPrice: number;
  includeUtilitiesInPrice: boolean;
  roomTypes: ('private' | 'shared' | 'studio' | 'apartment')[];
  maxWalkMinutes: number;
  minCompatibility: number;
  verifiedListing: boolean;
  verifiedLandlord: boolean;
  privateBathroom: boolean;
  wifi: boolean;
  laundry: boolean;
  kitchen: boolean;
  noParties: boolean;
  quietHours: boolean;
  nearSupermarket: boolean;
  nearBusStop: boolean;
  sortBy: 'compatibility' | 'price_asc' | 'price_desc' | 'distance' | 'recent';
}

interface ResultItem {
  room: Room;
  property: Property;
  availableRooms: number;
}

interface PropertyGroup {
  property: Property;
  rooms: Room[];
  availableRooms: number;
  minPrice: number;
  maxCompatibility: number;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  cities: [],
  university: 'ESTGV',
  entryMonth: '',
  minPrice: 150,
  maxPrice: 600,
  includeUtilitiesInPrice: false,
  roomTypes: [],
  maxWalkMinutes: 60,
  minCompatibility: 0,
  verifiedListing: false,
  verifiedLandlord: false,
  privateBathroom: false,
  wifi: false,
  laundry: false,
  kitchen: false,
  noParties: false,
  quietHours: false,
  nearSupermarket: false,
  nearBusStop: false,
  sortBy: 'compatibility',
};

const UNIVERSITIES = [
  { value: 'ESTGV', label: 'ESTGV - Viseu' },
  { value: 'IPV', label: 'IPV - Viseu' },
  { value: 'UC', label: 'Universidade de Coimbra' },
  { value: 'UP', label: 'Universidade do Porto' },
  { value: 'UL', label: 'Universidade de Lisboa' },
  { value: 'UMinho', label: 'Universidade do Minho' },
];

const CITIES = ['Viseu', 'Lisboa', 'Porto', 'Coimbra', 'Braga', 'Aveiro', 'Guarda', 'Castelo Branco'];

const ROOM_TYPES = [
  { value: 'private' as const, label: 'Quarto privado' },
  { value: 'shared' as const, label: 'Quarto partilhado' },
  { value: 'studio' as const, label: 'Estúdio' },
  { value: 'apartment' as const, label: 'Apartamento' },
];

const ENTRY_MONTHS = [
  { value: '2026-07', label: 'Julho 2026' },
  { value: '2026-08', label: 'Agosto 2026' },
  { value: '2026-09', label: 'Setembro 2026' },
  { value: '2026-10', label: 'Outubro 2026' },
  { value: '2027-01', label: 'Janeiro 2027' },
  { value: '2027-02', label: 'Fevereiro 2027' },
];

const walkMinutes = (km: number) => Math.round(Number(km || 0) * 13);


const isNearSupermarket = (property: Property) =>
  property.zone.toLowerCase().includes('centro') || property.distanceToUniversity <= 0.5;

const isNearBusStop = (property: Property) => property.distanceToUniversity <= 1.5;

function groupResults(results: ResultItem[]): PropertyGroup[] {
  const grouped = results.reduce<Record<string, PropertyGroup>>((acc, item) => {
    if (!acc[item.property.id]) {
      acc[item.property.id] = {
        property: item.property,
        rooms: [],
        availableRooms: item.availableRooms,
        minPrice: item.room.price,
        maxCompatibility: item.room.compatibilityScore || 0,
      };
    }

    acc[item.property.id].rooms.push(item.room);
    acc[item.property.id].minPrice = Math.min(acc[item.property.id].minPrice, item.room.price);
    acc[item.property.id].maxCompatibility = Math.max(
      acc[item.property.id].maxCompatibility,
      item.room.compatibilityScore || 0,
    );

    return acc;
  }, {});

  return Object.values(grouped);
}

function buildGoogleMapsQuery(group: PropertyGroup | null, fallbackCity: string, universityLabel: string) {
  if (group) {
    const property = group.property;
    return [
      property.address,
      property.zone,
      property.city,
      'Portugal',
    ].filter(Boolean).join(', ');
  }

  return `${universityLabel || fallbackCity}, Portugal`;
}

function buildGoogleMapsEmbedUrl(query: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
}

function buildGoogleMapsOpenUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getSortLabel(sortBy: SearchFilters['sortBy'], canShowCompatibility: boolean) {
  if (sortBy === 'compatibility' && canShowCompatibility) return 'compatibilidade';
  if (sortBy === 'price_asc') return 'preço mais baixo';
  if (sortBy === 'price_desc') return 'preço mais alto';
  if (sortBy === 'distance') return 'proximidade à universidade';
  if (sortBy === 'recent') return 'mais recentes';
  return 'proximidade à universidade';
}

function EmptyState({
  filters,
  onClear,
  onUpdate,
  canShowCompatibility,
}: {
  filters: SearchFilters;
  onClear: () => void;
  onUpdate: (updates: Partial<SearchFilters>) => void;
  canShowCompatibility: boolean;
}) {
  const suggestions: { text: string; action: () => void }[] = [];

  if (filters.query.trim()) suggestions.push({ text: 'Limpar texto da pesquisa', action: () => onUpdate({ query: '' }) });
  if (filters.maxPrice < 400) suggestions.push({ text: 'Aumentar preço até €400', action: () => onUpdate({ maxPrice: 400 }) });
  if (filters.maxWalkMinutes < 60) suggestions.push({ text: 'Aumentar distância máxima', action: () => onUpdate({ maxWalkMinutes: 60 }) });
  if (filters.entryMonth) suggestions.push({ text: 'Remover filtro de data', action: () => onUpdate({ entryMonth: '' }) });
  if (filters.cities.length > 0) suggestions.push({ text: 'Remover filtro de cidade', action: () => onUpdate({ cities: [] }) });
  if (filters.roomTypes.length > 0) suggestions.push({ text: 'Mostrar todos os tipos de quarto', action: () => onUpdate({ roomTypes: [] }) });
  if (canShowCompatibility && filters.minCompatibility > 0) {
    suggestions.push({ text: 'Remover mínimo de compatibilidade', action: () => onUpdate({ minCompatibility: 0 }) });
  }

  return (
    <Card className="p-10 text-center max-w-lg mx-auto">
      <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <SearchIcon className="w-7 h-7 text-muted-foreground" />
      </div>

      <h3 className="font-bold mb-2 text-foreground">Nenhum quarto encontrado</h3>

      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        Os filtros atuais podem estar a esconder alojamentos disponíveis.
      </p>

      {suggestions.length > 0 && (
        <div className="space-y-2 mb-6 text-left">
          {suggestions.slice(0, 4).map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={suggestion.action}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm text-left group"
            >
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              <span>{suggestion.text}</span>
            </button>
          ))}
        </div>
      )}

      <Button variant="outline" onClick={onClear} className="w-full">
        Limpar todos os filtros
      </Button>
    </Card>
  );
}

function MapRoomCard({
  room,
  property,
  selected,
  isInCompare,
  toggleCompare,
  canAdd,
}: {
  room: Room;
  property: Property;
  selected: boolean;
  isInCompare: (id: string) => boolean;
  toggleCompare: (room: Room, property: Property) => void;
  canAdd: boolean;
}) {
  const navigate = useNavigate();
  const walk = walkMinutes(property.distanceToUniversity);
  const totalPrice = room.price + (room.utilities || 0);
  const comparing = isInCompare(room.id);
  const compareDisabled = !canAdd && !comparing;

  return (
    <article
      className={`bg-card rounded-xl border overflow-hidden transition-all ${
        selected ? 'border-primary shadow-md' : 'border-border hover:border-primary/50 hover:shadow-sm'
      }`}
    >
      <button
        type="button"
        onClick={() => navigate(`/room/${room.id}`)}
        className="w-full text-left"
      >
        <div className="flex gap-3 p-3">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              src={room.images[0] || property.images[0]}
              alt={room.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1.5">
              <h3 className="font-bold text-foreground line-clamp-1 flex-1">
                {room.title}
              </h3>
            </div>

            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {property.zone}, {property.city}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                {walk}min a pé
              </span>

              {room.size && (
                <span className="inline-flex items-center gap-1">
                  <Maximize className="w-3 h-3" />
                  {room.size}m²
                </span>
              )}

              {room.privateBathroom && (
                <span className="inline-flex items-center gap-1">
                  <Bath className="w-3 h-3" />
                  WC priv.
                </span>
              )}

              {property.amenities.wifi && (
                <span className="inline-flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  Wi-Fi
                </span>
              )}
            </div>

            <div className="mt-3 flex items-end justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-primary">€{room.price}</span>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>

              </div>

              <span className="text-xs font-semibold text-primary">
                Ver detalhes
              </span>
            </div>
          </div>
        </div>
      </button>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleCompare(room, property);
          }}
          disabled={compareDisabled}
          className={`w-full h-9 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
            comparing
              ? 'bg-primary/10 text-primary border-primary'
              : compareDisabled
                ? 'bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed'
                : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
          }`}
        >
          {comparing ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Na comparação
            </>
          ) : (
            <>
              <Columns className="w-3.5 h-3.5" />
              Comparar
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function GoogleMapsView({
  results,
  universityLabel,
  isInCompare,
  toggleCompare,
  canAdd,
}: {
  results: ResultItem[];
  universityLabel: string;
  isInCompare: (id: string) => boolean;
  toggleCompare: (room: Room, property: Property) => void;
  canAdd: boolean;
}) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const groups = useMemo(() => groupResults(results), [results]);
  const visibleCity = groups[0]?.property.city || 'Viseu';
  const selectedGroup = groups.find(group => group.property.id === selectedPropertyId) || null;

  const visibleResults = selectedPropertyId
    ? results.filter(item => item.property.id === selectedPropertyId)
    : results;

  const mapQuery = buildGoogleMapsQuery(selectedGroup, visibleCity, universityLabel);
  const mapEmbedUrl = buildGoogleMapsEmbedUrl(mapQuery);
  const mapOpenUrl = buildGoogleMapsOpenUrl(mapQuery);

  useEffect(() => {
    if (selectedPropertyId && !groups.some(group => group.property.id === selectedPropertyId)) {
      setSelectedPropertyId(null);
    }
  }, [groups, selectedPropertyId]);

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px] min-h-[640px] xl:h-[calc(100vh-230px)]">
        <div className="relative min-h-[520px] overflow-hidden bg-muted">
          <iframe
            key={mapEmbedUrl}
            title="Google Maps - alojamentos UniRoom"
            src={mapEmbedUrl}
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />

          <div className="absolute left-4 top-4 right-4 z-20 flex flex-wrap items-start justify-between gap-3 pointer-events-none">
            <div className="rounded-xl bg-white/95 backdrop-blur px-4 py-3 shadow-sm border border-white/70 pointer-events-auto">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                Google Maps
              </div>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {groups.length} {groups.length === 1 ? 'casa' : 'casas'} · {results.length} {results.length === 1 ? 'quarto' : 'quartos'} disponíveis
              </p>

              <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                {selectedGroup ? selectedGroup.property.title : universityLabel}
              </p>
            </div>

            <a
              href={mapOpenUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-white/95 backdrop-blur px-4 py-3 shadow-sm border border-white/70 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors pointer-events-auto"
            >
              Abrir no Google Maps
            </a>
          </div>

          {selectedGroup && (
            <div className="absolute left-4 bottom-4 right-4 z-20 pointer-events-none">
              <div className="max-w-md rounded-2xl bg-white/95 backdrop-blur border border-border shadow-xl p-4 pointer-events-auto">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground line-clamp-1">
                      {selectedGroup.property.title}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedGroup.property.address || selectedGroup.property.zone}, {selectedGroup.property.city}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      Desde €{selectedGroup.minPrice}/mês · {selectedGroup.rooms.length} {selectedGroup.rooms.length === 1 ? 'quarto disponível' : 'quartos disponíveis'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPropertyId(null)}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
                    aria-label="Limpar seleção"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="border-t xl:border-t-0 xl:border-l border-border bg-background/70 min-h-0 flex flex-col">
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-foreground">
                  {selectedGroup ? selectedGroup.property.zone : 'Alojamentos encontrados'}
                </h3>

                <p className="text-sm text-muted-foreground mt-0.5">
                  {visibleResults.length} {visibleResults.length === 1 ? 'quarto visível' : 'quartos visíveis'}
                </p>
              </div>

              {selectedGroup && (
                <button
                  type="button"
                  onClick={() => setSelectedPropertyId(null)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Ver todos
                </button>
              )}
            </div>
          </div>

          <div className="p-4 border-b border-border bg-card/60">
            <div className="space-y-2">
              {groups.map(group => {
                const selected = group.property.id === selectedPropertyId;
                const walk = walkMinutes(group.property.distanceToUniversity);

                return (
                  <button
                    key={group.property.id}
                    type="button"
                    onClick={() => setSelectedPropertyId(selected ? null : group.property.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        selected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                      }`}>
                        <Home className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground line-clamp-1">
                          {group.property.title}
                        </p>

                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {group.property.zone}, {group.property.city}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            {walk}min a pé
                          </span>

                          <span>desde €{group.minPrice}/mês</span>
                          <span>{group.rooms.length} {group.rooms.length === 1 ? 'quarto' : 'quartos'}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto xl:max-h-full">
            {visibleResults.map(({ room, property }) => (
              <MapRoomCard
                key={room.id}
                room={room}
                property={property}
                selected={property.id === selectedPropertyId}
                isInCompare={isInCompare}
                toggleCompare={toggleCompare}
                canAdd={canAdd}
              />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function FilterSidebar({
  filters,
  set,
  activeFilterCount,
}: {
  filters: SearchFilters;
  set: (updates: Partial<SearchFilters>) => void;
  activeFilterCount: number;
}) {
  const toggleCity = (city: string) => {
    set({
      cities: filters.cities.includes(city)
        ? filters.cities.filter(item => item !== city)
        : [...filters.cities, city],
    });
  };

  const toggleRoomType = (roomType: SearchFilters['roomTypes'][number]) => {
    set({
      roomTypes: filters.roomTypes.includes(roomType)
        ? filters.roomTypes.filter(item => item !== roomType)
        : [...filters.roomTypes, roomType],
    });
  };

  return (
    <aside className="w-full lg:w-80 flex-shrink-0">
      <Card className="p-5 sticky top-[145px]">
        <div className="flex items-center gap-2 mb-5">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">Filtros</h2>
          {activeFilterCount > 0 && (
            <span className="ml-auto text-xs bg-primary text-white rounded-full px-2 py-0.5">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Localização
            </p>
            <div className="space-y-2">
              {CITIES.slice(0, 6).map(city => (
                <Checkbox
                  key={city}
                  label={city}
                  checked={filters.cities.includes(city)}
                  onCheckedChange={() => toggleCity(city)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Preço
            </p>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[250, 300, 400].map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set({ maxPrice: filters.maxPrice === value ? 600 : value })}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    filters.maxPrice === value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  €{value}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>€{filters.minPrice}</span>
              <span className="font-semibold text-primary">€{filters.minPrice} - €{filters.maxPrice}</span>
              <span>€600</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Tipo de quarto
            </p>
            <div className="space-y-2">
              {ROOM_TYPES.map(type => (
                <Checkbox
                  key={type.value}
                  label={type.label}
                  checked={filters.roomTypes.includes(type.value)}
                  onCheckedChange={() => toggleRoomType(type.value)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Características
            </p>
            <div className="space-y-2">
              <Checkbox label="Despesas dentro do limite" checked={filters.includeUtilitiesInPrice} onCheckedChange={() => set({ includeUtilitiesInPrice: !filters.includeUtilitiesInPrice })} />
              <Checkbox label="WC privativo" checked={filters.privateBathroom} onCheckedChange={() => set({ privateBathroom: !filters.privateBathroom })} />
              <Checkbox label="Wi-Fi" checked={filters.wifi} onCheckedChange={() => set({ wifi: !filters.wifi })} />
              <Checkbox label="Lavandaria" checked={filters.laundry} onCheckedChange={() => set({ laundry: !filters.laundry })} />
              <Checkbox label="Cozinha" checked={filters.kitchen} onCheckedChange={() => set({ kitchen: !filters.kitchen })} />
              <Checkbox label="Sem festas" checked={filters.noParties} onCheckedChange={() => set({ noParties: !filters.noParties })} />
              <Checkbox label="Horário de silêncio" checked={filters.quietHours} onCheckedChange={() => set({ quietHours: !filters.quietHours })} />
              <Checkbox label="Perto de supermercado" checked={filters.nearSupermarket} onCheckedChange={() => set({ nearSupermarket: !filters.nearSupermarket })} />
              <Checkbox label="Perto de autocarro" checked={filters.nearBusStop} onCheckedChange={() => set({ nearBusStop: !filters.nearBusStop })} />
            </div>
          </div>
        </div>
      </Card>
    </aside>
  );
}

export function SearchRooms() {
  const { rooms, properties, refreshProperties } = useProperties();
  const { isInCompare, toggleCompare, canAdd } = useCompare();
  const { statusMap: verificationStatusMap } = useAllVerificationStatuses();
  const { user } = useAuth();
  const { profile: studentProfile, loading: profileLoading } = useStudentProfile(
    (user?.type === 'student' || user?.type === 'landlord') ? user?.id : undefined,
  );

  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  const canShowCompatibility = Boolean(
    user &&
    (user.type === 'student' || user.type === 'landlord') &&
    user.onboardingCompleted &&
    (user.profileCompleteness?.overall ?? 0) >= 80,
  );

  const set = (updates: Partial<SearchFilters>) =>
    setFilters(current => ({ ...current, ...updates }));

  const universityLabel = UNIVERSITIES.find(university => university.value === filters.university)?.label ?? filters.university;

  useEffect(() => {
    void refreshProperties();
  }, [refreshProperties, user?.id, user?.type]);

  useEffect(() => {
    if (canShowCompatibility) return;

    setFilters(current => {
      if (current.sortBy !== 'compatibility' && current.minCompatibility === 0) return current;

      return {
        ...current,
        sortBy: current.sortBy === 'compatibility' ? 'distance' : current.sortBy,
        minCompatibility: 0,
      };
    });
  }, [canShowCompatibility]);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      const activeProperties = properties.filter(property => property.status === 'active' && !property.adminSuspended);
      const propertiesMap = new Map(activeProperties.map(property => [property.id, property]));
      const activePropertyIds = activeProperties.map(property => property.id);

      let filtered = rooms.filter(room => room.status === 'available' && activePropertyIds.includes(room.propertyId));

      if (filters.query.trim()) {
        const query = filters.query.toLowerCase();

        filtered = filtered.filter(room => {
          const property = propertiesMap.get(room.propertyId);

          return (
            room.title.toLowerCase().includes(query) ||
            room.description.toLowerCase().includes(query) ||
            property?.title.toLowerCase().includes(query) ||
            property?.description.toLowerCase().includes(query) ||
            property?.address.toLowerCase().includes(query) ||
            property?.zone.toLowerCase().includes(query) ||
            property?.city.toLowerCase().includes(query)
          );
        });
      }

      if (filters.cities.length > 0) {
        filtered = filtered.filter(room => {
          const property = propertiesMap.get(room.propertyId);
          return property && filters.cities.includes(property.city);
        });
      }

      filtered = filtered.filter(room => {
        const effectivePrice = filters.includeUtilitiesInPrice
          ? room.price + (room.utilities || 0)
          : room.price;

        return effectivePrice >= filters.minPrice && effectivePrice <= filters.maxPrice;
      });

      if (filters.roomTypes.length > 0) {
        filtered = filtered.filter(room => filters.roomTypes.includes(room.roomType));
      }

      if (filters.maxWalkMinutes < 60) {
        const maxKm = filters.maxWalkMinutes / 13;

        filtered = filtered.filter(room => {
          const property = propertiesMap.get(room.propertyId);
          return property && property.distanceToUniversity <= maxKm;
        });
      }

      if (canShowCompatibility && filters.minCompatibility > 0) {
        filtered = filtered.filter(room => (room.compatibilityScore || 0) >= filters.minCompatibility);
      }

      if (filters.entryMonth) {
        const [year, month] = filters.entryMonth.split('-').map(Number);
        const entryDate = new Date(year, month - 1, 1);

        filtered = filtered.filter(room => new Date(room.availableFrom) <= entryDate);
      }

      if (filters.privateBathroom) {
        filtered = filtered.filter(room => room.privateBathroom);
      }

      filtered = filtered.filter(room => {
        const property = propertiesMap.get(room.propertyId);

        if (!property) return false;
        if (filters.verifiedListing && !property.verified) return false;
        if (filters.verifiedLandlord && !(verificationStatusMap[property.landlordId]?.level === 'gold' || verificationStatusMap[property.landlordId]?.level === 'silver')) return false;
        if (filters.wifi && !property.amenities.wifi) return false;
        if (filters.laundry && !property.amenities.laundry) return false;
        if (filters.kitchen && !property.amenities.kitchen) return false;
        if (filters.noParties && property.houseRules?.parties !== false) return false;
        if (filters.quietHours && !property.houseRules?.quietHours) return false;
        if (filters.nearSupermarket && !isNearSupermarket(property)) return false;
        if (filters.nearBusStop && !isNearBusStop(property)) return false;

        return true;
      });

      const pairs = filtered
        .map(room => {
          const property = propertiesMap.get(room.propertyId);

          if (!property) return null;

          return {
            room,
            property,
            availableRooms: rooms.filter(item => item.propertyId === property.id && item.status === 'available').length,
          };
        })
        .filter((item): item is ResultItem => item !== null);

      pairs.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price_asc':
            return a.room.price - b.room.price;
          case 'price_desc':
            return b.room.price - a.room.price;
          case 'distance':
            return a.property.distanceToUniversity - b.property.distanceToUniversity;
          case 'recent':
            return new Date(b.room.createdAt).getTime() - new Date(a.room.createdAt).getTime();
          default:
            return canShowCompatibility
              ? (b.room.compatibilityScore || 0) - (a.room.compatibilityScore || 0)
              : a.property.distanceToUniversity - b.property.distanceToUniversity;
        }
      });

      setResults(pairs);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [rooms, properties, filters, canShowCompatibility, verificationStatusMap]);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.query.trim()) count++;
    if (filters.cities.length > 0) count++;
    if (filters.roomTypes.length > 0) count++;
    if (filters.minPrice > 150 || filters.maxPrice < 600) count++;
    if (filters.maxWalkMinutes < 60) count++;
    if (canShowCompatibility && filters.minCompatibility > 0) count++;
    if (filters.entryMonth) count++;
    if (filters.verifiedListing) count++;
    if (filters.verifiedLandlord) count++;
    if (filters.privateBathroom) count++;
    if (filters.wifi) count++;
    if (filters.laundry) count++;
    if (filters.kitchen) count++;
    if (filters.noParties) count++;
    if (filters.quietHours) count++;
    if (filters.nearSupermarket) count++;
    if (filters.nearBusStop) count++;
    if (filters.includeUtilitiesInPrice) count++;

    return count;
  }, [filters, canShowCompatibility]);

  const resultStats = useMemo(() => {
    const propertyCount = new Set(results.map(item => item.property.id)).size;
    const prices = results.map(item => (
      filters.includeUtilitiesInPrice
        ? item.room.price + (item.room.utilities || 0)
        : item.room.price
    ));

    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const closestWalk = results.length > 0
      ? Math.min(...results.map(item => walkMinutes(item.property.distanceToUniversity)))
      : 0;
    const verifiedCount = results.filter(item => item.property.verified || verificationStatusMap[item.property.landlordId]?.level === 'gold' || verificationStatusMap[item.property.landlordId]?.level === 'silver').length;

    return {
      propertyCount,
      minPrice,
      closestWalk,
      verifiedCount,
    };
  }, [results, filters.includeUtilitiesInPrice, verificationStatusMap]);

  const handleClearFilters = () => setFilters(DEFAULT_FILTERS);
  const sortLabel = getSortLabel(filters.sortBy, canShowCompatibility);
  const showSidebar = showFilters && viewMode !== 'map';

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-[65px] z-30 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-[180px] relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />

              <input
                type="text"
                placeholder="Zona, título, morada ou cidade..."
                value={filters.query}
                onChange={event => set({ query: event.target.value })}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />

              {filters.query && (
                <button
                  type="button"
                  onClick={() => set({ query: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative">
              <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />

              <select
                value={filters.university}
                onChange={event => set({ university: event.target.value })}
                className="pl-9 pr-7 py-2.5 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                {UNIVERSITIES.map(university => (
                  <option key={university.value} value={university.value}>
                    {university.label}
                  </option>
                ))}
              </select>

              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1 hidden sm:block whitespace-nowrap">
                Até:
              </span>

              {[250, 300, 400].map(max => (
                <button
                  key={max}
                  type="button"
                  onClick={() => set({ maxPrice: filters.maxPrice === max ? 600 : max })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    filters.maxPrice === max
                      ? 'bg-primary text-white border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  €{max}
                </button>
              ))}
            </div>

            <div className="relative">
              <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />

              <select
                value={filters.entryMonth}
                onChange={event => set({ entryMonth: event.target.value })}
                className="pl-9 pr-7 py-2.5 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="">Qualquer data</option>

                {ENTRY_MONTHS.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                activeFilterCount > 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/50 text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:block">Filtros</span>

              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {loading ? 'A procurar...' : `${results.length} ${results.length === 1 ? 'quarto encontrado' : 'quartos encontrados'}`}
            </h1>

            <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5">
              <span>Perto de {universityLabel}</span>
              {resultStats.propertyCount > 0 && (
                <>
                  <span>·</span>
                  <span>{resultStats.propertyCount} {resultStats.propertyCount === 1 ? 'casa' : 'casas'}</span>
                </>
              )}
              {resultStats.minPrice > 0 && (
                <>
                  <span>·</span>
                  <span>desde €{resultStats.minPrice}</span>
                </>
              )}
              {resultStats.closestWalk > 0 && (
                <>
                  <span>·</span>
                  <span>{resultStats.closestWalk}min a pé</span>
                </>
              )}
              {resultStats.verifiedCount > 0 && (
                <>
                  <span>·</span>
                  <span>{resultStats.verifiedCount} verificados</span>
                </>
              )}
              <span>·</span>
              <span>ordenado por {sortLabel}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border">
            {([
              { value: 'grid', icon: Grid, label: 'Grelha' },
              { value: 'list', icon: List, label: 'Lista' },
              { value: 'map', icon: MapIcon, label: 'Mapa' },
            ] as const).map(option => {
              const Icon = option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setViewMode(option.value)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    viewMode === option.value
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label={option.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              Limpar filtros
            </button>

            {filters.query.trim() && (
              <button type="button" onClick={() => set({ query: '' })} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                Pesquisa: {filters.query} ×
              </button>
            )}

            {filters.cities.map(city => (
              <button key={city} type="button" onClick={() => set({ cities: filters.cities.filter(item => item !== city) })} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {city} ×
              </button>
            ))}

            {(filters.minPrice > 150 || filters.maxPrice < 600) && (
              <button type="button" onClick={() => set({ minPrice: 150, maxPrice: 600 })} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                €{filters.minPrice} - €{filters.maxPrice} ×
              </button>
            )}
          </div>
        )}

        {viewMode === 'map' ? (
          results.length > 0 ? (
            <GoogleMapsView
              results={results}
              universityLabel={universityLabel}
              isInCompare={isInCompare}
              toggleCompare={toggleCompare}
              canAdd={canAdd}
            />
          ) : (
            <EmptyState
              filters={filters}
              onClear={handleClearFilters}
              onUpdate={set}
              canShowCompatibility={canShowCompatibility}
            />
          )
        ) : (
          <div className="flex gap-6">
            {showSidebar && (
              <FilterSidebar
                filters={filters}
                set={set}
                activeFilterCount={activeFilterCount}
              />
            )}

            <main className="flex-1 min-w-0">
              {results.length === 0 ? (
                <EmptyState
                  filters={filters}
                  onClear={handleClearFilters}
                  onUpdate={set}
                  canShowCompatibility={canShowCompatibility}
                />
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
                      : 'space-y-4'
                  }
                >
                  {results.map(({ room, property, availableRooms }) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      property={property}
                      studentProfile={canShowCompatibility ? (profileLoading ? null : studentProfile) : undefined}
                      variant="public"
                      displayMode={viewMode === 'list' ? 'list' : 'grid'}
                      showFavorite
                      showPropertyContext
                      availableRooms={availableRooms}
                      compareProps={{
                        isComparing: isInCompare(room.id),
                        disabled: !canAdd && !isInCompare(room.id),
                        onToggle: event => {
                          event.stopPropagation();
                          toggleCompare(room, property);
                        },
                      }}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

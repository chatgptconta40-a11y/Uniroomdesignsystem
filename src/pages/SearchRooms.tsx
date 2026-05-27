import { useState, useEffect, useMemo } from 'react';
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
  ShieldCheck,
  ArrowRight,
  Home,
  Bath,
  Maximize,
  Wifi,
  Columns,
  Check,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { RoomCard } from '../components/RoomCard';
import { Button } from '../components/Button';
import { RangeSlider } from '../components/RangeSlider';
import { Checkbox } from '../components/Checkbox';
import { Card } from '../components/Card';
import { useProperties } from '../context/PropertiesContext';
import { useCompare } from '../context/CompareContext';
import { useAuth } from '../context/AuthContext';
import { getVerificationStatus } from '../data/mockTrust';
import { hasCompletedCompatibilityProfile } from '../data/mockProfiles';
import { Room, Property } from '../types/property';

const walkMinutes = (km: number) => Math.round(km * 13);

const isNearSupermarket = (property: Property) =>
  property.zone.toLowerCase().includes('centro') || property.distanceToUniversity <= 0.5;

const isNearBusStop = (property: Property) => property.distanceToUniversity <= 1.5;

const hasVerifiedLandlord = (property: Property) => {
  const verification = getVerificationStatus(property.landlordId);
  return verification?.level === 'gold' || verification?.level === 'silver';
};

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

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
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
  { value: 'UC', label: 'Universidade de Coimbra' },
  { value: 'UP', label: 'Universidade do Porto' },
  { value: 'UL', label: 'Universidade de Lisboa' },
  { value: 'UMinho', label: 'Universidade do Minho' },
];

const CITIES = ['Viseu', 'Lisboa', 'Porto', 'Coimbra', 'Braga'];

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

const CITY_BOUNDS: Record<string, MapBounds> = {
  Viseu: { minLat: 40.60, maxLat: 40.70, minLng: -7.98, maxLng: -7.86 },
  Lisboa: { minLat: 38.68, maxLat: 38.78, minLng: -9.22, maxLng: -9.08 },
  Porto: { minLat: 41.12, maxLat: 41.20, minLng: -8.68, maxLng: -8.56 },
  Coimbra: { minLat: 40.17, maxLat: 40.24, minLng: -8.48, maxLng: -8.36 },
  Braga: { minLat: 41.52, maxLat: 41.60, minLng: -8.48, maxLng: -8.36 },
};

const UNIVERSITY_MARKERS: Record<string, { label: string; x: number; y: number }> = {
  ESTGV: { label: 'ESTGV', x: 50, y: 52 },
  UC: { label: 'UC', x: 50, y: 52 },
  UP: { label: 'UP', x: 50, y: 52 },
  UL: { label: 'UL', x: 50, y: 52 },
  UMinho: { label: 'UM', x: 50, y: 52 },
};

function getBounds(city?: string): MapBounds {
  return CITY_BOUNDS[city || 'Viseu'] || CITY_BOUNDS.Viseu;
}

function stableCoordinate(property: Property, bounds: MapBounds) {
  let hash = 0;
  const seed = `${property.id}-${property.city}-${property.zone}`;

  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }

  const first = ((hash >>> 0) % 1000) / 1000;
  const second = ((hash >>> 16) % 1000) / 1000;

  return {
    lat: bounds.minLat + first * (bounds.maxLat - bounds.minLat),
    lng: bounds.minLng + second * (bounds.maxLng - bounds.minLng),
  };
}

function coordinateToPercent(lat: number, lng: number, bounds: MapBounds) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;

  return {
    x: Math.max(8, Math.min(92, x)),
    y: Math.max(10, Math.min(88, y)),
  };
}

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
      item.room.compatibilityScore || 0
    );

    return acc;
  }, {});

  return Object.values(grouped);
}

function getSortLabel(sortBy: SearchFilters['sortBy'], canShowCompatibility: boolean) {
  if (sortBy === 'compatibility' && canShowCompatibility) return 'compatibilidade';
  if (sortBy === 'price_asc') return 'preço mais baixo';
  if (sortBy === 'price_desc') return 'preço mais alto';
  if (sortBy === 'distance') return 'proximidade à universidade';
  if (sortBy === 'recent') return 'mais recentes';
  return 'proximidade à universidade';
}

function getRoomTypeLabels(types: SearchFilters['roomTypes']) {
  return types
    .map(type => ROOM_TYPES.find(option => option.value === type)?.label)
    .filter(Boolean)
    .join(', ');
}

function getEntryMonthLabel(value: string) {
  return ENTRY_MONTHS.find(month => month.value === value)?.label ?? value;
}

interface EmptyStateProps {
  filters: SearchFilters;
  onClear: () => void;
  onUpdate: (updates: Partial<SearchFilters>) => void;
  canShowCompatibility: boolean;
}

function EmptyState({ filters, onClear, onUpdate, canShowCompatibility }: EmptyStateProps) {
  const suggestions: { text: string; action: () => void }[] = [];

  if (filters.maxPrice < 400) {
    suggestions.push({ text: 'Aumenta o limite de preço para €400', action: () => onUpdate({ maxPrice: 400 }) });
  }

  if (filters.maxWalkMinutes < 30) {
    suggestions.push({
      text: `Aumenta para 30 min a pé, agora está até ${filters.maxWalkMinutes}min`,
      action: () => onUpdate({ maxWalkMinutes: 30 }),
    });
  }

  if (filters.entryMonth) {
    suggestions.push({ text: 'Remove o filtro de data de entrada', action: () => onUpdate({ entryMonth: '' }) });
  }

  if (filters.verifiedListing) {
    suggestions.push({ text: 'Remove o filtro de anúncio verificado', action: () => onUpdate({ verifiedListing: false }) });
  }

  if (canShowCompatibility && filters.minCompatibility > 0) {
    suggestions.push({ text: 'Remove o mínimo de compatibilidade', action: () => onUpdate({ minCompatibility: 0 }) });
  }

  if (filters.roomTypes.length > 0) {
    suggestions.push({ text: 'Alarga os tipos de quarto aceites', action: () => onUpdate({ roomTypes: [] }) });
  }

  if (filters.cities.length > 0) {
    suggestions.push({ text: 'Remove o filtro de cidade', action: () => onUpdate({ cities: [] }) });
  }

  return (
    <Card className="p-10 text-center max-w-lg mx-auto">
      <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <SearchIcon className="w-7 h-7 text-muted-foreground" />
      </div>

      <h3 className="font-bold mb-2 text-foreground">Nenhum quarto encontrado</h3>

      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        Os filtros atuais são demasiado restritivos para os anúncios disponíveis. Tenta uma destas sugestões:
      </p>

      {suggestions.length > 0 && (
        <div className="space-y-2 mb-6 text-left">
          {suggestions.slice(0, 4).map((suggestion, index) => (
            <button
              key={index}
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

interface MapRoomCardProps {
  room: Room;
  property: Property;
  selected: boolean;
  isInCompare: (id: string) => boolean;
  toggleCompare: (room: Room, property: Property) => void;
  canAdd: boolean;
  canShowCompatibility: boolean;
}

function MapRoomCard({ room, property, selected, isInCompare, toggleCompare, canAdd, canShowCompatibility }: MapRoomCardProps) {
  const navigate = useNavigate();
  const walk = walkMinutes(property.distanceToUniversity);
  const totalPrice = room.price + (room.utilities || 0);
  const comparing = isInCompare(room.id);
  const compareDisabled = !canAdd && !comparing;

  return (
    <article
      className={`bg-card rounded-xl border overflow-hidden transition-all ${
        selected ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'
      }`}
    >
      <button
        type="button"
        onClick={() => navigate(`/room/${room.id}`)}
        className="w-full text-left"
      >
        <div className="flex gap-3 p-3">
          <div className="relative w-28 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              src={room.images[0] || property.images[0]}
              alt={room.title}
              className="w-full h-full object-cover"
            />

            {canShowCompatibility && room.compatibilityScore && (
              <span className="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded-full bg-white/95 text-[10px] font-bold text-primary shadow-sm">
                {room.compatibilityScore}%
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground line-clamp-2">
                {room.title}
              </h3>

              {property.verified && (
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
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

                {room.utilities && room.utilities > 0 ? (
                  <p className="text-[10px] text-muted-foreground">
                    +€{room.utilities} desp. · €{totalPrice} total
                  </p>
                ) : (
                  <p className="text-[10px] text-green-600">Despesas incluídas</p>
                )}
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

interface GeneralMapViewProps {
  results: ResultItem[];
  university: string;
  universityLabel: string;
  isInCompare: (id: string) => boolean;
  toggleCompare: (room: Room, property: Property) => void;
  canAdd: boolean;
  canShowCompatibility: boolean;
}

function GeneralMapView({
  results,
  university,
  universityLabel,
  isInCompare,
  toggleCompare,
  canAdd,
  canShowCompatibility,
}: GeneralMapViewProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const groups = useMemo(() => groupResults(results), [results]);
  const visibleCity = groups[0]?.property.city || 'Viseu';
  const bounds = getBounds(visibleCity);
  const universityMarker = UNIVERSITY_MARKERS[university] || UNIVERSITY_MARKERS.ESTGV;
  const selectedGroup = groups.find(group => group.property.id === selectedPropertyId) || null;

  const visibleResults = selectedPropertyId
    ? results.filter(item => item.property.id === selectedPropertyId)
    : results;

  useEffect(() => {
    if (selectedPropertyId && !groups.some(group => group.property.id === selectedPropertyId)) {
      setSelectedPropertyId(null);
    }
  }, [groups, selectedPropertyId]);

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px] min-h-[640px] xl:h-[calc(100vh-230px)]">
        <div className="relative min-h-[520px] overflow-hidden bg-[#e8edf3]">
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage: `
                linear-gradient(rgba(120, 144, 156, 0.22) 1px, transparent 1px),
                linear-gradient(90deg, rgba(120, 144, 156, 0.22) 1px, transparent 1px)
              `,
              backgroundSize: '72px 72px',
            }}
          />

          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 700">
            <path d="M-60 390 C160 350 260 375 430 330 C610 280 740 315 1060 250" fill="none" stroke="#ffffff" strokeWidth="30" opacity="0.9" />
            <path d="M-60 390 C160 350 260 375 430 330 C610 280 740 315 1060 250" fill="none" stroke="#c6d0dc" strokeWidth="8" opacity="0.9" />

            <path d="M230 -40 C270 120 285 270 320 390 C355 520 390 610 430 740" fill="none" stroke="#ffffff" strokeWidth="24" opacity="0.85" />
            <path d="M230 -40 C270 120 285 270 320 390 C355 520 390 610 430 740" fill="none" stroke="#c6d0dc" strokeWidth="6" opacity="0.9" />

            <path d="M720 -30 C650 120 660 260 720 390 C775 505 850 605 925 735" fill="none" stroke="#ffffff" strokeWidth="20" opacity="0.75" />
            <path d="M720 -30 C650 120 660 260 720 390 C775 505 850 605 925 735" fill="none" stroke="#cbd5df" strokeWidth="5" opacity="0.9" />

            <path d="M-40 570 C180 535 350 560 530 520 C720 478 880 500 1050 450" fill="none" stroke="#ffffff" strokeWidth="18" opacity="0.7" />
            <path d="M-40 570 C180 535 350 560 530 520 C720 478 880 500 1050 450" fill="none" stroke="#d0d8e2" strokeWidth="4" opacity="0.9" />

            <ellipse cx="790" cy="135" rx="95" ry="58" fill="#b7d7b1" opacity="0.55" />
            <ellipse cx="170" cy="575" rx="105" ry="52" fill="#b7d7b1" opacity="0.45" />
            <ellipse cx="860" cy="540" rx="80" ry="44" fill="#a8d5e5" opacity="0.35" />
            <rect x="92" y="115" width="125" height="80" rx="8" fill="#d7ddd3" opacity="0.65" />
            <rect x="520" y="130" width="130" height="95" rx="8" fill="#d7ddd3" opacity="0.5" />
            <rect x="430" y="460" width="150" height="85" rx="8" fill="#d7ddd3" opacity="0.5" />
          </svg>

          <div className="absolute left-4 top-4 right-4 z-20 flex flex-wrap items-start justify-between gap-3">
            <div className="rounded-xl bg-white/95 backdrop-blur px-4 py-3 shadow-sm border border-white/70">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                Mapa de alojamentos
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {groups.length} {groups.length === 1 ? 'casa' : 'casas'} · {results.length} {results.length === 1 ? 'quarto' : 'quartos'} disponíveis
              </p>
            </div>

            {selectedGroup && (
              <button
                type="button"
                onClick={() => setSelectedPropertyId(null)}
                className="rounded-xl bg-white/95 backdrop-blur px-3 py-2 shadow-sm border border-white/70 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
              >
                <X className="w-3.5 h-3.5" />
                Ver todas as casas
              </button>
            )}
          </div>

          <div
            className="absolute z-10"
            style={{
              left: `${universityMarker.x}%`,
              top: `${universityMarker.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative flex flex-col items-center">
              <div className="absolute w-28 h-28 rounded-full bg-primary/10 border border-primary/20" />
              <div className="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center font-bold border-4 border-white">
                {universityMarker.label}
              </div>
              <div className="mt-2 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-foreground shadow-sm whitespace-nowrap">
                {universityLabel}
              </div>
            </div>
          </div>

          {groups.map(group => {
            const coordinates = group.property.coordinates || stableCoordinate(group.property, bounds);
            const position = coordinateToPercent(coordinates.lat, coordinates.lng, bounds);
            const selected = group.property.id === selectedPropertyId;
            const walk = walkMinutes(group.property.distanceToUniversity);

            return (
              <button
                key={group.property.id}
                type="button"
                onClick={() => setSelectedPropertyId(selected ? null : group.property.id)}
                className={`absolute z-20 transition-all ${selected ? 'scale-110' : 'hover:scale-105'}`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div
                  className={`relative px-3 py-2 rounded-full shadow-lg border text-sm font-bold whitespace-nowrap ${
                    selected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-foreground border-white hover:border-primary hover:text-primary'
                  }`}
                >
                  €{group.minPrice}+
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                      selected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {group.rooms.length}
                  </span>
                </div>

                <div className={`mx-auto w-3 h-3 rotate-45 -mt-1 ${selected ? 'bg-primary' : 'bg-white border-r border-b border-white'}`} />

                {selected && (
                  <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-xl bg-white shadow-xl border border-border w-56 p-3 text-left">
                    <p className="text-xs font-bold text-foreground line-clamp-1">{group.property.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {group.property.zone}, {group.property.city}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {walk}min a pé · {group.property.distanceToUniversity}km da universidade
                    </p>
                  </div>
                )}
              </button>
            );
          })}

          <div className="absolute left-4 bottom-4 z-20 rounded-xl bg-white/95 backdrop-blur px-3 py-2 shadow-sm border border-white/70">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-block w-16 h-1 rounded-full bg-foreground/50" />
              1 km
            </div>
          </div>

          <div className="absolute right-4 bottom-4 z-20 rounded-xl bg-white/95 backdrop-blur px-3 py-2 shadow-sm border border-white/70 text-[11px] text-muted-foreground">
            Localização aproximada
          </div>
        </div>

        <aside className="border-t xl:border-t-0 xl:border-l border-border bg-background/70 min-h-0 flex flex-col">
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-foreground">
                  {selectedGroup ? selectedGroup.property.zone : 'Casas no mapa'}
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
                  Limpar
                </button>
              )}
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
                canShowCompatibility={canShowCompatibility}
              />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function SearchRooms() {
  const { rooms, properties } = useProperties();
  const { isInCompare, toggleCompare, canAdd } = useCompare();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  const canShowCompatibility = Boolean(
    user?.type === 'student' &&
    hasCompletedCompatibilityProfile(user.id)
  );
  const shouldShowProfileNotice = false;

  const set = (updates: Partial<SearchFilters>) => setFilters(current => ({ ...current, ...updates }));

  useEffect(() => {
    if (canShowCompatibility) return;

    setFilters(current => {
      if (current.sortBy !== 'compatibility' && current.minCompatibility === 0) {
        return current;
      }

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
            property?.title.toLowerCase().includes(query) ||
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
        const effectivePrice = filters.includeUtilitiesInPrice ? room.price + (room.utilities || 0) : room.price;
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
        if (filters.verifiedLandlord && !hasVerifiedLandlord(property)) return false;
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
    }, 300);

    return () => clearTimeout(timer);
  }, [rooms, properties, filters, canShowCompatibility]);

  const activeFilterCount = useMemo(() => {
    let count = 0;

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

  const handleClearFilters = () => setFilters(DEFAULT_FILTERS);
  const universityLabel = UNIVERSITIES.find(university => university.value === filters.university)?.label ?? filters.university;
  const showSidebar = showFilters && viewMode !== 'map';
  const sortLabel = getSortLabel(filters.sortBy, canShowCompatibility);

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
    const verifiedCount = results.filter(item => item.property.verified || hasVerifiedLandlord(item.property)).length;

    return {
      propertyCount,
      minPrice,
      closestWalk,
      verifiedCount,
    };
  }, [results, filters.includeUtilitiesInPrice]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: Partial<SearchFilters> }[] = [];

    if (filters.cities.length > 0) {
      chips.push({ key: 'cities', label: filters.cities.join(', '), clear: { cities: [] } });
    }
    if (filters.roomTypes.length > 0) {
      chips.push({ key: 'roomTypes', label: getRoomTypeLabels(filters.roomTypes), clear: { roomTypes: [] } });
    }
    if (filters.minPrice > 150 || filters.maxPrice < 600) {
      chips.push({ key: 'price', label: `€${filters.minPrice} - €${filters.maxPrice}`, clear: { minPrice: 150, maxPrice: 600 } });
    }
    if (filters.includeUtilitiesInPrice) {
      chips.push({ key: 'utilities', label: 'Despesas incluídas no limite', clear: { includeUtilitiesInPrice: false } });
    }
    if (filters.maxWalkMinutes < 60) {
      chips.push({ key: 'walk', label: `Até ${filters.maxWalkMinutes}min a pé`, clear: { maxWalkMinutes: 60 } });
    }
    if (filters.entryMonth) {
      chips.push({ key: 'entry', label: getEntryMonthLabel(filters.entryMonth), clear: { entryMonth: '' } });
    }
    if (filters.verifiedListing) {
      chips.push({ key: 'verifiedListing', label: 'Anúncio verificado', clear: { verifiedListing: false } });
    }
    if (filters.verifiedLandlord) {
      chips.push({ key: 'verifiedLandlord', label: 'Senhorio verificado', clear: { verifiedLandlord: false } });
    }
    if (filters.privateBathroom) {
      chips.push({ key: 'privateBathroom', label: 'WC privativo', clear: { privateBathroom: false } });
    }
    if (filters.wifi) {
      chips.push({ key: 'wifi', label: 'Wi-Fi', clear: { wifi: false } });
    }
    if (filters.laundry) {
      chips.push({ key: 'laundry', label: 'Máquina de lavar', clear: { laundry: false } });
    }
    if (filters.kitchen) {
      chips.push({ key: 'kitchen', label: 'Cozinha equipada', clear: { kitchen: false } });
    }
    if (filters.noParties) {
      chips.push({ key: 'noParties', label: 'Sem festas', clear: { noParties: false } });
    }
    if (filters.quietHours) {
      chips.push({ key: 'quietHours', label: 'Horário de silêncio', clear: { quietHours: false } });
    }
    if (filters.nearSupermarket) {
      chips.push({ key: 'nearSupermarket', label: 'Perto de supermercado', clear: { nearSupermarket: false } });
    }
    if (filters.nearBusStop) {
      chips.push({ key: 'nearBusStop', label: 'Perto de autocarro', clear: { nearBusStop: false } });
    }
    if (canShowCompatibility && filters.minCompatibility > 0) {
      chips.push({ key: 'compatibility', label: `Compatibilidade ≥ ${filters.minCompatibility}%`, clear: { minCompatibility: 0 } });
    }

    return chips;
  }, [filters, canShowCompatibility]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-[65px] z-30 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-[180px] relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />

              <input
                type="text"
                placeholder="Zona, título ou cidade..."
                value={filters.query}
                onChange={event => set({ query: event.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
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

              {[
                { max: 250, label: '€250' },
                { max: 300, label: '€300' },
                { max: 400, label: '€400' },
              ].map(({ max, label }) => (
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
                  {label}
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
        {shouldShowProfileNotice && (
          <Card className="p-4 mb-5 border-blue-100 bg-blue-50/70">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-sm font-bold text-foreground">
                      Completa o perfil para ver compatibilidade personalizada
                    </h2>
                    <UserCheck className="w-4 h-4 text-primary" />
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Por agora, os resultados estão ordenados por distância, preço e confiança.
                    Depois do onboarding, desbloqueias percentagens de compatibilidade e filtros
                    mais úteis para convivência.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full lg:w-auto"
                onClick={() => navigate('/onboarding')}
              >
                Completar perfil
              </Button>
            </div>
          </Card>
        )}

        {!loading && results.length > 0 && (
          <Card className="p-4 md:p-5 mb-5 border-border/80 bg-card">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Ordenado por {sortLabel}
                  </span>

                  {activeFilterCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''} ativo{activeFilterCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-bold text-foreground">
                  {results.length} quarto{results.length !== 1 ? 's' : ''} em {resultStats.propertyCount} casa{resultStats.propertyCount !== 1 ? 's' : ''}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Pesquisa perto da {universityLabel}
                  {filters.cities.length > 0 ? ` em ${filters.cities.join(', ')}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Desde</p>
                  <p className="text-sm font-bold text-foreground">€{resultStats.minPrice}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Mais perto</p>
                  <p className="text-sm font-bold text-foreground">{resultStats.closestWalk}min</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Confiança</p>
                  <p className="text-sm font-bold text-foreground">{resultStats.verifiedCount} verif.</p>
                </div>
              </div>
            </div>

            {activeFilterChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                {activeFilterChips.map(chip => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => set(chip.clear)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary px-3 py-1.5 text-xs font-medium transition-colors"
                    title="Remover filtro"
                  >
                    {chip.label}
                    <X className="w-3 h-3" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-primary hover:underline px-1"
                >
                  Limpar tudo
                </button>
              </div>
            )}
          </Card>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {showSidebar && (
            <div className="lg:w-68 xl:w-72 flex-shrink-0">
              <Card className="sticky top-[136px] p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 152px)' }}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm">Filtros</h3>

                    {activeFilterCount > 0 && (
                      <span className="text-xs text-muted-foreground">({activeFilterCount})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="text-xs text-primary hover:underline"
                      >
                        Limpar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="lg:hidden text-muted-foreground"
                      aria-label="Fechar filtros"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Localização
                    </p>

                    <div className="space-y-2 mb-4">
                      {CITIES.map(city => (
                        <Checkbox
                          key={city}
                          label={city}
                          checked={filters.cities.includes(city)}
                          onChange={() => {
                            const updated = filters.cities.includes(city)
                              ? filters.cities.filter(item => item !== city)
                              : [...filters.cities, city];

                            set({ cities: updated });
                          }}
                        />
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-foreground">Tempo a pé até à uni</span>
                        <span className="text-sm font-bold text-primary">
                          {filters.maxWalkMinutes >= 60 ? 'Qualquer' : `≤ ${filters.maxWalkMinutes}min`}
                        </span>
                      </div>

                      <input
                        type="range"
                        min={5}
                        max={60}
                        step={5}
                        value={filters.maxWalkMinutes}
                        onChange={event => set({ maxWalkMinutes: Number(event.target.value) })}
                        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((filters.maxWalkMinutes - 5) / 55) * 100}%, var(--muted) ${((filters.maxWalkMinutes - 5) / 55) * 100}%, var(--muted) 100%)`,
                        }}
                      />

                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>5min</span>
                        <span>30min</span>
                        <span>Qualquer</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Preço
                    </p>

                    <RangeSlider
                      label=""
                      min={150}
                      max={600}
                      step={10}
                      value={[filters.minPrice, filters.maxPrice]}
                      onChange={([min, max]) => set({ minPrice: min, maxPrice: max })}
                      formatValue={value => `€${value}`}
                    />

                    <div className="mt-3">
                      <Checkbox
                        label="Incluir despesas no limite"
                        checked={filters.includeUtilitiesInPrice}
                        onChange={event => set({ includeUtilitiesInPrice: (event.target as HTMLInputElement).checked })}
                      />
                    </div>
                  </section>

                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Disponibilidade
                    </p>

                    <div className="relative">
                      <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />

                      <select
                        value={filters.entryMonth}
                        onChange={event => set({ entryMonth: event.target.value })}
                        className="w-full pl-9 pr-7 py-2.5 text-sm bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
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
                  </section>

                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Tipo de quarto
                    </p>

                    <div className="space-y-2">
                      {ROOM_TYPES.map(type => (
                        <Checkbox
                          key={type.value}
                          label={type.label}
                          checked={filters.roomTypes.includes(type.value)}
                          onChange={() => {
                            const updated = filters.roomTypes.includes(type.value)
                              ? filters.roomTypes.filter(item => item !== type.value)
                              : [...filters.roomTypes, type.value];

                            set({ roomTypes: updated });
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Confiança e segurança
                    </p>

                    <div className="space-y-2">
                      <Checkbox
                        label="Anúncio verificado"
                        checked={filters.verifiedListing}
                        onChange={event => set({ verifiedListing: (event.target as HTMLInputElement).checked })}
                      />

                      <Checkbox
                        label="Senhorio verificado"
                        checked={filters.verifiedLandlord}
                        onChange={event => set({ verifiedLandlord: (event.target as HTMLInputElement).checked })}
                      />
                    </div>
                  </section>

                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Comodidades
                    </p>

                    <div className="space-y-2">
                      <Checkbox label="Wi-Fi incluído" checked={filters.wifi} onChange={event => set({ wifi: (event.target as HTMLInputElement).checked })} />
                      <Checkbox label="Máquina de lavar" checked={filters.laundry} onChange={event => set({ laundry: (event.target as HTMLInputElement).checked })} />
                      <Checkbox label="Cozinha equipada" checked={filters.kitchen} onChange={event => set({ kitchen: (event.target as HTMLInputElement).checked })} />
                      <Checkbox label="Casa de banho privativa" checked={filters.privateBathroom} onChange={event => set({ privateBathroom: (event.target as HTMLInputElement).checked })} />
                    </div>
                  </section>

                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Regras da casa
                    </p>

                    <div className="space-y-2">
                      <Checkbox label="Sem festas" checked={filters.noParties} onChange={event => set({ noParties: (event.target as HTMLInputElement).checked })} />
                      <Checkbox label="Horário de silêncio" checked={filters.quietHours} onChange={event => set({ quietHours: (event.target as HTMLInputElement).checked })} />
                    </div>
                  </section>

                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Perto de
                    </p>

                    <div className="space-y-2">
                      <Checkbox label="Supermercado" checked={filters.nearSupermarket} onChange={event => set({ nearSupermarket: (event.target as HTMLInputElement).checked })} />
                      <Checkbox label="Paragem de autocarro" checked={filters.nearBusStop} onChange={event => set({ nearBusStop: (event.target as HTMLInputElement).checked })} />
                    </div>
                  </section>

                  {canShowCompatibility && (
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Compatibilidade mínima
                        </p>

                        <span className="text-sm font-bold text-primary">
                          {filters.minCompatibility > 0 ? `${filters.minCompatibility}%` : 'Todas'}
                        </span>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={filters.minCompatibility}
                        onChange={event => set({ minCompatibility: Number(event.target.value) })}
                        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${filters.minCompatibility}%, var(--muted) ${filters.minCompatibility}%, var(--muted) 100%)`,
                        }}
                      />
                    </section>
                  )}

                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Ordenar por
                    </p>

                    <select
                      value={filters.sortBy}
                      onChange={event => set({ sortBy: event.target.value as SearchFilters['sortBy'] })}
                      className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      {canShowCompatibility && (
                        <option value="compatibility">Compatibilidade</option>
                      )}
                      <option value="price_asc">Preço crescente</option>
                      <option value="price_desc">Preço decrescente</option>
                      <option value="distance">Mais próximo</option>
                      <option value="recent">Mais recentes</option>
                    </select>
                  </section>
                </div>
              </Card>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-bold text-foreground">
                  {loading ? 'A pesquisar...' : (
                    results.length > 0
                      ? `${results.length} quarto${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`
                      : 'Nenhum quarto encontrado'
                  )}
                </h2>

                {!loading && results.length > 0 && (
                  <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    Perto da {universityLabel}
                    {filters.cities.length > 0 ? ` · ${filters.cities.join(', ')}` : ' · Viseu'}
                    {filters.maxWalkMinutes < 60 ? ` · até ${filters.maxWalkMinutes}min a pé` : ''}
                    {` · ${sortLabel}`}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg flex-shrink-0">
                {(['grid', 'list', 'map'] as ViewMode[]).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    title={mode === 'grid' ? 'Grelha' : mode === 'list' ? 'Lista' : 'Mapa'}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === mode ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {mode === 'grid' && <Grid className="w-4 h-4" />}
                    {mode === 'list' && <List className="w-4 h-4" />}
                    {mode === 'map' && <MapIcon className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4' : 'space-y-3'}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className={`bg-card rounded-xl animate-pulse ${viewMode === 'list' ? 'h-32' : 'h-80'}`}
                  />
                ))}
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                filters={filters}
                onClear={handleClearFilters}
                onUpdate={set}
                canShowCompatibility={canShowCompatibility}
              />
            ) : viewMode === 'map' ? (
              <GeneralMapView
                results={results}
                university={filters.university}
                universityLabel={universityLabel}
                isInCompare={isInCompare}
                toggleCompare={toggleCompare}
                canAdd={canAdd}
                canShowCompatibility={canShowCompatibility}
              />
            ) : viewMode === 'list' ? (
              <div className="space-y-3">
                {results.map(({ room, property, availableRooms }) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    property={property}
                    availableRooms={availableRooms}
                    variant="public"
                    displayMode="list"
                    compareProps={{
                      isComparing: isInCompare(room.id),
                      onToggle: event => {
                        event.stopPropagation();
                        toggleCompare(room, property);
                      },
                      disabled: !canAdd && !isInCompare(room.id),
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                {results.map(({ room, property, availableRooms }) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    property={property}
                    availableRooms={availableRooms}
                    variant="public"
                    compareProps={{
                      isComparing: isInCompare(room.id),
                      onToggle: event => {
                        event.stopPropagation();
                        toggleCompare(room, property);
                      },
                      disabled: !canAdd && !isInCompare(room.id),
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

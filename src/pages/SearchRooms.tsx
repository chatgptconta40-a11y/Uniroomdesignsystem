import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { RoomCard } from '../components/RoomCard';
import { Button } from '../components/Button';
import { RangeSlider } from '../components/RangeSlider';
import { Checkbox } from '../components/Checkbox';
import { Card } from '../components/Card';
import { useProperties } from '../context/PropertiesContext';
import { useCompare } from '../context/CompareContext';
import { getVerificationStatus } from '../data/mockTrust';
import { Room, Property } from '../types/property';

// ─── Helpers ────────────────────────────────────────────────────────────────

const walkMinutes = (km: number) => Math.round(km * 13);

const isNearSupermarket = (p: Property) =>
  p.zone.toLowerCase().includes('centro') || p.distanceToUniversity <= 0.5;

const isNearBusStop = (p: Property) => p.distanceToUniversity <= 1.5;

const hasVerifiedLandlord = (p: Property) => {
  const v = getVerificationStatus(p.landlordId);
  return v?.level === 'gold' || v?.level === 'silver';
};

// ─── Types & Constants ───────────────────────────────────────────────────────

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
  { value: 'ESTGV', label: 'ESTGV – Viseu' },
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

// ─── Positions relative to ESTGV (pixels at scale 100px/km) ─────────────────
const PROP_POSITIONS: Record<string, { x: number; y: number }> = {
  'prop-1': { x: -72, y: -44 }, // 0.8km NW – Centro Histórico
  'prop-2': { x: 12, y: -26 },  // 0.3km N  – Zona Universitária
};

const SORT_LABELS: Record<SearchFilters['sortBy'], string> = {
  compatibility: 'Compatibilidade',
  price_asc: 'Preço crescente',
  price_desc: 'Preço decrescente',
  distance: 'Mais próximo',
  recent: 'Mais recentes',
};

function getFilterChips(filters: SearchFilters, set: (u: Partial<SearchFilters>) => void) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  const typeLabels: Record<string, string> = { private: 'Privado', shared: 'Partilhado', studio: 'Estúdio', apartment: 'Apartamento' };

  filters.cities.forEach(city => chips.push({ key: `city-${city}`, label: city, onRemove: () => set({ cities: filters.cities.filter(c => c !== city) }) }));
  filters.roomTypes.forEach(rt => chips.push({ key: `type-${rt}`, label: typeLabels[rt] || rt, onRemove: () => set({ roomTypes: filters.roomTypes.filter(r => r !== rt) }) }));
  if (filters.minPrice > DEFAULT_FILTERS.minPrice || filters.maxPrice < DEFAULT_FILTERS.maxPrice)
    chips.push({ key: 'price', label: `€${filters.minPrice}–€${filters.maxPrice}`, onRemove: () => set({ minPrice: DEFAULT_FILTERS.minPrice, maxPrice: DEFAULT_FILTERS.maxPrice }) });
  if (filters.maxWalkMinutes < 60)
    chips.push({ key: 'walk', label: `≤${filters.maxWalkMinutes}min a pé`, onRemove: () => set({ maxWalkMinutes: 60 }) });
  if (filters.entryMonth) {
    const label = ENTRY_MONTHS.find(m => m.value === filters.entryMonth)?.label || filters.entryMonth;
    chips.push({ key: 'entry', label: `Entrada: ${label}`, onRemove: () => set({ entryMonth: '' }) });
  }
  if (filters.minCompatibility > 0)
    chips.push({ key: 'compat', label: `≥${filters.minCompatibility}% compat.`, onRemove: () => set({ minCompatibility: 0 }) });
  if (filters.verifiedListing) chips.push({ key: 'verified', label: 'Anúncio verificado', onRemove: () => set({ verifiedListing: false }) });
  if (filters.verifiedLandlord) chips.push({ key: 'vlandlord', label: 'Senhorio verificado', onRemove: () => set({ verifiedLandlord: false }) });
  if (filters.privateBathroom) chips.push({ key: 'bath', label: 'WC privativo', onRemove: () => set({ privateBathroom: false }) });
  if (filters.wifi) chips.push({ key: 'wifi', label: 'Wi-Fi', onRemove: () => set({ wifi: false }) });
  if (filters.laundry) chips.push({ key: 'laundry', label: 'Lavar roupa', onRemove: () => set({ laundry: false }) });
  if (filters.kitchen) chips.push({ key: 'kitchen', label: 'Cozinha', onRemove: () => set({ kitchen: false }) });
  if (filters.noParties) chips.push({ key: 'noparties', label: 'Sem festas', onRemove: () => set({ noParties: false }) });
  if (filters.quietHours) chips.push({ key: 'quiet', label: 'Horário de silêncio', onRemove: () => set({ quietHours: false }) });
  if (filters.nearSupermarket) chips.push({ key: 'super', label: 'Supermercado', onRemove: () => set({ nearSupermarket: false }) });
  if (filters.nearBusStop) chips.push({ key: 'bus', label: 'Autocarro', onRemove: () => set({ nearBusStop: false }) });
  if (filters.includeUtilitiesInPrice) chips.push({ key: 'util', label: 'c/ despesas', onRemove: () => set({ includeUtilitiesInPrice: false }) });
  return chips;
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  filters: SearchFilters;
  onClear: () => void;
  onUpdate: (u: Partial<SearchFilters>) => void;
}

function EmptyState({ filters, onClear, onUpdate }: EmptyStateProps) {
  const suggestions: { text: string; action: () => void }[] = [];

  if (filters.maxPrice < 400)
    suggestions.push({ text: 'Aumenta o limite de preço para €400', action: () => onUpdate({ maxPrice: 400 }) });
  if (filters.maxWalkMinutes < 30)
    suggestions.push({ text: `Aumenta para 30 min a pé (era ≤${filters.maxWalkMinutes}min)`, action: () => onUpdate({ maxWalkMinutes: 30 }) });
  if (filters.entryMonth)
    suggestions.push({ text: 'Remove o filtro de data de entrada', action: () => onUpdate({ entryMonth: '' }) });
  if (filters.verifiedListing)
    suggestions.push({ text: 'Remove o filtro "anúncio verificado"', action: () => onUpdate({ verifiedListing: false }) });
  if (filters.minCompatibility > 0)
    suggestions.push({ text: 'Remove o mínimo de compatibilidade', action: () => onUpdate({ minCompatibility: 0 }) });
  if (filters.roomTypes.length > 0)
    suggestions.push({ text: 'Alarga os tipos de quarto aceites', action: () => onUpdate({ roomTypes: [] }) });
  if (filters.cities.length > 0)
    suggestions.push({ text: 'Remove o filtro de cidade', action: () => onUpdate({ cities: [] }) });

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
          {suggestions.slice(0, 4).map((s, i) => (
            <button
              key={i}
              onClick={s.action}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm text-left group"
            >
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              <span>{s.text}</span>
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

// ─── LocationMapPanel ────────────────────────────────────────────────────────

interface LocationMapPanelProps {
  results: { room: Room; property: Property; availableRooms: number }[];
  isInCompare: (id: string) => boolean;
  toggleCompare: (room: Room, property: Property) => void;
  canAdd: boolean;
}

function LocationMapPanel({ results, isInCompare, toggleCompare, canAdd }: LocationMapPanelProps) {
  const uniqueProps = Array.from(new Map(results.map(r => [r.property.id, r.property])).values());
  const CX = 280, CY = 210;
  const SCALE = 100;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <Card className="flex-1 p-4 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Localização dos quartos</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
            Posições aproximadas
          </span>
        </div>

        <div className="rounded-xl overflow-hidden border border-border">
          <svg viewBox={`0 0 560 420`} className="w-full" style={{ background: '#eef2e6' }}>
            <rect width="560" height="420" fill="#eef2e6" />

            {/* Park zones */}
            <ellipse cx="450" cy="80" rx="55" ry="32" fill="#c8dcb4" opacity="0.7" />
            <ellipse cx="80" cy="340" rx="42" ry="26" fill="#c8dcb4" opacity="0.7" />
            <ellipse cx="500" cy="320" rx="35" ry="22" fill="#c8dcb4" opacity="0.5" />

            {/* Building blocks */}
            <rect x="50" y="60" width="70" height="45" rx="4" fill="#d0d8c4" opacity="0.6" />
            <rect x="360" y="130" width="55" height="70" rx="4" fill="#d0d8c4" opacity="0.5" />
            <rect x="140" y="290" width="90" height="55" rx="4" fill="#d0d8c4" opacity="0.5" />
            <rect x="380" y="270" width="60" height="40" rx="4" fill="#d0d8c4" opacity="0.4" />

            {/* Major roads */}
            <line x1="0" y1={CY} x2="560" y2={CY} stroke="#ccc9b5" strokeWidth="9" />
            <line x1={CX} y1="0" x2={CX} y2="420" stroke="#ccc9b5" strokeWidth="9" />
            <line x1="0" y1="130" x2="560" y2="310" stroke="#d8d4c2" strokeWidth="5" />
            <line x1="100" y1="420" x2="440" y2="0" stroke="#d8d4c2" strokeWidth="4" />

            {/* Road labels */}
            <text x="330" y={CY - 6} fontSize="9" fill="#8a8575" textAnchor="middle">Av. Principal</text>
            <text x={CX + 8} y="75" fontSize="9" fill="#8a8575">Rua da Universidade</text>

            {/* Distance rings */}
            {[0.3, 0.6, 1.0].map((km) => (
              <circle
                key={km}
                cx={CX} cy={CY}
                r={km * SCALE}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1.2"
                strokeDasharray={km === 1.0 ? '6,4' : '2,3'}
                opacity={0.5}
              />
            ))}
            <text x={CX + 0.3 * SCALE + 4} y={CY - 3} fontSize="9" fill="#3b82f6" opacity="0.8">300m</text>
            <text x={CX + 0.6 * SCALE + 4} y={CY - 3} fontSize="9" fill="#3b82f6" opacity="0.8">600m</text>
            <text x={CX + 1.0 * SCALE + 4} y={CY - 3} fontSize="9" fill="#3b82f6" opacity="0.6">1km</text>

            {/* ESTGV marker */}
            <circle cx={CX} cy={CY} r="24" fill="#dc2626" opacity="0.15" />
            <circle cx={CX} cy={CY} r="16" fill="#dc2626" />
            <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="white" fontWeight="bold">E</text>
            <rect x={CX - 28} y={CY + 22} width="56" height="15" rx="3" fill="white" opacity="0.92" />
            <text x={CX} y={CY + 32} textAnchor="middle" fontSize="9.5" fill="#dc2626" fontWeight="700">ESTGV</text>

            {/* Property markers */}
            {uniqueProps.map((prop, idx) => {
              const pos = PROP_POSITIONS[prop.id] ?? { x: (idx - 0.5) * 90, y: -50 };
              const px = CX + pos.x;
              const py = CY + pos.y;
              const roomCount = results.filter(r => r.property.id === prop.id).length;
              const walk = walkMinutes(prop.distanceToUniversity);

              return (
                <g key={prop.id}>
                  <line x1={px} y1={py} x2={CX} y2={CY} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.5" />
                  <circle cx={px} cy={py} r="22" fill="#2563eb" opacity="0.15" />
                  <circle cx={px} cy={py} r="16" fill="#2563eb" />
                  <text x={px} y={py + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="white" fontWeight="bold">{roomCount}</text>
                  <rect x={px - 40} y={py + 22} width="80" height="28" rx="4" fill="white" opacity="0.95" />
                  <text x={px} y={py + 33} textAnchor="middle" fontSize="9" fill="#1d4ed8" fontWeight="600">{prop.zone}</text>
                  <text x={px} y={py + 43} textAnchor="middle" fontSize="8" fill="#6b7280">~{walk}min a pé · {prop.distanceToUniversity}km</text>
                </g>
              );
            })}

            {/* Legend */}
            <rect x="10" y="10" width="148" height="60" rx="6" fill="white" opacity="0.92" />
            <circle cx="28" cy="28" r="9" fill="#dc2626" />
            <text x="44" y="32" fontSize="10" fill="#374151">ESTGV (referência)</text>
            <circle cx="28" cy="52" r="9" fill="#2563eb" />
            <text x="44" y="56" fontSize="10" fill="#374151">Quartos ({results.length})</text>
          </svg>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          Posições indicativas com base na zona declarada. Verifica sempre no mapa antes de visitar.
        </p>
      </Card>

      <div className="lg:w-96 space-y-3 overflow-y-auto" style={{ maxHeight: '540px' }}>
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
              onToggle: (e) => { e.stopPropagation(); toggleCompare(room, property); },
              disabled: !canAdd && !isInCompare(room.id),
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── SearchRooms ─────────────────────────────────────────────────────────────

export function SearchRooms() {
  const { rooms, properties } = useProperties();
  const { isInCompare, toggleCompare, canAdd } = useCompare();
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [results, setResults] = useState<{ room: Room; property: Property; availableRooms: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  const set = (u: Partial<SearchFilters>) => setFilters(f => ({ ...f, ...u }));

  useEffect(() => {
    setLoading(true);
    const tid = setTimeout(() => {
      const activeProperties = properties.filter(p => p.status === 'active');
      const propertiesMap = new Map(activeProperties.map(p => [p.id, p]));
      const activeIds = activeProperties.map(p => p.id);

      let filtered = rooms.filter(r => r.status === 'available' && activeIds.includes(r.propertyId));

      if (filters.query.trim()) {
        const q = filters.query.toLowerCase();
        filtered = filtered.filter(r => {
          const p = propertiesMap.get(r.propertyId);
          return r.title.toLowerCase().includes(q) || p?.zone.toLowerCase().includes(q) || p?.city.toLowerCase().includes(q);
        });
      }

      if (filters.cities.length > 0) {
        filtered = filtered.filter(r => {
          const p = propertiesMap.get(r.propertyId);
          return p && filters.cities.includes(p.city);
        });
      }

      filtered = filtered.filter(r => {
        const effective = filters.includeUtilitiesInPrice ? r.price + (r.utilities || 0) : r.price;
        return effective >= filters.minPrice && effective <= filters.maxPrice;
      });

      if (filters.roomTypes.length > 0) {
        filtered = filtered.filter(r => filters.roomTypes.includes(r.roomType));
      }

      if (filters.maxWalkMinutes < 60) {
        const maxKm = filters.maxWalkMinutes / 13;
        filtered = filtered.filter(r => {
          const p = propertiesMap.get(r.propertyId);
          return p && p.distanceToUniversity <= maxKm;
        });
      }

      if (filters.minCompatibility > 0) {
        filtered = filtered.filter(r => (r.compatibilityScore || 0) >= filters.minCompatibility);
      }

      if (filters.entryMonth) {
        const [y, m] = filters.entryMonth.split('-').map(Number);
        const entryDate = new Date(y, m - 1, 1);
        filtered = filtered.filter(r => new Date(r.availableFrom) <= entryDate);
      }

      if (filters.privateBathroom) filtered = filtered.filter(r => r.privateBathroom);

      filtered = filtered.filter(r => {
        const p = propertiesMap.get(r.propertyId);
        if (!p) return false;
        if (filters.verifiedListing && !p.verified) return false;
        if (filters.verifiedLandlord && !hasVerifiedLandlord(p)) return false;
        if (filters.wifi && !p.amenities.wifi) return false;
        if (filters.laundry && !p.amenities.laundry) return false;
        if (filters.kitchen && !p.amenities.kitchen) return false;
        if (filters.noParties && p.houseRules?.parties !== false) return false;
        if (filters.quietHours && !p.houseRules?.quietHours) return false;
        if (filters.nearSupermarket && !isNearSupermarket(p)) return false;
        if (filters.nearBusStop && !isNearBusStop(p)) return false;
        return true;
      });

      const pairs = filtered
        .map(room => {
          const property = propertiesMap.get(room.propertyId);
          if (!property) return null;
          return {
            room,
            property,
            availableRooms: rooms.filter(r => r.propertyId === property.id && r.status === 'available').length,
          };
        })
        .filter((p): p is { room: Room; property: Property; availableRooms: number } => p !== null);

      pairs.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price_asc': return a.room.price - b.room.price;
          case 'price_desc': return b.room.price - a.room.price;
          case 'distance': return a.property.distanceToUniversity - b.property.distanceToUniversity;
          case 'recent': return new Date(b.room.createdAt).getTime() - new Date(a.room.createdAt).getTime();
          default: return (b.room.compatibilityScore || 0) - (a.room.compatibilityScore || 0);
        }
      });

      setResults(pairs);
      setLoading(false);
    }, 300);
    return () => clearTimeout(tid);
  }, [rooms, properties, filters]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.cities.length > 0) c++;
    if (filters.roomTypes.length > 0) c++;
    if (filters.minPrice > 150 || filters.maxPrice < 600) c++;
    if (filters.maxWalkMinutes < 60) c++;
    if (filters.minCompatibility > 0) c++;
    if (filters.entryMonth) c++;
    if (filters.verifiedListing) c++;
    if (filters.verifiedLandlord) c++;
    if (filters.privateBathroom) c++;
    if (filters.wifi) c++;
    if (filters.laundry) c++;
    if (filters.kitchen) c++;
    if (filters.noParties) c++;
    if (filters.quietHours) c++;
    if (filters.nearSupermarket) c++;
    if (filters.nearBusStop) c++;
    if (filters.includeUtilitiesInPrice) c++;
    return c;
  }, [filters]);

  const handleClearFilters = () => setFilters(DEFAULT_FILTERS);

  const universityLabel = UNIVERSITIES.find(u => u.value === filters.university)?.label ?? filters.university;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky search bar ── */}
      <div className="bg-card border-b border-border sticky top-[65px] z-30 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-3">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Text search */}
            <div className="flex-1 min-w-[140px] relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Zona, título ou cidade..."
                value={filters.query}
                onChange={e => set({ query: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
              {filters.query && (
                <button onClick={() => set({ query: '' })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* University */}
            <div className="relative">
              <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                value={filters.university}
                onChange={e => set({ university: e.target.value })}
                className="pl-9 pr-7 py-2.5 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                {UNIVERSITIES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Price quick-filters */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1 hidden sm:block whitespace-nowrap">Até:</span>
              {[{ max: 250, label: '€250' }, { max: 300, label: '€300' }, { max: 400, label: '€400' }].map(({ max, label }) => (
                <button
                  key={max}
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

            {/* Entry month */}
            <div className="relative">
              <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                value={filters.entryMonth}
                onChange={e => set({ entryMonth: e.target.value })}
                className="pl-9 pr-7 py-2.5 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="">Qualquer data</option>
                {ENTRY_MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Filter toggle */}
            <button
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

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/50">
              {getFilterChips(filters, set).map(chip => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium"
                >
                  {chip.label}
                  <button
                    onClick={chip.onRemove}
                    className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5 transition-colors"
                    aria-label={`Remover filtro ${chip.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={handleClearFilters}
                className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2 ml-0.5"
              >
                Limpar tudo
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar ── */}
          {showFilters && (
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
                      <button onClick={handleClearFilters} className="text-xs text-primary hover:underline">
                        Limpar
                      </button>
                    )}
                    <button onClick={() => setShowFilters(false)} className="lg:hidden text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">

                  {/* ── Localização ── */}
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Localização</p>
                    <div className="space-y-2 mb-4">
                      {CITIES.map(city => (
                        <Checkbox
                          key={city}
                          label={city}
                          checked={filters.cities.includes(city)}
                          onChange={() => {
                            const updated = filters.cities.includes(city)
                              ? filters.cities.filter(c => c !== city)
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
                        min={5} max={60} step={5}
                        value={filters.maxWalkMinutes}
                        onChange={e => set({ maxWalkMinutes: Number(e.target.value) })}
                        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((filters.maxWalkMinutes - 5) / 55) * 100}%, var(--muted) ${((filters.maxWalkMinutes - 5) / 55) * 100}%, var(--muted) 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>5min</span><span>30min</span><span>Qualquer</span>
                      </div>
                    </div>
                  </section>

                  {/* ── Preço ── */}
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Preço</p>
                    <RangeSlider
                      label=""
                      min={150} max={600} step={10}
                      value={[filters.minPrice, filters.maxPrice]}
                      onChange={([min, max]) => set({ minPrice: min, maxPrice: max })}
                      formatValue={v => `€${v}`}
                    />
                    <div className="mt-3">
                      <Checkbox
                        label="Incluir despesas no limite"
                        checked={filters.includeUtilitiesInPrice}
                        onChange={e => set({ includeUtilitiesInPrice: (e.target as HTMLInputElement).checked })}
                      />
                    </div>
                  </section>

                  {/* ── Disponibilidade ── */}
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Disponibilidade</p>
                    <div className="relative">
                      <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <select
                        value={filters.entryMonth}
                        onChange={e => set({ entryMonth: e.target.value })}
                        className="w-full pl-9 pr-7 py-2.5 text-sm bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                      >
                        <option value="">Qualquer data</option>
                        {ENTRY_MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </section>

                  {/* ── Tipo de quarto ── */}
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tipo de quarto</p>
                    <div className="space-y-2">
                      {ROOM_TYPES.map(t => (
                        <Checkbox
                          key={t.value}
                          label={t.label}
                          checked={filters.roomTypes.includes(t.value)}
                          onChange={() => {
                            const updated = filters.roomTypes.includes(t.value)
                              ? filters.roomTypes.filter(r => r !== t.value)
                              : [...filters.roomTypes, t.value];
                            set({ roomTypes: updated });
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* ── Confiança ── */}
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Confiança & Segurança</p>
                    <div className="space-y-2">
                      <Checkbox
                        label="Anúncio verificado"
                        checked={filters.verifiedListing}
                        onChange={e => set({ verifiedListing: (e.target as HTMLInputElement).checked })}
                      />
                      <Checkbox
                        label="Senhorio verificado"
                        checked={filters.verifiedLandlord}
                        onChange={e => set({ verifiedLandlord: (e.target as HTMLInputElement).checked })}
                      />
                    </div>
                  </section>

                  {/* ── Comodidades ── */}
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Comodidades</p>
                    <div className="space-y-2">
                      <Checkbox label="Wi-Fi incluído" checked={filters.wifi} onChange={e => set({ wifi: (e.target as HTMLInputElement).checked })} />
                      <Checkbox label="Máquina de lavar" checked={filters.laundry} onChange={e => set({ laundry: (e.target as HTMLInputElement).checked })} />
                      <Checkbox label="Cozinha equipada" checked={filters.kitchen} onChange={e => set({ kitchen: (e.target as HTMLInputElement).checked })} />
                      <Checkbox label="Casa de banho privativa" checked={filters.privateBathroom} onChange={e => set({ privateBathroom: (e.target as HTMLInputElement).checked })} />
                    </div>
                  </section>

                  {/* ── Regras da casa ── */}
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Regras da casa</p>
                    <div className="space-y-2">
                      <Checkbox label="Sem festas" checked={filters.noParties} onChange={e => set({ noParties: (e.target as HTMLInputElement).checked })} />
                      <Checkbox label="Horário de silêncio" checked={filters.quietHours} onChange={e => set({ quietHours: (e.target as HTMLInputElement).checked })} />
                    </div>
                  </section>

                  {/* ── Perto de ── */}
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Perto de</p>
                    <div className="space-y-2">
                      <Checkbox label="Supermercado" checked={filters.nearSupermarket} onChange={e => set({ nearSupermarket: (e.target as HTMLInputElement).checked })} />
                      <Checkbox label="Paragem de autocarro" checked={filters.nearBusStop} onChange={e => set({ nearBusStop: (e.target as HTMLInputElement).checked })} />
                    </div>
                  </section>

                  {/* ── Compatibilidade ── */}
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Compatibilidade mínima</p>
                      <span className="text-sm font-bold text-primary">
                        {filters.minCompatibility > 0 ? `${filters.minCompatibility}%` : 'Todas'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0} max={100} step={5}
                      value={filters.minCompatibility}
                      onChange={e => set({ minCompatibility: Number(e.target.value) })}
                      className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${filters.minCompatibility}%, var(--muted) ${filters.minCompatibility}%, var(--muted) 100%)`,
                      }}
                    />
                  </section>

                  {/* ── Ordenar ── */}
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ordenar por</p>
                    <select
                      value={filters.sortBy}
                      onChange={e => set({ sortBy: e.target.value as SearchFilters['sortBy'] })}
                      className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="compatibility">Compatibilidade</option>
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

          {/* ── Results area ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-foreground">
                  {loading ? 'A pesquisar...' : (
                    results.length > 0
                      ? `${results.length} quarto${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`
                      : 'Nenhum quarto encontrado'
                  )}
                </h2>
                {!loading && results.length > 0 && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    Perto da {universityLabel}
                    {filters.cities.length > 0 ? ` · ${filters.cities.join(', ')}` : ' · Viseu'}
                    {filters.maxWalkMinutes < 60 ? ` · ≤${filters.maxWalkMinutes}min a pé` : ''}
                    {` · ${SORT_LABELS[filters.sortBy]}`}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                {(['grid', 'list', 'map'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
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
              viewMode === 'list' || viewMode === 'map' ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse flex border border-border">
                      <div className="w-36 sm:w-44 flex-shrink-0 bg-muted" style={{ minHeight: '120px' }} />
                      <div className="flex-1 p-4 space-y-2.5">
                        <div className="h-4 bg-muted rounded w-2/3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="flex gap-1.5 pt-1">
                          <div className="h-4 bg-muted rounded-full w-10" />
                          <div className="h-4 bg-muted rounded-full w-14" />
                          <div className="h-4 bg-muted rounded-full w-12" />
                        </div>
                        <div className="h-3 bg-muted rounded w-1/3" />
                      </div>
                      <div className="w-28 p-4 flex flex-col gap-2 justify-center flex-shrink-0">
                        <div className="h-5 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-3/4 mx-auto" />
                        <div className="h-8 bg-muted rounded-lg w-full mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse border border-border">
                      <div className="h-52 bg-muted" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                        <div className="flex gap-1.5">
                          <div className="h-5 bg-muted rounded-full w-12" />
                          <div className="h-5 bg-muted rounded-full w-14" />
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-muted">
                          <div className="h-6 bg-muted rounded w-16" />
                          <div className="h-8 bg-muted rounded-lg w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : results.length === 0 ? (
              <EmptyState filters={filters} onClear={handleClearFilters} onUpdate={set} />
            ) : viewMode === 'map' ? (
              <LocationMapPanel
                results={results}
                isInCompare={isInCompare}
                toggleCompare={toggleCompare}
                canAdd={canAdd}
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
                      onToggle: (e) => { e.stopPropagation(); toggleCompare(room, property); },
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
                      onToggle: (e) => { e.stopPropagation(); toggleCompare(room, property); },
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

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckCircle,
  ChevronDown,
  Eye,
  Filter,
  MapPin,
  Pause,
  Play,
  Search,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../components/AdminLayout';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useProperties } from '../context/PropertiesContext';
import { Property, PropertyStatus, Room, RoomStatus } from '../types/property';

type ListingFilter = 'all' | PropertyStatus | 'suspicious';
type SortKey = 'updatedAt' | 'views' | 'rooms' | 'price';

interface PropertyGroup {
  property: Property;
  propertyRooms: Room[];
  minPrice: number;
  availableRooms: number;
  occupiedRooms: number;
  suspiciousScore: number;
}

export function AdminListings() {
  const navigate = useNavigate();
  const { properties, rooms, updatePropertyStatus, updateRoomStatus } = useProperties();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ListingFilter>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedGroup, setSelectedGroup] = useState<PropertyGroup | null>(null);

  const groups = useMemo<PropertyGroup[]>(() => {
    return properties
      .map(property => {
        const propertyRooms = rooms.filter(room => room.propertyId === property.id);
        const minPrice =
          propertyRooms.length > 0 ? Math.min(...propertyRooms.map(room => room.price)) : 0;
        const availableRooms = propertyRooms.filter(room => room.status === 'available').length;
        const occupiedRooms = propertyRooms.filter(
          room => room.status === 'occupied' || room.status === 'reserved'
        ).length;

        const lowPriceFlag = minPrice > 0 && minPrice < 300 ? 35 : 0;
        const unverifiedFlag = property.verified ? 0 : 35;
        const staleFlag = property.status === 'draft' ? 15 : 0;
        const suspiciousScore = Math.min(100, lowPriceFlag + unverifiedFlag + staleFlag);

        return {
          property,
          propertyRooms,
          minPrice,
          availableRooms,
          occupiedRooms,
          suspiciousScore,
        };
      })
      .filter(group => group.propertyRooms.length > 0);
  }, [properties, rooms]);

  const cities = ['all', ...Array.from(new Set(groups.map(group => group.property.city)))];

  const filteredGroups = groups
    .filter(group => {
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        group.property.title.toLowerCase().includes(query) ||
        group.property.city.toLowerCase().includes(query) ||
        group.property.zone.toLowerCase().includes(query) ||
        group.propertyRooms.some(room => room.title.toLowerCase().includes(query));

      const matchesStatus =
        filterStatus === 'all' ||
        group.property.status === filterStatus ||
        (filterStatus === 'suspicious' && group.suspiciousScore >= 50);

      const matchesCity = filterCity === 'all' || group.property.city === filterCity;

      return matchesSearch && matchesStatus && matchesCity;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'updatedAt') {
        comparison = a.property.updatedAt.getTime() - b.property.updatedAt.getTime();
      }

      if (sortBy === 'views') {
        comparison = a.property.views - b.property.views;
      }

      if (sortBy === 'rooms') {
        comparison = a.propertyRooms.length - b.propertyRooms.length;
      }

      if (sortBy === 'price') {
        comparison = a.minPrice - b.minPrice;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const stats = {
    total: groups.length,
    active: groups.filter(group => group.property.status === 'active').length,
    paused: groups.filter(group => group.property.status === 'paused').length,
    draft: groups.filter(group => group.property.status === 'draft').length,
    suspicious: groups.filter(group => group.suspiciousScore >= 50).length,
  };

  const getStatusBadge = (status: PropertyStatus) => {
    const configs = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-amber-100 text-amber-800',
      draft: 'bg-muted text-muted-foreground',
      archived: 'bg-slate-200 text-slate-700',
    };

    const labels = {
      active: 'Ativo',
      paused: 'Pausado',
      draft: 'Rascunho',
      archived: 'Arquivado',
    };

    return <Badge className={configs[status]}>{labels[status]}</Badge>;
  };

  const getRoomStatusBadge = (status: RoomStatus) => {
    const configs = {
      available: 'bg-green-100 text-green-800',
      reserved: 'bg-blue-100 text-blue-800',
      occupied: 'bg-slate-200 text-slate-700',
      paused: 'bg-amber-100 text-amber-800',
      draft: 'bg-muted text-muted-foreground',
    };

    const labels = {
      available: 'Disponível',
      reserved: 'Reservado',
      occupied: 'Ocupado',
      paused: 'Pausado',
      draft: 'Rascunho',
    };

    return <Badge className={configs[status]}>{labels[status]}</Badge>;
  };

  const handlePropertyStatus = (propertyId: string, status: PropertyStatus, label: string) => {
    updatePropertyStatus(propertyId, status);
    toast.success(label);
  };

  const handleRoomStatus = (roomId: string, status: RoomStatus, label: string) => {
    updateRoomStatus(roomId, status);
    toast.success(label);
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Casas e quartos publicados</h1>
        <p className="text-muted-foreground mt-2">
          Moderação de propriedades e respetivos quartos. Cada quarto aparece sempre associado à sua casa.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { key: 'all' as const, label: 'Total', value: stats.total },
          { key: 'active' as const, label: 'Ativas', value: stats.active },
          { key: 'paused' as const, label: 'Pausadas', value: stats.paused },
          { key: 'draft' as const, label: 'Rascunhos', value: stats.draft },
          { key: 'suspicious' as const, label: 'Suspeitas', value: stats.suspicious },
        ].map(item => (
          <Card
            key={item.key}
            className={`p-4 cursor-pointer ${
              filterStatus === item.key ? 'ring-2 ring-primary' : 'hover:shadow-md'
            }`}
            onClick={() => setFilterStatus(item.key)}
          >
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 mb-6">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar casa, cidade, zona ou quarto..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={event => setFilterStatus(event.target.value as ListingFilter)}
              className="pl-10 pr-8 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="all">Todos os estados</option>
              <option value="active">Ativos</option>
              <option value="paused">Pausados</option>
              <option value="draft">Rascunhos</option>
              <option value="archived">Arquivados</option>
              <option value="suspicious">Suspeitos</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterCity}
              onChange={event => setFilterCity(event.target.value)}
              className="px-4 pr-8 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="all">Todas as cidades</option>
              {cities
                .filter(city => city !== 'all')
                .map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={event => setSortBy(event.target.value as SortKey)}
              className="px-4 pr-8 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="updatedAt">Atualização</option>
              <option value="views">Visualizações</option>
              <option value="rooms">Nº quartos</option>
              <option value="price">Preço mínimo</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <Button variant="outline" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          {filteredGroups.length} casas/apartamentos encontrados
        </p>
      </Card>

      <div className="space-y-5">
        {filteredGroups.map(group => (
          <Card key={group.property.id} className="overflow-hidden">
            <div className="grid lg:grid-cols-[280px_1fr]">
              <div className="relative min-h-[220px] bg-muted">
                <img
                  src={group.property.images[0]}
                  alt={group.property.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {getStatusBadge(group.property.status)}
                  {group.property.verified && (
                    <Badge className="bg-white/95 text-primary">Verificado</Badge>
                  )}
                  {group.suspiciousScore >= 50 && (
                    <Badge className="bg-red-600 text-white">Suspeito</Badge>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{group.property.title}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {group.property.zone}, {group.property.city} · {group.property.distanceToUniversity}km da universidade
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedGroup(group)}>
                      <Eye className="w-4 h-4" />
                      Detalhes
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/room/${group.propertyRooms[0].id}`)}
                    >
                      Ver anúncio
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Quartos</p>
                    <p className="text-lg font-bold text-foreground">{group.propertyRooms.length}</p>
                  </div>

                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-xs text-green-700">Disponíveis</p>
                    <p className="text-lg font-bold text-green-800">{group.availableRooms}</p>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-xs text-blue-700">Ocupados/reserv.</p>
                    <p className="text-lg font-bold text-blue-800">{group.occupiedRooms}</p>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Preço mínimo</p>
                    <p className="text-lg font-bold text-foreground">€{group.minPrice}</p>
                  </div>

                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-xs text-red-700">Risco</p>
                    <p className="text-lg font-bold text-red-800">{group.suspiciousScore}%</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-[1fr_90px_120px_130px] gap-3 bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    <span>Quarto</span>
                    <span>Preço</span>
                    <span>Estado</span>
                    <span>Ações</span>
                  </div>

                  {group.propertyRooms.map(room => (
                    <div
                      key={room.id}
                      className="grid grid-cols-[1fr_90px_120px_130px] gap-3 px-4 py-3 border-t border-border items-center text-sm"
                    >
                      <div>
                        <p className="font-medium text-foreground">{room.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.roomNumber} · {room.roomType}
                        </p>
                      </div>

                      <span className="font-semibold text-foreground">€{room.price}</span>

                      {getRoomStatusBadge(room.status)}

                      <div className="flex gap-2">
                        <button
                          className="p-2 rounded-lg hover:bg-muted"
                          onClick={() => navigate(`/room/${room.id}`)}
                          aria-label="Ver quarto"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {room.status === 'paused' ? (
                          <button
                            className="p-2 rounded-lg hover:bg-muted"
                            onClick={() => handleRoomStatus(room.id, 'available', 'Quarto reativado')}
                            aria-label="Reativar quarto"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            className="p-2 rounded-lg hover:bg-muted"
                            onClick={() => handleRoomStatus(room.id, 'paused', 'Quarto pausado')}
                            aria-label="Pausar quarto"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedGroup && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedGroup(null)} />

          <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-card shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Detalhes da casa</h2>
                <p className="text-sm text-muted-foreground">{selectedGroup.property.title}</p>
              </div>

              <button
                onClick={() => setSelectedGroup(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <Card className="p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedGroup.property.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedGroup.property.address}, {selectedGroup.property.city}
                    </p>
                  </div>

                  {getStatusBadge(selectedGroup.property.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quartos associados</p>
                    <p className="text-2xl font-bold text-foreground">
                      {selectedGroup.propertyRooms.length}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Visualizações</p>
                    <p className="text-2xl font-bold text-foreground">
                      {selectedGroup.property.views}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Preço mínimo</p>
                    <p className="text-2xl font-bold text-foreground">€{selectedGroup.minPrice}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Score de risco</p>
                    <p
                      className={`text-2xl font-bold ${
                        selectedGroup.suspiciousScore >= 50 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {selectedGroup.suspiciousScore}%
                    </p>
                  </div>
                </div>
              </Card>

              {selectedGroup.suspiciousScore >= 50 && (
                <Card className="p-6 bg-red-50 border-red-200">
                  <div className="flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-950">Anúncio sinalizado</h4>
                      <p className="text-sm text-red-800 mt-1">
                        O preço mínimo, verificação ou estado do anúncio indicam que deve ser revisto pelo gestor.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <h4 className="font-bold text-foreground mb-4">Ações administrativas</h4>

                <div className="space-y-3">
                  {selectedGroup.property.status !== 'active' && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-green-700 border-green-300 hover:bg-green-50"
                      onClick={() =>
                        handlePropertyStatus(
                          selectedGroup.property.id,
                          'active',
                          'Anúncio aprovado e publicado'
                        )
                      }
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprovar/Publicar anúncio
                    </Button>
                  )}

                  {selectedGroup.property.status === 'active' && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-amber-700 border-amber-300 hover:bg-amber-50"
                      onClick={() =>
                        handlePropertyStatus(
                          selectedGroup.property.id,
                          'paused',
                          'Anúncio suspenso para revisão'
                        )
                      }
                    >
                      <Pause className="w-4 h-4" />
                      Suspender anúncio suspeito
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-700 border-red-300 hover:bg-red-50"
                    onClick={() =>
                      handlePropertyStatus(
                        selectedGroup.property.id,
                        'archived',
                        'Anúncio rejeitado/arquivado'
                      )
                    }
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar/Arquivar anúncio
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(`/room/${selectedGroup.propertyRooms[0].id}`)}
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalhe público
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
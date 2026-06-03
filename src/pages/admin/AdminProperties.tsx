import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DoorClosed,
  DoorOpen,
  Euro,
  Eye,
  FileText,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  ShieldOff,
  User,
  X as XIcon,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useProperties } from '../../context/PropertiesContext';
import { useApplications, useAdminUsers } from '../../hooks/useDb';
import { useAdminAuditLogs } from '../../hooks/useAdminAuditLogs';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Property } from '../../types/property';

type AdminFilter = 'all' | 'active' | 'pending' | 'suspended';

function getDisplayStatus(property: Property): AdminFilter {
  if (property.adminSuspended) return 'suspended';
  if (property.status === 'draft') return 'pending';
  if (property.status === 'active') return 'active';
  return 'pending';
}

export function AdminProperties() {
  const { user } = useAuth();
  const { properties, rooms } = useProperties();
  const { users: adminUsers } = useAdminUsers();
  const { applications } = useApplications({ scope: 'all' });
  const { createLog } = useAdminAuditLogs({ limit: 1 });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<AdminFilter>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const landlordMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of adminUsers) {
      map.set(u.id, u.fullName || u.email || 'Senhorio não encontrado');
    }
    return map;
  }, [adminUsers]);

  const getLandlordName = (landlordId: string) =>
    landlordMap.get(landlordId) ?? 'Senhorio não encontrado';

  const applicationsByProperty = useMemo(() => {
    const counts = new Map<string, number>();
    const roomToProperty = new Map<string, string>();
    for (const r of rooms) roomToProperty.set(r.id, r.propertyId);
    for (const app of applications) {
      let pid = app.propertyId;
      if (!pid && app.roomId) pid = roomToProperty.get(app.roomId);
      if (!pid) continue;
      counts.set(pid, (counts.get(pid) ?? 0) + 1);
    }
    return counts;
  }, [applications, rooms]);

  const cities = useMemo(() => {
    return Array.from(new Set(properties.map((p) => p.city))).sort();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        property.title.toLowerCase().includes(q) ||
        property.address.toLowerCase().includes(q) ||
        property.city.toLowerCase().includes(q);
      const matchesStatus =
        filterStatus === 'all' || getDisplayStatus(property) === filterStatus;
      const matchesCity = filterCity === 'all' || property.city === filterCity;
      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [properties, searchQuery, filterStatus, filterCity]);

  const stats = useMemo(() => {
    return {
      total: properties.length,
      active: properties.filter((p) => getDisplayStatus(p) === 'active').length,
      pending: properties.filter((p) => getDisplayStatus(p) === 'pending').length,
      suspended: properties.filter((p) => p.adminSuspended).length,
      totalRooms: rooms.length,
      availableRooms: rooms.filter((r) => r.status === 'available').length,
      occupiedRooms: rooms.filter((r) => r.status === 'occupied').length,
    };
  }, [properties, rooms]);

  const getRoomStats = (propertyId: string) => {
    const propertyRooms = rooms.filter((r) => r.propertyId === propertyId);
    return {
      total: propertyRooms.length,
      available: propertyRooms.filter((r) => r.status === 'available').length,
      occupied: propertyRooms.filter((r) => r.status === 'occupied').length,
    };
  };

  const getMinPrice = (propertyId: string) => {
    const propertyRooms = rooms.filter((r) => r.propertyId === propertyId);
    if (propertyRooms.length === 0) return 0;
    return Math.min(...propertyRooms.map((r) => r.price));
  };

  const getStatusBadge = (property: Property) => {
    const status = getDisplayStatus(property);
    switch (status) {
      case 'active':
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            <ShieldOff className="w-3 h-3 mr-1" />
            Suspenso
          </Badge>
        );
      default:
        return null;
    }
  };

  const approveOrReactivate = async (property: Property) => {
    if (!user) return;
    setBusyId(property.id);
    const wasSuspended = property.adminSuspended;
    const { error } = await supabase
      .from('properties')
      .update({
        status: 'active',
        admin_suspended: false,
        admin_suspension_reason: null,
        admin_suspended_at: null,
        admin_suspended_by: null,
      })
      .eq('id', property.id);
    if (!error) {
      await createLog({
        action: wasSuspended ? 'property_reactivated' : 'property_approved',
        entityType: 'property',
        entityId: property.id,
        entityLabel: property.title,
      });
    } else {
      console.error('[AdminProperties] approve error:', error.message);
    }
    setBusyId(null);
  };

  const suspendProperty = async (property: Property) => {
    if (!user) return;
    const reason = window.prompt('Motivo da suspensão:', property.adminSuspensionReason ?? '');
    if (reason === null) return;
    const trimmed = reason.trim();
    if (!trimmed) return;
    setBusyId(property.id);
    const { error } = await supabase
      .from('properties')
      .update({
        admin_suspended: true,
        status: 'paused',
        admin_suspension_reason: trimmed,
        admin_suspended_by: user.id,
        admin_suspended_at: new Date().toISOString(),
      })
      .eq('id', property.id);
    if (!error) {
      await createLog({
        action: 'property_suspended',
        entityType: 'property',
        entityId: property.id,
        entityLabel: property.title,
        note: trimmed,
      });
    } else {
      console.error('[AdminProperties] suspend error:', error.message);
    }
    setBusyId(null);
  };

  const selectedProperty = selectedId
    ? properties.find((p) => p.id === selectedId) ?? null
    : null;
  const selectedRooms = selectedProperty
    ? rooms.filter((r) => r.propertyId === selectedProperty.id)
    : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Casas e Quartos</h1>
        <p className="text-gray-600">Gerir todas as propriedades e quartos da plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Home, color: 'bg-blue-100 text-blue-600' },
          { label: 'Ativas', value: stats.active, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
          { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
          { label: 'Suspensas', value: stats.suspended, icon: ShieldOff, color: 'bg-red-100 text-red-600' },
          { label: 'Quartos', value: stats.totalRooms, icon: DoorOpen, color: 'bg-purple-100 text-purple-600' },
          { label: 'Disponíveis', value: stats.availableRooms, icon: DoorOpen, color: 'bg-green-100 text-green-600' },
          { label: 'Ocupados', value: stats.occupiedRooms, icon: DoorClosed, color: 'bg-gray-100 text-gray-600' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 min-h-[92px]">
              <div className="flex items-center gap-3 h-full">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-gray-900 leading-none">{stat.value}</p>
                  <p className="text-sm text-gray-600 mt-1 leading-tight break-words">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Procurar por título, endereço ou cidade..."
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              { key: 'all', label: 'Todos' },
              { key: 'active', label: 'Ativos' },
              { key: 'pending', label: 'Pendentes' },
              { key: 'suspended', label: 'Suspensos' },
            ] as const).map((item) => (
              <button
                key={item.key}
                onClick={() => setFilterStatus(item.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === item.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="w-px bg-gray-300" />

            <select
              value={filterCity}
              onChange={(event) => setFilterCity(event.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 cursor-pointer"
            >
              <option value="all">Todas as cidades</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Propriedade</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Senhorio</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Localização</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Quartos</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Preço Min.</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Candidaturas</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredProperties.map((property) => {
                const roomStats = getRoomStats(property.id);
                const minPrice = getMinPrice(property.id);
                const appsCount = applicationsByProperty.get(property.id) ?? 0;
                const displayStatus = getDisplayStatus(property);

                return (
                  <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-3">
                        {property.images && property.images.length > 0 && (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 line-clamp-1">{property.title}</p>
                          <p className="text-sm text-gray-600 line-clamp-1">{property.address}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{getLandlordName(property.landlordId)}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{property.city}</p>
                          <p className="text-xs text-gray-600">{property.zone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {getStatusBadge(property)}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-green-600">
                          <DoorOpen className="w-4 h-4" />
                          <span className="text-sm font-medium">{roomStats.available}</span>
                        </div>
                        <span className="text-gray-400">/</span>
                        <div className="flex items-center gap-1 text-gray-600">
                          <DoorClosed className="w-4 h-4" />
                          <span className="text-sm font-medium">{roomStats.occupied}</span>
                        </div>
                        <span className="text-xs text-gray-500">de {roomStats.total}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-bold text-gray-900">{minPrice}</span>
                        <span className="text-xs text-gray-500">/mês</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{appsCount}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedId(property.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {displayStatus === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busyId === property.id}
                            onClick={() => approveOrReactivate(property)}
                            className="text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhuma propriedade encontrada</p>
          </div>
        )}
      </Card>

      {selectedProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProperty.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{getLandlordName(selectedProperty.landlordId)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedProperty.city}, {selectedProperty.zone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedProperty.createdAt.toLocaleDateString('pt-PT')}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedId(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Estado</span>
                  </div>
                  {getStatusBadge(selectedProperty)}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Candidaturas</span>
                  </div>
                  <p className="font-bold text-gray-900">
                    {applicationsByProperty.get(selectedProperty.id) ?? 0}
                  </p>
                </div>
              </div>

              {selectedProperty.adminSuspended && selectedProperty.adminSuspensionReason && (
                <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-700">Motivo da suspensão</span>
                  </div>
                  <p className="text-sm text-red-700">{selectedProperty.adminSuspensionReason}</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Descrição</h3>
                <p className="text-gray-600">{selectedProperty.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Endereço completo</h3>
                <p className="text-gray-600">{selectedProperty.address}, {selectedProperty.city}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <DoorOpen className="w-5 h-5" />
                  Quartos da propriedade ({selectedRooms.length})
                </h3>

                <div className="space-y-3">
                  {selectedRooms.map((room) => (
                    <div key={room.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{room.title}</h4>
                            <Badge variant={room.status === 'available' ? 'success' : 'outline'}>
                              {room.status === 'available' ? 'Disponível' : 'Indisponível'}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">{room.description}</p>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {room.size && <span>{room.size}m²</span>}
                            <span>•</span>
                            <span className="font-bold text-primary">{room.price}€/mês</span>
                            {room.privateBathroom && (
                              <>
                                <span>•</span>
                                <span>WC privativo</span>
                              </>
                            )}
                          </div>
                        </div>

                        {room.images && room.images.length > 0 && (
                          <img
                            src={room.images[0]}
                            alt={room.title}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  {selectedRooms.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Sem quartos registados.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {getDisplayStatus(selectedProperty) === 'pending' && (
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={busyId === selectedProperty.id}
                    onClick={() => approveOrReactivate(selectedProperty)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar anúncio
                  </Button>
                )}

                {getDisplayStatus(selectedProperty) === 'active' && (
                  <Button
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    disabled={busyId === selectedProperty.id}
                    onClick={() => suspendProperty(selectedProperty)}
                  >
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Suspender
                  </Button>
                )}

                {selectedProperty.adminSuspended && (
                  <Button
                    variant="outline"
                    className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                    disabled={busyId === selectedProperty.id}
                    onClick={() => approveOrReactivate(selectedProperty)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Reativar
                  </Button>
                )}

                <Button variant="outline" onClick={() => setSelectedId(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

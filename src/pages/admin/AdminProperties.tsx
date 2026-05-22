import { useState, useMemo } from 'react';
import {
  Home,
  Search,
  MapPin,
  ShieldCheck,
  DoorOpen,
  DoorClosed,
  Eye,
  CheckCircle,
  X as XIcon,
  Ban,
  Archive,
  AlertTriangle,
  Clock,
  FileText,
  User,
  Calendar,
  Euro
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { getProperties, getRooms, getRoomsByProperty } from '../../data/mockProperties';
import { mockUsers } from '../../data/mockUsers';
import { Property, Room } from '../../types/property';

type AdminStatus = 'active' | 'pending' | 'draft' | 'suspicious' | 'rejected' | 'archived';

interface PropertyWithAdmin extends Property {
  adminStatus: AdminStatus;
  applicationsCount: number;
}

export function AdminProperties() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | AdminStatus>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithAdmin | null>(null);
  const [propertyStatuses, setPropertyStatuses] = useState<Record<string, AdminStatus>>({
    'prop-1': 'pending',
    'prop-2': 'active',
  });

  const properties = useMemo(() => {
    const baseProperties = getProperties();
    const allRooms = getRooms();

    return baseProperties.map((prop): PropertyWithAdmin => {
      const rooms = allRooms.filter(r => r.propertyId === prop.id);

      // Mock applications count (em produção viria da base de dados)
      const applicationsCount = Math.floor(Math.random() * 15);

      return {
        ...prop,
        adminStatus: propertyStatuses[prop.id] || 'pending',
        applicationsCount,
      };
    });
  }, [propertyStatuses]);

  const rooms = getRooms();

  const cities = useMemo(() => {
    const uniqueCities = new Set(properties.map(p => p.city));
    return Array.from(uniqueCities).sort();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearch =
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || property.adminStatus === filterStatus;
      const matchesCity = filterCity === 'all' || property.city === filterCity;

      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [properties, searchQuery, filterStatus, filterCity]);

  const stats = useMemo(() => {
    const propertyRooms = rooms.filter(r => properties.some(p => p.id === r.propertyId));

    return {
      total: properties.length,
      active: properties.filter(p => p.adminStatus === 'active').length,
      pending: properties.filter(p => p.adminStatus === 'pending').length,
      suspicious: properties.filter(p => p.adminStatus === 'suspicious').length,
      totalRooms: propertyRooms.length,
      availableRooms: propertyRooms.filter(r => r.status === 'available').length,
      occupiedRooms: propertyRooms.filter(r => r.status === 'occupied').length,
    };
  }, [properties, rooms]);

  const getLandlordName = (landlordId: string) => {
    const landlord = mockUsers.find(u => u.id === landlordId);
    return landlord?.name || 'Desconhecido';
  };

  const getRoomStats = (propertyId: string) => {
    const propertyRooms = rooms.filter(r => r.propertyId === propertyId);
    return {
      total: propertyRooms.length,
      available: propertyRooms.filter(r => r.status === 'available').length,
      occupied: propertyRooms.filter(r => r.status === 'occupied').length,
    };
  };

  const getMinPrice = (propertyId: string) => {
    const propertyRooms = rooms.filter(r => r.propertyId === propertyId);
    if (propertyRooms.length === 0) return 0;
    return Math.min(...propertyRooms.map(r => r.price));
  };

  const getStatusBadge = (status: AdminStatus) => {
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
      case 'suspicious':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Suspeito
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            <XIcon className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            <Archive className="w-3 h-3 mr-1" />
            Arquivado
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-300">
            Rascunho
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleApprove = (propertyId: string) => {
    setPropertyStatuses(prev => ({ ...prev, [propertyId]: 'active' }));
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(prev => prev ? { ...prev, adminStatus: 'active' } : null);
    }
  };

  const handleReject = (propertyId: string) => {
    setPropertyStatuses(prev => ({ ...prev, [propertyId]: 'rejected' }));
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(prev => prev ? { ...prev, adminStatus: 'rejected' } : null);
    }
  };

  const handleSuspend = (propertyId: string) => {
    setPropertyStatuses(prev => ({ ...prev, [propertyId]: 'suspicious' }));
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(prev => prev ? { ...prev, adminStatus: 'suspicious' } : null);
    }
  };

  const handleArchive = (propertyId: string) => {
    setPropertyStatuses(prev => ({ ...prev, [propertyId]: 'archived' }));
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(prev => prev ? { ...prev, adminStatus: 'archived' } : null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Casas e Quartos</h1>
        <p className="text-gray-600">Gerir todas as propriedades e quartos da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Home className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Ativas</p>
              <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Pendentes</p>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Suspeitas</p>
              <p className="text-xl font-bold text-gray-900">{stats.suspicious}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DoorOpen className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Quartos</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalRooms}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DoorOpen className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Disponíveis</p>
              <p className="text-xl font-bold text-gray-900">{stats.availableRooms}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <DoorClosed className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Ocupados</p>
              <p className="text-xl font-bold text-gray-900">{stats.occupiedRooms}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Procurar por título, endereço ou cidade..."
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'active'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setFilterStatus('suspicious')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'suspicious'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Suspeitos
              </button>
            </div>

            <div className="w-px bg-gray-300"></div>

            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 cursor-pointer"
            >
              <option value="all">Todas as cidades</option>
              {cities.map(city => (
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
                      {getStatusBadge(property.adminStatus)}
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
                        <span className="text-sm font-medium text-gray-900">{property.applicationsCount}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedProperty(property)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {property.adminStatus === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(property.id)}
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
                      <span>{selectedProperty.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
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
                  {getStatusBadge(selectedProperty.adminStatus)}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Candidaturas</span>
                  </div>
                  <p className="font-bold text-gray-900">{selectedProperty.applicationsCount}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Descrição</h3>
                <p className="text-gray-600">{selectedProperty.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Endereço Completo</h3>
                <p className="text-gray-600">{selectedProperty.address}, {selectedProperty.city}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <DoorOpen className="w-5 h-5" />
                  Quartos da Propriedade ({getRoomStats(selectedProperty.id).total})
                </h3>
                <div className="space-y-3">
                  {getRoomsByProperty(selectedProperty.id).map((room) => (
                    <div key={room.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{room.title}</h4>
                            <Badge variant={room.status === 'available' ? 'success' : 'outline'}>
                              {room.status === 'available' ? 'Disponível' : 'Ocupado'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{room.size}m²</span>
                            <span>•</span>
                            <span className="font-bold text-primary">{room.price}€/mês</span>
                            {room.privateBathroom && (
                              <>
                                <span>•</span>
                                <span>WC Privativo</span>
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
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedProperty.adminStatus === 'pending' && (
                  <>
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => {
                        handleApprove(selectedProperty.id);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprovar Anúncio
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        handleReject(selectedProperty.id);
                      }}
                    >
                      <XIcon className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </>
                )}
                {selectedProperty.adminStatus === 'active' && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                      onClick={() => {
                        handleSuspend(selectedProperty.id);
                      }}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Marcar como Suspeito
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                      onClick={() => {
                        handleArchive(selectedProperty.id);
                      }}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Arquivar
                    </Button>
                  </>
                )}
                {(selectedProperty.adminStatus === 'suspicious' || selectedProperty.adminStatus === 'rejected') && (
                  <Button
                    variant="outline"
                    className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                    onClick={() => {
                      handleApprove(selectedProperty.id);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Reativar como Ativo
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedProperty(null)}
                >
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

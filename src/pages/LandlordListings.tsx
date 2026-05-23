import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BedDouble,
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  FileText,
  Filter,
  Home,
  MapPin,
  Pause,
  Play,
  PlusCircle,
  Settings,
  Trash2,
  User,
  Users,
  X,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { Property, PropertyStatus, Room, RoomStatus } from '../types/property';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { toast } from 'sonner';
import { mockUsers } from '../data/mockUsers';

interface EditRoomModalProps {
  room: Room;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Room>) => void;
}

function EditRoomModal({ room, onClose, onSave }: EditRoomModalProps) {
  const [formData, setFormData] = useState({
    title: room.title,
    price: room.price,
    utilities: room.utilities || 0,
    description: room.description,
    roomType: room.roomType,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(room.id, formData);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Editar quarto</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Preço (€ / mês)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(event) => setFormData({ ...formData, price: Number(event.target.value) })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Despesas (€ / mês)</label>
                <input
                  type="number"
                  value={formData.utilities}
                  onChange={(event) => setFormData({ ...formData, utilities: Number(event.target.value) })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tipo de quarto</label>
              <select
                value={formData.roomType}
                onChange={(event) => setFormData({ ...formData, roomType: event.target.value as Room['roomType'] })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="private">Privado</option>
                <option value="shared">Partilhado</option>
                <option value="studio">Estúdio</option>
                <option value="apartment">Apartamento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                Guardar alterações
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

function getPropertyStatusBadge(status: PropertyStatus) {
  const configs = {
    active: { label: 'Ativo', variant: 'success' as const, className: '' },
    paused: { label: 'Pausado', variant: 'warning' as const, className: '' },
    draft: { label: 'Rascunho', variant: 'default' as const, className: 'bg-blue-100 text-blue-700 border-blue-200' },
    archived: { label: 'Arquivado', variant: 'default' as const, className: 'bg-muted text-foreground border-border' },
  };

  return configs[status];
}

function getRoomStatusBadge(room: Room, property: Property) {
  if (property.status === 'paused') {
    return { label: 'Pausado', variant: 'warning' as const, className: '' };
  }

  if (property.status === 'draft') {
    return { label: 'Rascunho', variant: 'default' as const, className: 'bg-blue-100 text-blue-700 border-blue-200' };
  }

  const configs: Record<RoomStatus, { label: string; variant: 'default' | 'success' | 'warning'; className: string }> = {
    available: { label: 'Disponível', variant: 'success', className: '' },
    reserved: { label: 'Reservado', variant: 'warning', className: '' },
    occupied: { label: 'Ocupado', variant: 'default', className: 'bg-muted text-foreground border-border' },
    paused: { label: 'Pausado', variant: 'warning', className: '' },
    draft: { label: 'Rascunho', variant: 'default', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  };

  return configs[room.status];
}

function getStudentName(studentId: string | undefined): string | null {
  if (!studentId) return null;
  const student = mockUsers.find(u => u.id === studentId);
  return student?.name || null;
}

export function LandlordListings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    rooms,
    properties,
    updatePropertyStatus,
    updateProperty,
    deleteProperty,
    updateRoom,
    updateRoomStatus,
  } = useProperties();

  const [filter, setFilter] = useState<'all' | PropertyStatus>('all');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [pausingPropertyId, setPausingPropertyId] = useState<string | null>(null);
  const [archivingPropertyId, setArchivingPropertyId] = useState<string | null>(null);

  if (user?.type !== 'landlord') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Acesso restrito</h2>
          <p className="text-muted-foreground mb-6">
            Esta página é apenas para senhorios. Por favor, inicia sessão com uma conta de senhorio.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const landlordProperties = properties.filter(property => property.landlordId === user.id);

  const groupedProperties = landlordProperties.map(property => ({
    property,
    propertyRooms: rooms.filter(room => room.propertyId === property.id),
  }));

  const filteredProperties = filter === 'all'
    ? groupedProperties
    : groupedProperties.filter(group => group.property.status === filter);

  const counts = {
    all: groupedProperties.length,
    active: groupedProperties.filter(group => group.property.status === 'active').length,
    paused: groupedProperties.filter(group => group.property.status === 'paused').length,
    draft: groupedProperties.filter(group => group.property.status === 'draft').length,
    archived: groupedProperties.filter(group => group.property.status === 'archived').length,
  };

  const filterButtons = [
    { key: 'all' as const, label: 'Todas', count: counts.all },
    { key: 'active' as const, label: 'Ativas', count: counts.active },
    { key: 'paused' as const, label: 'Pausadas', count: counts.paused },
    { key: 'draft' as const, label: 'Rascunhos', count: counts.draft },
    { key: 'archived' as const, label: 'Arquivadas', count: counts.archived },
  ];

  const handlePauseProperty = (propertyId: string) => {
    updatePropertyStatus(propertyId, 'paused');
    toast.success('Alojamento pausado com sucesso');
    setPausingPropertyId(null);
  };

  const handleReactivateProperty = (propertyId: string) => {
    updatePropertyStatus(propertyId, 'active');
    toast.success('Alojamento reativado com sucesso');
  };

  const handlePublishProperty = (propertyId: string) => {
    const propertyRooms = rooms.filter(r => r.propertyId === propertyId);
    const draftCount = propertyRooms.filter(r => r.status === 'draft').length;
    updatePropertyStatus(propertyId, 'active');
    propertyRooms.forEach(room => {
      if (room.status === 'draft') updateRoomStatus(room.id, 'available');
    });
    toast.success(draftCount > 0
      ? `Alojamento publicado com ${draftCount} quarto${draftCount > 1 ? 's' : ''} disponíve${draftCount > 1 ? 'is' : 'l'}`
      : 'Alojamento reativado com sucesso',
    );
  };

  const handlePublishDraftRoom = (room: Room, property: Property) => {
    // If the parent property is also draft, activate it together
    if (property.status === 'draft') {
      updatePropertyStatus(property.id, 'active');
    }
    updateRoomStatus(room.id, 'available');
    toast.success(
      property.status === 'draft'
        ? `Quarto publicado. O alojamento "${property.title}" também foi ativado.`
        : `Quarto "${room.title}" publicado com sucesso.`,
    );
  };

  const handleArchiveProperty = (propertyId: string) => {
    deleteProperty(propertyId);
    toast.success('Alojamento arquivado');
    setArchivingPropertyId(null);
  };

  const handleEditProperty = (property: Property) => {
    navigate(`/landlord/property/${property.id}`);
  };

  const handleSaveRoomEdit = (id: string, updates: Partial<Room>) => {
    updateRoom(id, updates);
    toast.success('Quarto atualizado com sucesso');
    setEditingRoom(null);
  };

  const handlePauseRoom = (room: Room) => {
    updateRoomStatus(room.id, 'paused');
    toast.success('Quarto pausado com sucesso');
  };

  const handleReactivateRoom = (room: Room) => {
    updateRoomStatus(room.id, 'available');
    toast.success('Quarto reativado com sucesso');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Os Meus Alojamentos
            </h1>
            <p className="text-muted-foreground">
              Gere os teus alojamentos e os quartos associados a cada um
            </p>
          </div>

          <Button onClick={() => navigate('/landlord/new-listing')} size="lg">
            <PlusCircle className="w-5 h-5 mr-2" />
            Novo Alojamento
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2">
          <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          {filterButtons.map(item => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filter === item.key
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card text-foreground hover:bg-muted border border-border'
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        {filteredProperties.length === 0 ? (
          <Card className="p-16 text-center">
            {filter === 'all' ? (
              <>
                <Home className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Ainda não tens alojamentos</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Cria o primeiro alojamento para começares a receber candidaturas de estudantes.
                </p>
                <Button onClick={() => navigate('/landlord/new-listing')}>
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Criar primeiro alojamento
                </Button>
              </>
            ) : filter === 'active' ? (
              <>
                <CheckCircle className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Sem alojamentos ativos</h3>
                <p className="text-muted-foreground text-sm mb-6">Publica um rascunho ou cria um novo alojamento para aparecer na pesquisa.</p>
                <Button variant="outline" onClick={() => setFilter('draft')}>Ver rascunhos</Button>
              </>
            ) : filter === 'draft' ? (
              <>
                <FileText className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Sem rascunhos</h3>
                <p className="text-muted-foreground text-sm mb-6">Todos os alojamentos estão publicados ou arquivados.</p>
                <Button variant="outline" onClick={() => setFilter('all')}>Ver todos</Button>
              </>
            ) : filter === 'paused' ? (
              <>
                <AlertCircle className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Sem alojamentos pausados</h3>
                <p className="text-muted-foreground text-sm mb-6">Não tens nenhum alojamento pausado neste momento.</p>
                <Button variant="outline" onClick={() => setFilter('all')}>Ver todos</Button>
              </>
            ) : (
              <>
                <Archive className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Sem alojamentos arquivados</h3>
                <p className="text-muted-foreground text-sm mb-6">Alojamentos arquivados ficam aqui preservados para consulta.</p>
                <Button variant="outline" onClick={() => setFilter('all')}>Ver todos</Button>
              </>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredProperties.map(({ property, propertyRooms }) => {
              const statusBadge = getPropertyStatusBadge(property.status);
              const availableRooms = propertyRooms.filter(room => room.status === 'available').length;
              const occupiedRooms = propertyRooms.filter(room => room.status === 'occupied' || room.status === 'reserved').length;
              const minPrice = Math.min(...propertyRooms.map(room => room.price));
              const pendingApplications = propertyRooms.reduce(
                (total, room) => total + (room.status === 'available' ? 1 : 0),
                0,
              );

              return (
                <Card key={property.id} className="overflow-hidden border-border">
                  <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
                    <div className="relative h-64 lg:h-full min-h-[260px] bg-muted">
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute top-4 left-4">
                        <Badge variant={statusBadge.variant} className={`${statusBadge.className} bg-white/95 shadow-sm`}>
                          {statusBadge.label}
                        </Badge>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="rounded-xl bg-white/95 backdrop-blur-sm p-3 shadow-lg">
                          <p className="text-xs text-muted-foreground">Preço desde</p>
                          <p className="text-2xl font-bold text-primary">
                            €{minPrice}
                            <span className="text-sm font-normal text-muted-foreground">/mês</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-6">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-primary font-semibold mb-2">
                            <Home className="w-4 h-4" />
                            Alojamento
                          </div>

                          <h2 className="text-2xl font-bold text-foreground mb-2">{property.title}</h2>

                          <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 text-primary" />
                            {property.zone}, {property.city}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0 xl:min-w-[520px]">
                          <div className="rounded-xl bg-muted/60 p-3">
                            <BedDouble className="w-4 h-4 text-primary mb-2" />
                            <p className="text-xl font-bold text-foreground">{propertyRooms.length}</p>
                            <p className="text-xs text-muted-foreground">quartos</p>
                          </div>

                          <div className="rounded-xl bg-secondary/10 p-3">
                            <CheckCircle className="w-4 h-4 text-secondary mb-2" />
                            <p className="text-xl font-bold text-foreground">{availableRooms}</p>
                            <p className="text-xs text-muted-foreground">disponíveis</p>
                          </div>

                          <div className="rounded-xl bg-accent/10 p-3">
                            <Users className="w-4 h-4 text-accent mb-2" />
                            <p className="text-xl font-bold text-foreground">{occupiedRooms}</p>
                            <p className="text-xs text-muted-foreground">ocupados</p>
                          </div>

                          <div className="rounded-xl bg-primary/10 p-3">
                            <FileText className="w-4 h-4 text-primary mb-2" />
                            <p className="text-xl font-bold text-foreground">{pendingApplications}</p>
                            <p className="text-xs text-muted-foreground">pendentes</p>
                          </div>
                        </div>
                      </div>

                      {/* Draft property banner */}
                      {property.status === 'draft' && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-blue-800 mb-0.5">Alojamento em rascunho</p>
                            <p className="text-xs text-blue-700">
                              Nada é visível para estudantes. Publica tudo de uma vez ou usa "Publicar *" em cada quarto — o alojamento também será ativado automaticamente.
                            </p>
                          </div>
                          {propertyRooms.length > 0 && (
                            <Button variant="primary" size="sm" onClick={() => handlePublishProperty(property.id)}>
                              <Play className="w-4 h-4 mr-1" />
                              Publicar tudo
                            </Button>
                          )}
                        </div>
                      )}

                      {/* No visible rooms warning — active property with no available rooms */}
                      {property.status === 'active' && propertyRooms.length > 0 && availableRooms === 0 && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800">Sem quartos visíveis</p>
                            <p className="text-xs text-amber-700">
                              Este alojamento está ativo mas não tem quartos disponíveis para estudantes. Publica ou reativa um quarto.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 mb-6">
                        {propertyRooms.length > 0 && (
                          <Button variant="outline" size="sm" onClick={() => navigate(`/room/${propertyRooms[0].id}`)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Ver anúncio
                          </Button>
                        )}

                        <Button variant="outline" size="sm" onClick={() => handleEditProperty(property)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => navigate(`/landlord/property/${property.id}`)}>
                          <Settings className="w-4 h-4 mr-1" />
                          Gerir quartos
                        </Button>

                        {property.status === 'active' && (
                          <Button variant="outline" size="sm" onClick={() => setPausingPropertyId(property.id)}>
                            <Pause className="w-4 h-4 mr-1" />
                            Pausar
                          </Button>
                        )}

                        {property.status === 'paused' && (
                          <Button variant="primary" size="sm" onClick={() => handleReactivateProperty(property.id)}>
                            <Play className="w-4 h-4 mr-1" />
                            Reativar
                          </Button>
                        )}

                        <Button variant="outline" size="sm" onClick={() => navigate(`/landlord/applications?listing=${property.id}`)}>
                          <FileText className="w-4 h-4 mr-1" />
                          Candidaturas
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 border-destructive/30"
                          onClick={() => setArchivingPropertyId(property.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Arquivar
                        </Button>
                      </div>

                      {propertyRooms.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border p-8 text-center">
                          <BedDouble className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm font-medium text-foreground mb-1">Sem quartos ainda</p>
                          <p className="text-xs text-muted-foreground mb-4">Adiciona quartos a este alojamento para receber candidaturas.</p>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/landlord/property/${property.id}`)}>
                            <PlusCircle className="w-4 h-4 mr-1.5" />
                            Adicionar quarto
                          </Button>
                        </div>
                      ) : (
                      <div className="rounded-xl border border-border overflow-hidden">
                        <div className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[1fr_110px_120px_220px] gap-3 px-4 py-3 bg-muted/60 text-xs font-semibold text-muted-foreground">
                          <span>Quarto</span>
                          <span>Preço</span>
                          <span className="hidden md:block">Estado</span>
                          <span className="text-right">Ações</span>
                        </div>

                        <div className="divide-y divide-border">
                          {propertyRooms.map(room => {
                            const roomBadge = getRoomStatusBadge(room, property);
                            const canPauseRoom = room.status === 'available' && property.status === 'active';
                            const canReactivateRoom = room.status === 'paused' && property.status === 'active';

                            const studentId = room.status === 'reserved' ? room.reservedBy : room.status === 'occupied' ? room.occupiedBy : undefined;
                            const studentName = getStudentName(studentId);

                            return (
                              <div
                                key={room.id}
                                className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[1fr_110px_120px_220px] gap-3 items-center px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground line-clamp-1">{room.title}</p>
                                  <p className="text-xs text-muted-foreground">{room.roomNumber}</p>

                                  {studentName && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                                      <User className="w-3 h-3 text-primary" />
                                      <span className="text-foreground font-medium">
                                        {room.status === 'reserved' ? 'Reservado por' : 'Ocupado por'} {studentName}
                                      </span>
                                    </div>
                                  )}

                                  {room.moveInDate && (
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        Entrada: {new Date(room.moveInDate).toLocaleDateString('pt-PT', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <p className="font-bold text-primary">€{room.price}</p>

                                <div className="hidden md:block">
                                  <Badge variant={roomBadge.variant} className={roomBadge.className}>
                                    {roomBadge.label}
                                  </Badge>
                                </div>

                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => navigate(`/room/${room.id}`)}
                                    className="w-9 h-9 rounded-lg border border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-colors"
                                    title="Ver quarto"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => setEditingRoom(room)}
                                    className="w-9 h-9 rounded-lg border border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-colors"
                                    title="Editar quarto"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  {room.status === 'draft' && (
                                    <button
                                      onClick={() => handlePublishDraftRoom(room, property)}
                                      className="flex items-center gap-1 px-2.5 h-9 rounded-lg bg-green-50 border border-green-300 hover:bg-green-100 text-green-700 transition-colors text-xs font-medium"
                                      title={property.status === 'draft' ? 'Publicar quarto (ativa o alojamento)' : 'Publicar quarto'}
                                    >
                                      <Play className="w-3.5 h-3.5" />
                                      Publicar{property.status === 'draft' ? ' *' : ''}
                                    </button>
                                  )}

                                  {canPauseRoom && (
                                    <button
                                      onClick={() => handlePauseRoom(room)}
                                      className="w-9 h-9 rounded-lg border border-border hover:border-accent hover:bg-accent/10 flex items-center justify-center transition-colors"
                                      title="Pausar quarto"
                                    >
                                      <Pause className="w-4 h-4" />
                                    </button>
                                  )}

                                  {canReactivateRoom && (
                                    <button
                                      onClick={() => handleReactivateRoom(room)}
                                      className="w-9 h-9 rounded-lg border border-border hover:border-secondary hover:bg-secondary/10 flex items-center justify-center transition-colors"
                                      title="Reativar quarto"
                                    >
                                      <Play className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {editingRoom && (
        <EditRoomModal
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onSave={handleSaveRoomEdit}
        />
      )}

      {pausingPropertyId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setPausingPropertyId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Pausar alojamento?</h3>
              <p className="text-muted-foreground mb-6">
                Este alojamento e os respetivos quartos deixam de aparecer na pesquisa até voltares a reativar.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setPausingPropertyId(null)}>
                  Cancelar
                </Button>

                <Button variant="primary" className="flex-1" onClick={() => handlePauseProperty(pausingPropertyId)}>
                  Pausar
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}

      {archivingPropertyId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setArchivingPropertyId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4 text-destructive">Arquivar alojamento?</h3>
              <p className="text-muted-foreground mb-6">
                O alojamento será removido da pesquisa, mas o histórico fica preservado.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setArchivingPropertyId(null)}>
                  Cancelar
                </Button>

                <Button
                  variant="primary"
                  className="flex-1 bg-destructive hover:bg-destructive/90"
                  onClick={() => handleArchiveProperty(archivingPropertyId)}
                >
                  Arquivar
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
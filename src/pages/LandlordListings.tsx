import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
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
  ShieldOff,
  Ban,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { Property, PropertyStatus, Room, RoomStatus } from '../types/property';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';
import { toast } from 'sonner';
import { mockUsers } from '../data/mockUsers';
import { useLandlordApplications } from '../hooks/useDb';
import { isUserSuspended, isUserBlockedFromPublishing } from '../data/mockAdminUsersState';

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

function getPropertyStatusBadge(property: Property) {
  if (property.adminSuspended) {
    return { label: 'Suspenso pelo Admin', variant: 'default' as const, className: 'bg-red-100 text-red-700 border-red-300' };
  }
  const configs = {
    active: { label: 'Ativo', variant: 'success' as const, className: '' },
    paused: { label: 'Pausado pelo Senhorio', variant: 'warning' as const, className: '' },
    draft: { label: 'Rascunho', variant: 'default' as const, className: 'bg-blue-100 text-blue-700 border-blue-200' },
    archived: { label: 'Arquivado', variant: 'default' as const, className: 'bg-muted text-foreground border-border' },
  };
  return configs[property.status];
}

function getRoomStatusBadge(room: Room, property: Property) {
  if (property.adminSuspended) {
    return { label: 'Suspenso', variant: 'default' as const, className: 'bg-red-100 text-red-700 border-red-200' };
  }
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
    refreshProperties,
  } = useProperties();

  const location = useLocation();
  const refreshSignal = (location.state as { refresh?: number } | null)?.refresh;

  useEffect(() => {
    void refreshProperties();
  }, [refreshProperties, refreshSignal]);

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

  const isAccountSuspended = isUserSuspended(user.id);
  const isBlockedFromPublishing = isUserBlockedFromPublishing(user.id);

  const { applications: landlordApplications } = useLandlordApplications(user.id);

  const landlordProperties = properties.filter(property => property.landlordId === user.id);

  const groupedProperties = landlordProperties.map(property => ({
    property,
    propertyRooms: rooms.filter(room => room.propertyId === property.id),
  }));

  const visibleGroups = groupedProperties.filter(
    group => group.property.status !== 'archived',
  );

  const filteredProperties = filter === 'all'
    ? visibleGroups
    : groupedProperties.filter(group => group.property.status === filter);

  const counts = {
    all: visibleGroups.length,
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

  const handleReactivateProperty = (property: Property) => {
    if (property.adminSuspended) {
      toast.error('Este alojamento foi suspenso pela equipa UniRoom. Contacta o suporte para resolver.');
      return;
    }
    if (isAccountSuspended) {
      toast.error('A tua conta está suspensa. Não é possível reativar alojamentos.');
      return;
    }
    updatePropertyStatus(property.id, 'active');
    toast.success('Alojamento reativado com sucesso');
  };

  const handlePublishProperty = (property: Property) => {
    if (property.adminSuspended) {
      toast.error('Este alojamento foi suspenso pela equipa UniRoom. Contacta o suporte para resolver.');
      return;
    }
    if (isAccountSuspended || isBlockedFromPublishing) {
      toast.error('A tua conta está restringida. Não é possível publicar alojamentos.');
      return;
    }
    const propertyRooms = rooms.filter(r => r.propertyId === property.id);
    const draftCount = propertyRooms.filter(r => r.status === 'draft').length;
    updatePropertyStatus(property.id, 'active');
    propertyRooms.forEach(room => {
      if (room.status === 'draft') updateRoomStatus(room.id, 'available');
    });
    toast.success(draftCount > 0
      ? `Alojamento publicado com ${draftCount} quarto${draftCount > 1 ? 's' : ''} disponíve${draftCount > 1 ? 'is' : 'l'}`
      : 'Alojamento reativado com sucesso',
    );
  };

  const handlePublishDraftRoom = (room: Room, property: Property) => {
    if (property.adminSuspended) {
      toast.error('Este alojamento foi suspenso pela equipa UniRoom. Contacta o suporte para resolver.');
      return;
    }
    if (isAccountSuspended || isBlockedFromPublishing) {
      toast.error('A tua conta está restringida. Não é possível publicar quartos.');
      return;
    }
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

  const handleArchiveProperty = async (propertyId: string) => {
    setArchivingPropertyId(null);
    try {
      await deleteProperty(propertyId);
      toast.success('Alojamento arquivado');
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : 'Não foi possível arquivar o alojamento.';
      toast.error('Falha ao arquivar', { description: message });
    }
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

  const handleReactivateRoom = (room: Room, property: Property) => {
    if (property.adminSuspended) {
      toast.error('Este alojamento foi suspenso pela equipa UniRoom. Não é possível reativar quartos.');
      return;
    }
    updateRoomStatus(room.id, 'available');
    toast.success('Quarto reativado com sucesso');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Os Meus Alojamentos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gere os teus alojamentos e os quartos associados a cada um
            </p>
          </div>
          <Button
            onClick={() => navigate('/landlord/new-listing')}
            disabled={isAccountSuspended || isBlockedFromPublishing}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo alojamento
          </Button>
        </div>

        {/* ── Account banners ───────────────────────────────────────── */}
        {isAccountSuspended && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Ban className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-800 text-sm">Conta suspensa temporariamente</p>
              <p className="text-xs text-red-700 mt-0.5">
                Não podes publicar, reativar ou criar novos alojamentos. Contacta o suporte em <span className="font-medium">suporte@uniroom.pt</span>.
              </p>
            </div>
          </div>
        )}
        {!isAccountSuspended && isBlockedFromPublishing && (
          <div className="mb-5 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldOff className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-orange-800 text-sm">Publicação de novos anúncios bloqueada</p>
              <p className="text-xs text-orange-700 mt-0.5">
                Podes consultar dados e responder a candidaturas. Contacta o suporte em <span className="font-medium">suporte@uniroom.pt</span>.
              </p>
            </div>
          </div>
        )}

        {/* ── Filters ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {filterButtons.map(item => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === item.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
            >
              {item.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                filter === item.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Empty states ─────────────────────────────────────────── */}
        {filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            {filter === 'all' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Home className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Ainda não tens alojamentos</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                  {isAccountSuspended ? 'A tua conta está suspensa.'
                    : isBlockedFromPublishing ? 'A tua conta está bloqueada de publicar.'
                    : 'Cria o primeiro alojamento para receber candidaturas.'}
                </p>
                <Button onClick={() => navigate('/landlord/new-listing')} disabled={isAccountSuspended || isBlockedFromPublishing}>
                  <PlusCircle className="w-4 h-4 mr-2" />Criar primeiro alojamento
                </Button>
              </>
            ) : filter === 'active' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Sem alojamentos ativos</h3>
                <p className="text-sm text-muted-foreground mb-5">Publica um rascunho para aparecer na pesquisa.</p>
                <Button variant="outline" onClick={() => setFilter('draft')}>Ver rascunhos</Button>
              </>
            ) : filter === 'draft' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Sem rascunhos</h3>
                <p className="text-sm text-muted-foreground mb-5">Todos os alojamentos estão publicados ou arquivados.</p>
                <Button variant="outline" onClick={() => setFilter('all')}>Ver todos</Button>
              </>
            ) : filter === 'paused' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Sem alojamentos pausados</h3>
                <p className="text-sm text-muted-foreground mb-5">Nenhum alojamento pausado neste momento.</p>
                <Button variant="outline" onClick={() => setFilter('all')}>Ver todos</Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Archive className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Sem alojamentos arquivados</h3>
                <p className="text-sm text-muted-foreground mb-5">Arquivados ficam aqui preservados para consulta.</p>
                <Button variant="outline" onClick={() => setFilter('all')}>Ver todos</Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredProperties.map(({ property, propertyRooms }) => {
              const statusBadge = getPropertyStatusBadge(property);
              const availableRooms = propertyRooms.filter(room => room.status === 'available').length;
              const occupiedRooms = propertyRooms.filter(room => room.status === 'occupied' || room.status === 'reserved').length;
              const minPrice = propertyRooms.length > 0
                ? Math.min(...propertyRooms.map(room => room.price))
                : null;
              const propertyApps = landlordApplications.filter(app => app.propertyId === property.id);
              const pendingCount = propertyApps.filter(a => a.status === 'pending').length;
              const underReviewCount = propertyApps.filter(a => a.status === 'under_review').length;
              const acceptedCount = propertyApps.filter(a => a.status === 'accepted').length;
              const rejectedCount = propertyApps.filter(a => a.status === 'rejected').length;

              return (
                <div key={property.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

                  {/* ── Card top: image + header ─────────────────── */}
                  <div className="flex flex-col md:flex-row">

                    {/* Image panel */}
                    <div className="relative md:w-56 lg:w-64 h-48 md:h-auto flex-shrink-0 bg-muted">
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Dark gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {/* Status badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm border ${
                          property.adminSuspended
                            ? 'bg-red-100/90 text-red-700 border-red-200'
                            : property.status === 'active'
                            ? 'bg-green-100/90 text-green-700 border-green-200'
                            : property.status === 'draft'
                            ? 'bg-blue-100/90 text-blue-700 border-blue-200'
                            : property.status === 'paused'
                            ? 'bg-amber-100/90 text-amber-700 border-amber-200'
                            : 'bg-white/90 text-muted-foreground border-border'
                        }`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Price pill */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="inline-flex items-baseline gap-1 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
                          {minPrice !== null ? (
                            <>
                              <span className="text-xs text-muted-foreground">desde</span>
                              <span className="text-lg font-bold text-primary">€{minPrice}</span>
                              <span className="text-xs text-muted-foreground">/mês</span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground font-medium">Sem quartos</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Header info */}
                    <div className="flex-1 min-w-0 p-5 pb-0 md:pb-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-lg font-bold text-foreground leading-tight mb-1">{property.title}</h2>
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            {property.zone}, {property.city}
                          </p>
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {[
                            { icon: BedDouble, value: propertyRooms.length, label: 'quartos', color: 'text-primary', bg: 'bg-primary/8' },
                            { icon: CheckCircle, value: availableRooms, label: 'livres', color: 'text-green-600', bg: 'bg-green-50' },
                            { icon: Users, value: occupiedRooms, label: 'ocupados', color: 'text-blue-600', bg: 'bg-blue-50' },
                            {
                              icon: FileText,
                              value: pendingCount + underReviewCount,
                              label: acceptedCount > 0 ? `${acceptedCount} aceites` : pendingCount > 0 ? 'pendentes' : underReviewCount > 0 ? 'análise' : 'candidat.',
                              color: (pendingCount + underReviewCount) > 0 ? 'text-amber-600' : 'text-muted-foreground',
                              bg: (pendingCount + underReviewCount) > 0 ? 'bg-amber-50' : 'bg-muted/60',
                            },
                          ].map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                              <div key={i} className={`flex flex-col items-center px-3 py-2 rounded-xl ${stat.bg} min-w-[52px]`}>
                                <Icon className={`w-3.5 h-3.5 ${stat.color} mb-0.5`} />
                                <span className={`text-base font-bold ${stat.color} leading-none`}>{stat.value}</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">{stat.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ── Action buttons ───────────────────────── */}
                      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                        {/* Primary actions */}
                        {propertyRooms.length > 0 && (
                          <button
                            onClick={() => navigate(`/room/${propertyRooms[0].id}`)}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />Ver anúncio
                          </button>
                        )}
                        <button
                          onClick={() => handleEditProperty(property)}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />Editar
                        </button>
                        <button
                          onClick={() => navigate(`/landlord/property/${property.id}`)}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5" />Gerir quartos
                        </button>
                        <button
                          onClick={() => navigate(`/landlord/applications?listing=${property.id}`)}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />Candidaturas
                          {(pendingCount + underReviewCount) > 0 && (
                            <span className="ml-0.5 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                              {pendingCount + underReviewCount}
                            </span>
                          )}
                        </button>

                        {/* State toggles */}
                        {property.status === 'active' && !property.adminSuspended && (
                          <button
                            onClick={() => setPausingPropertyId(property.id)}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-medium text-amber-700 transition-colors"
                          >
                            <Pause className="w-3.5 h-3.5" />Pausar
                          </button>
                        )}
                        {property.status === 'paused' && !property.adminSuspended && !isAccountSuspended && (
                          <button
                            onClick={() => handleReactivateProperty(property)}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-xs font-medium text-green-700 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />Reativar
                          </button>
                        )}

                        {/* Danger */}
                        <button
                          onClick={() => setArchivingPropertyId(property.id)}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-100 hover:bg-red-50 hover:border-red-200 text-xs font-medium text-red-500 transition-colors ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />Arquivar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Banners ──────────────────────────────────── */}
                  <div className="px-5 py-3 space-y-2.5">
                    {property.adminSuspended && (
                      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <ShieldOff className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-800">Suspenso pela equipa UniRoom</p>
                          <p className="text-xs text-red-700 mt-0.5">
                            {property.adminSuspensionReason || 'Este anúncio foi suspenso.'} Contacta <span className="font-medium">suporte@uniroom.pt</span>.
                          </p>
                        </div>
                      </div>
                    )}
                    {property.status === 'draft' && !property.adminSuspended && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-blue-800">Alojamento em rascunho</p>
                          <p className="text-xs text-blue-700 mt-0.5">
                            Nada é visível para estudantes. Publica tudo de uma vez ou usa "Publicar *" em cada quarto.
                          </p>
                        </div>
                        {propertyRooms.length > 0 && !isAccountSuspended && !isBlockedFromPublishing && (
                          <button
                            onClick={() => handlePublishProperty(property)}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex-shrink-0"
                          >
                            <Play className="w-3.5 h-3.5" />Publicar tudo
                          </button>
                        )}
                      </div>
                    )}
                    {property.status === 'active' && propertyRooms.length > 0 && availableRooms === 0 && (
                      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Sem quartos visíveis</p>
                          <p className="text-xs text-amber-700 mt-0.5">Alojamento ativo mas sem quartos disponíveis para estudantes.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Rooms table ──────────────────────────────── */}
                  <div className="p-5 pt-4">
                    {propertyRooms.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-xl text-center">
                        <BedDouble className="w-7 h-7 text-muted-foreground/30 mb-2" />
                        <p className="text-sm font-medium text-foreground mb-0.5">Sem quartos ainda</p>
                        <p className="text-xs text-muted-foreground mb-3">Adiciona quartos para receber candidaturas.</p>
                        <button
                          onClick={() => navigate(`/landlord/property/${property.id}`)}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border hover:bg-muted text-xs font-medium text-foreground transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />Adicionar quarto
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-border overflow-hidden">

                        {/* Table header — 4 cols: Quarto | Preço | Estado | Ações */}
                        <div className="grid grid-cols-[1fr_80px_110px_136px] items-center pl-5 pr-4 py-3 bg-muted/60 border-b border-border gap-4">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quarto</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Preço</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estado</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Ações</span>
                        </div>

                        <div className="divide-y divide-border/60">
                          {propertyRooms.map(room => {
                            const roomBadge = getRoomStatusBadge(room, property);
                            const canPauseRoom = room.status === 'available' && property.status === 'active' && !property.adminSuspended;
                            const canReactivateRoom = room.status === 'paused' && property.status === 'active' && !property.adminSuspended && !isAccountSuspended;
                            const studentId = room.status === 'reserved' ? room.reservedBy : room.status === 'occupied' ? room.occupiedBy : undefined;
                            const studentName = getStudentName(studentId);

                            const rowBg =
                              room.status === 'available' ? 'bg-green-50/40 hover:bg-green-50/70' :
                              room.status === 'occupied'  ? 'bg-blue-50/30 hover:bg-blue-50/60' :
                              room.status === 'reserved'  ? 'bg-amber-50/40 hover:bg-amber-50/70' :
                              room.status === 'paused'    ? 'bg-orange-50/30 hover:bg-orange-50/60' :
                              room.status === 'draft'     ? 'bg-sky-50/30 hover:bg-sky-50/60' :
                              'hover:bg-muted/30';

                            const accentBar =
                              room.status === 'available' ? 'bg-green-400' :
                              room.status === 'occupied'  ? 'bg-blue-400' :
                              room.status === 'reserved'  ? 'bg-amber-400' :
                              room.status === 'paused'    ? 'bg-orange-300' :
                              room.status === 'draft'     ? 'bg-sky-300' :
                              'bg-border';

                            const badgeCls =
                              roomBadge.variant === 'success' ? 'bg-green-100 text-green-700 border-green-200' :
                              roomBadge.variant === 'warning' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              roomBadge.className           || 'bg-muted text-foreground border-border';

                            return (
                              <div
                                key={room.id}
                                className={`relative grid grid-cols-[1fr_80px_110px_136px] items-center gap-4 pl-5 pr-4 py-4 transition-colors ${rowBg}`}
                              >
                                {/* Accent bar */}
                                <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${accentBar}`} />

                                {/* Col 1 — Room info */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <span className="font-semibold text-foreground text-sm leading-snug">{room.title}</span>
                                    <span className="text-[10px] text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded-md font-mono leading-none">{room.roomNumber}</span>
                                  </div>

                                  {studentName && (
                                    <div className="flex items-center gap-1 text-xs mt-1">
                                      <User className="w-3 h-3 text-primary flex-shrink-0" />
                                      <span className="text-foreground font-medium">
                                        {room.status === 'reserved' ? 'Reservado por' : 'Ocupado por'} {studentName}
                                      </span>
                                    </div>
                                  )}

                                  {room.moveInDate && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                      <Calendar className="w-3 h-3 flex-shrink-0" />
                                      <span>Entrada: {new Date(room.moveInDate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                  )}

                                  {(() => {
                                    const avDate = new Date(room.availableFrom);
                                    const now = new Date();
                                    const diffDays = Math.ceil((avDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                    const monthLabel = avDate.toLocaleDateString('pt-PT', { month: 'long' });
                                    if (room.status === 'occupied' && diffDays > 0 && diffDays <= 60) {
                                      return (
                                        <div className="mt-1 flex flex-col gap-0.5">
                                          <span className="flex items-center gap-1 text-xs text-amber-700 font-medium">
                                            <Calendar className="w-3 h-3" />
                                            Este quarto fica livre em {monthLabel}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground pl-4">Podes preparar a republicação</span>
                                        </div>
                                      );
                                    }
                                    if (room.status === 'occupied' && diffDays > 0 && diffDays <= 30) {
                                      return (
                                        <span className="mt-1 flex items-center gap-1 text-[10px] text-blue-600">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                                          Lembrete ativo 30 dias antes
                                        </span>
                                      );
                                    }
                                    if (room.status === 'available' && diffDays <= 0) {
                                      return (
                                        <span className="mt-1 flex items-center gap-1 text-xs text-green-700 font-medium">
                                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                          Disponível já — pronto para novo inquilino
                                        </span>
                                      );
                                    }
                                    if (room.status === 'available' && diffDays > 0) {
                                      return (
                                        <span className="mt-1 flex items-center gap-1 text-xs text-green-700">
                                          <Calendar className="w-3 h-3" />
                                          Livre a partir de {monthLabel}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>

                                {/* Col 2 — Price */}
                                <div className="flex flex-col">
                                  <span className="font-bold text-primary text-sm tabular-nums">€{room.price}</span>
                                  <span className="text-[10px] text-muted-foreground">/mês</span>
                                </div>

                                {/* Col 3 — Status badge */}
                                <div>
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeCls}`}>
                                    {roomBadge.label}
                                  </span>
                                </div>

                                {/* Col 4 — Actions */}
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => navigate(`/room/${room.id}`)}
                                    className="group w-8 h-8 rounded-lg border border-border bg-background hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-colors"
                                    title="Ver quarto"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </button>
                                  <button
                                    onClick={() => setEditingRoom(room)}
                                    className="group w-8 h-8 rounded-lg border border-border bg-background hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-colors"
                                    title="Editar quarto"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </button>

                                  {room.status === 'draft' && !property.adminSuspended && !isAccountSuspended && !isBlockedFromPublishing && (
                                    <button
                                      onClick={() => handlePublishDraftRoom(room, property)}
                                      className="flex items-center gap-1 px-2.5 h-8 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors shadow-sm"
                                      title={property.status === 'draft' ? 'Publicar quarto (ativa o alojamento)' : 'Publicar quarto'}
                                    >
                                      <Play className="w-3 h-3" />
                                      Publicar{property.status === 'draft' ? ' *' : ''}
                                    </button>
                                  )}
                                  {canPauseRoom && (
                                    <button
                                      onClick={() => handlePauseRoom(room)}
                                      className="group w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                      title="Pausar quarto"
                                    >
                                      <Pause className="w-3.5 h-3.5 text-amber-500" />
                                    </button>
                                  )}
                                  {canReactivateRoom && (
                                    <button
                                      onClick={() => handleReactivateRoom(room, property)}
                                      className="group w-8 h-8 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                                      title="Reativar quarto"
                                    >
                                      <Play className="w-3.5 h-3.5 text-green-600" />
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

      <ConfirmModal
        isOpen={!!pausingPropertyId}
        onClose={() => setPausingPropertyId(null)}
        onConfirm={() => pausingPropertyId && handlePauseProperty(pausingPropertyId)}
        title="Pausar alojamento?"
        description="Este alojamento e os respetivos quartos deixam de aparecer na pesquisa até voltares a reativar."
        cancelLabel="Cancelar"
        confirmLabel="Pausar alojamento"
        variant="neutral"
      />

      <ConfirmModal
        isOpen={!!archivingPropertyId}
        onClose={() => setArchivingPropertyId(null)}
        onConfirm={() => archivingPropertyId && handleArchiveProperty(archivingPropertyId)}
        title="Arquivar alojamento?"
        description="O alojamento será removido da pesquisa, mas o histórico será mantido."
        cancelLabel="Cancelar"
        confirmLabel="Arquivar"
        variant="destructive"
      />
    </div>
  );
}
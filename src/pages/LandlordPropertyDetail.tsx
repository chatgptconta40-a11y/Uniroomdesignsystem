import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  MapPin,
  Home,
  Wifi,
  Car,
  Dumbbell,
  WashingMachine,
  ChefHat,
  Sofa,
  Trees,
  Wind,
  Flame,
  Zap,
  Layers,
  Eye,
  CalendarDays,
  RefreshCw,
  BedDouble,
  PlusCircle,
  Pencil,
  Pause,
  Play,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  FileEdit,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { toast } from 'sonner';
import { Room, RoomStatus } from '../types/property';
import { normalizeRoomStatus, getRoomStatusLabel, getRoomStatusBadgeClasses } from '../utils/roomStatus';

const PROPERTY_STATUS_CONFIG = {
  active: { label: 'Ativa', color: 'bg-green-100 text-green-800 border-green-200' },
  paused: { label: 'Pausada', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  archived: { label: 'Arquivada', color: 'bg-red-100 text-red-700 border-red-200' },
};

const ROOM_STATUS_ICON: Record<RoomStatus, React.ElementType> = {
  available: CheckCircle,
  reserved: Clock,
  occupied: Ban,
  paused: Pause,
  draft: FileEdit,
};

const ROOM_TYPE_LABELS = {
  private: 'Quarto Privado',
  shared: 'Quarto Partilhado',
  studio: 'Estúdio',
  apartment: 'Apartamento',
};

function AmenityTag({ active, icon: Icon, label }: { active: boolean; icon: React.ElementType; label: string }) {
  if (!active) return null;
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function RoomCard({ room, onEdit, onPause, onReactivate }: {
  room: Room;
  onEdit: () => void;
  onPause?: () => void;
  onReactivate?: () => void;
}) {
  const navigate = useNavigate();
  const effectiveStatus = normalizeRoomStatus(room);
  const StatusIcon = ROOM_STATUS_ICON[effectiveStatus];

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">{room.roomNumber}</p>
          <h3 className="font-semibold text-foreground truncate">{room.title}</h3>
        </div>
        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoomStatusBadgeClasses(effectiveStatus)} whitespace-nowrap`}>
          <StatusIcon className="w-3 h-3" />
          {getRoomStatusLabel(effectiveStatus)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Preço</span>
          <p className="font-semibold text-foreground">€{room.price}/mês</p>
        </div>
        {room.utilities !== undefined && (
          <div>
            <span className="text-muted-foreground text-xs">Despesas</span>
            <p className="font-medium text-foreground">€{room.utilities}/mês</p>
          </div>
        )}
        {room.size && (
          <div>
            <span className="text-muted-foreground text-xs">Tamanho</span>
            <p className="font-medium text-foreground">{room.size} m²</p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground text-xs">Tipo</span>
          <p className="font-medium text-foreground">{ROOM_TYPE_LABELS[room.roomType]}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <button
          onClick={() => navigate(`/room/${room.id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver quarto
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors border border-border"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </button>
        {onPause && (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors border border-amber-200"
          >
            <Pause className="w-3.5 h-3.5" />
            Pausar
          </button>
        )}
        {onReactivate && (
          <button
            onClick={onReactivate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors border border-green-200"
          >
            <Play className="w-3.5 h-3.5" />
            Reativar
          </button>
        )}
      </div>
    </div>
  );
}

export function LandlordPropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getProperty, getRoomsByProperty, updateRoomStatus } = useProperties();

  const [selectedImage, setSelectedImage] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);

  const property = getProperty(id || '');
  const rooms = property ? getRoomsByProperty(property.id) : [];

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-10 text-center max-w-md">
          <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Propriedade não encontrada</h2>
          <p className="text-muted-foreground mb-6">Esta propriedade não existe ou não tens acesso.</p>
          <Button onClick={() => navigate('/landlord/properties')}>Voltar às Propriedades</Button>
        </Card>
      </div>
    );
  }

  if (user?.type !== 'landlord' || property.landlordId !== user.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-10 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-6">Não tens permissão para ver esta propriedade.</p>
          <Button onClick={() => navigate('/landlord/properties')}>Voltar às Propriedades</Button>
        </Card>
      </div>
    );
  }

  const statusCfg = PROPERTY_STATUS_CONFIG[property.status];

  const roomStats = {
    total: rooms.length,
    available: rooms.filter(r => normalizeRoomStatus(r) === 'available').length,
    reserved: rooms.filter(r => normalizeRoomStatus(r) === 'reserved').length,
    occupied: rooms.filter(r => normalizeRoomStatus(r) === 'occupied').length,
    paused: rooms.filter(r => normalizeRoomStatus(r) === 'paused').length,
  };

  const createdAt = new Date(property.createdAt).toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const updatedAt = new Date(property.updatedAt).toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const amenityList = [
    { key: 'wifi', icon: Wifi, label: 'Wi-Fi' },
    { key: 'parking', icon: Car, label: 'Estacionamento' },
    { key: 'gym', icon: Dumbbell, label: 'Ginásio' },
    { key: 'laundry', icon: WashingMachine, label: 'Lavandaria' },
    { key: 'kitchen', icon: ChefHat, label: 'Cozinha' },
    { key: 'livingRoom', icon: Sofa, label: 'Sala de Estar' },
    { key: 'backyard', icon: Trees, label: 'Jardim/Quintal' },
    { key: 'airConditioning', icon: Wind, label: 'Ar Condicionado' },
    { key: 'heating', icon: Flame, label: 'Aquecimento' },
    { key: 'dishwasher', icon: Zap, label: 'Máquina de Louça' },
    { key: 'microwave', icon: Zap, label: 'Micro-ondas' },
    { key: 'elevator', icon: Layers, label: 'Elevador' },
  ] as const;

  const activeAmenities = amenityList.filter(a => property.amenities[a.key]);

  const handleRoomPause = (roomId: string) => {
    updateRoomStatus(roomId, 'paused');
    toast.success('Quarto pausado com sucesso');
  };

  const handleRoomReactivate = (roomId: string) => {
    updateRoomStatus(roomId, 'available');
    toast.success('Quarto reativado com sucesso');
  };

  const heroImage = property.images[selectedImage] || property.images[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">

        {/* Back button */}
        <button
          onClick={() => navigate('/landlord/properties')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm">Voltar às Propriedades</span>
        </button>

        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden mb-6 bg-muted" style={{ height: '320px' }}>
          {heroImage ? (
            <img
              src={heroImage}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Home className="w-20 h-20 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Thumbnail strip */}
          {property.images.length > 1 && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              {property.images.slice(0, 5).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === i ? 'border-white scale-105' : 'border-white/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Header info overlay */}
          <div className="absolute bottom-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto text-right md:text-center max-w-xl">
            <div className="flex items-center gap-2 justify-end md:justify-center mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
              {property.verified && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  Verificada
                </span>
              )}
            </div>
            <h1 className="text-white text-2xl md:text-3xl font-bold drop-shadow-lg mb-1">{property.title}</h1>
            <p className="text-white/80 text-sm flex items-center gap-1 justify-end md:justify-center">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {property.address}, {property.zone}, {property.city} · {property.distanceToUniversity} km da universidade
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>{property.views} visualizações</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <Pencil className="w-4 h-4 mr-1.5" />
              Editar Propriedade
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/landlord/new-listing')}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Novo Quarto
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column - details */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Room stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total', value: roomStats.total, color: 'bg-card border-border', textColor: 'text-foreground' },
                { label: 'Disponíveis', value: roomStats.available, color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
                { label: 'Reservados', value: roomStats.reserved, color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
                { label: 'Ocupados', value: roomStats.occupied, color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.color} border rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <Card className="p-5">
              <h2 className="font-semibold text-foreground mb-3">Descrição</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{property.description}</p>
            </Card>

            {/* Amenities */}
            {activeAmenities.length > 0 && (
              <Card className="p-5">
                <h2 className="font-semibold text-foreground mb-3">Comodidades</h2>
                <div className="flex flex-wrap gap-2">
                  {activeAmenities.map(a => (
                    <AmenityTag key={a.key} active icon={a.icon} label={a.label} />
                  ))}
                </div>
              </Card>
            )}

            {/* House rules */}
            {property.houseRules && (
              <Card className="p-5">
                <h2 className="font-semibold text-foreground mb-3">Regras da Casa</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { key: 'smoking', label: 'Fumar', value: property.houseRules.smoking },
                    { key: 'pets', label: 'Animais de Estimação', value: property.houseRules.pets },
                    { key: 'parties', label: 'Festas', value: property.houseRules.parties },
                  ].map(rule => (
                    <div key={rule.key} className="flex items-center gap-2">
                      {rule.value ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <span className="text-muted-foreground">{rule.label}</span>
                    </div>
                  ))}
                  {property.houseRules.quietHours && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-muted-foreground">Silêncio: {property.houseRules.quietHours}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Rooms list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-primary" />
                  Quartos ({rooms.length})
                </h2>
                {roomStats.paused > 0 && (
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    {roomStats.paused} pausado{roomStats.paused > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {rooms.length === 0 ? (
                <Card className="p-10 text-center">
                  <BedDouble className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm mb-4">Nenhum quarto associado a esta propriedade.</p>
                  <Button size="sm" onClick={() => navigate('/landlord/new-listing')}>
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Adicionar Quarto
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rooms.map(room => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onEdit={() => toast.info('Edição de quarto em desenvolvimento')}
                      onPause={normalizeRoomStatus(room) === 'available' || normalizeRoomStatus(room) === 'reserved' ? () => handleRoomPause(room.id) : undefined}
                      onReactivate={normalizeRoomStatus(room) === 'paused' ? () => handleRoomReactivate(room.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - stats sidebar */}
          <div className="flex flex-col gap-4">

            {/* Quick stats */}
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Estatísticas</h3>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Visualizações
                  </span>
                  <span className="font-semibold text-foreground">{property.views}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Criada em
                  </span>
                  <span className="font-medium text-foreground text-right text-xs">{createdAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Atualizada
                  </span>
                  <span className="font-medium text-foreground text-right text-xs">{updatedAt}</span>
                </div>
              </div>
            </Card>

            {/* Room breakdown */}
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Estado dos Quartos</h3>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'Disponíveis', value: roomStats.available, color: 'bg-green-500' },
                  { label: 'Reservados', value: roomStats.reserved, color: 'bg-blue-500' },
                  { label: 'Ocupados', value: roomStats.occupied, color: 'bg-purple-500' },
                  { label: 'Pausados', value: roomStats.paused, color: 'bg-amber-400' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.color}`} />
                    <span className="text-muted-foreground flex-1">{item.label}</span>
                    <span className="font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-1 flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-foreground/20" />
                  <span className="text-muted-foreground flex-1">Total</span>
                  <span className="font-bold text-foreground">{roomStats.total}</span>
                </div>
              </div>
            </Card>

            {/* Location */}
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-3">Localização</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{property.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{property.zone}, {property.city}</span>
                </div>
                <div className="mt-1 px-3 py-2 bg-primary/5 rounded-lg text-primary text-xs font-medium">
                  {property.distanceToUniversity} km da universidade
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit modal (placeholder) */}
      {showEditModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowEditModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Editar Propriedade</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                A edição completa da propriedade está em desenvolvimento. Em breve poderás atualizar todos os detalhes diretamente aqui.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setShowEditModal(false)}>
                Fechar
              </Button>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

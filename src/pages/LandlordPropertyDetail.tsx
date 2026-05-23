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
  ShieldOff,
  Users,
  Star,
  MessageCircle,
  Phone,
  Video,
  GraduationCap,
  ThumbsUp,
  ThumbsDown,
  Save,
  X,
  AlertCircle,
  ClipboardList,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { toast } from 'sonner';
import { isUserSuspended, isUserBlockedFromPublishing } from '../data/mockAdminUsersState';
import { Room, RoomStatus, Property } from '../types/property';
import { normalizeRoomStatus, getRoomStatusLabel, getRoomStatusBadgeClasses } from '../utils/roomStatus';
import {
  LandlordApplication,
  CandidateStatus,
  getApplicationsByProperty,
  updateCandidateStatus,
  scheduleVisit,
} from '../data/mockLandlordCandidates';

// Re-export the type alias used internally
type Candidate = LandlordApplication;

// ─── CandidateCard ─────────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  roomAlreadyReserved,
  onAccept,
  onReject,
  onContact,
  onScheduleVisit,
}: {
  candidate: Candidate;
  roomAlreadyReserved: boolean;
  onAccept: () => void;
  onReject: () => void;
  onContact: () => void;
  onScheduleVisit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig: Record<CandidateStatus, { label: string; cls: string }> = {
    pending: { label: 'Pendente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    under_review: { label: 'Em análise', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    accepted: { label: 'Aceite', cls: 'bg-green-50 text-green-700 border-green-200' },
    rejected: { label: 'Rejeitado', cls: 'bg-red-50 text-red-600 border-red-200' },
  };
  const cfg = statusConfig[candidate.status];
  const scoreColor = candidate.compatibilityScore >= 85 ? 'text-green-600' :
    candidate.compatibilityScore >= 70 ? 'text-amber-600' : 'text-muted-foreground';

  const isActionable = candidate.status !== 'rejected' && candidate.status !== 'accepted';

  return (
    <div className={`border rounded-xl p-4 transition-all ${
      candidate.status === 'rejected' ? 'border-border opacity-60' : 'border-border hover:border-primary/30'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${candidate.avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {candidate.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{candidate.studentName}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.cls}`}>
              {cfg.label}
            </span>
            {candidate.isStudent && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                Estudante
              </span>
            )}
            {roomAlreadyReserved && isActionable && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Quarto já reservado
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {candidate.course} · {candidate.year}º ano · {candidate.university}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Candidatura a {new Date(candidate.appliedAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
          </p>
          {candidate.visitDate && (
            <div className="mt-1">
              <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                {candidate.visitFormat === 'videochamada' ? <Video className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                {candidate.visitFormat === 'videochamada' ? 'Videochamada' : 'Visita presencial'} marcada para{' '}
                {new Date(candidate.visitDate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })} às{' '}
                {new Date(candidate.visitDate).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {candidate.visitNote && (
                <p className="text-xs text-muted-foreground mt-0.5 italic">"{candidate.visitNote}"</p>
              )}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <div className={`text-lg font-bold ${scoreColor}`}>{candidate.compatibilityScore}%</div>
          <div className="flex items-center justify-end gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star
                key={i}
                className={`w-2.5 h-2.5 ${i <= Math.round(candidate.compatibilityScore / 20) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">compatibilidade</p>
        </div>
      </div>

      <div className="mt-3 ml-[52px]">
        <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          "{candidate.message}"
        </p>
        {candidate.message.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary mt-1 hover:underline"
          >
            {expanded ? 'Ver menos' : 'Ver mensagem completa'}
          </button>
        )}
      </div>

      {isActionable && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
          <button
            onClick={onContact}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Mensagem
          </button>
          <button
            onClick={onScheduleVisit}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              candidate.visitDate
                ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'border-border hover:bg-muted'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {candidate.visitDate ? 'Reagendar' : 'Agendar visita'}
          </button>
          <div className="flex-1" />
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium transition-colors"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            Recusar
          </button>
          <button
            disabled={roomAlreadyReserved}
            onClick={onAccept}
            title={roomAlreadyReserved ? 'Este quarto já está reservado. Liberta-o antes de aceitar outro candidato.' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              roomAlreadyReserved
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Aceitar
          </button>
        </div>
      )}
      {!isActionable && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
          <button
            onClick={onContact}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Mensagem
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── AmenityTag ───────────────────────────────────────────────────────────────

function AmenityTag({ active, icon: Icon, label }: { active: boolean; icon: React.ElementType; label: string }) {
  if (!active) return null;
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// ─── RoomCard ─────────────────────────────────────────────────────────────────

function RoomCard({ room, reservedByName, onEdit, onPause, onReactivate }: {
  room: Room;
  reservedByName?: string;
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

      {reservedByName && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Reservado por <span className="font-semibold">{reservedByName}</span></span>
        </div>
      )}

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

// ─── AddRoomModal ─────────────────────────────────────────────────────────────

function AddRoomModal({
  propertyId,
  landlordId,
  existingRoomsCount,
  onClose,
  onAdd,
}: {
  propertyId: string;
  landlordId: string;
  existingRoomsCount: number;
  onClose: () => void;
  onAdd: (room: Room) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    price: '',
    utilities: '',
    size: '',
    roomType: 'private' as Room['roomType'],
    privateBathroom: false,
    balcony: false,
    desk: true,
    wardrobe: true,
    airConditioning: false,
    availableFrom: new Date().toISOString().split('T')[0],
    minimumStay: '6',
    publishNow: false,
  });

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('O nome do quarto é obrigatório'); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      toast.error('Insere um preço válido'); return;
    }

    const roomNumber = `Q${existingRoomsCount + 1}`;
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      propertyId,
      landlordId,
      roomNumber,
      title: form.title.trim(),
      description: '',
      images: [],
      size: form.size ? Number(form.size) : undefined,
      roomType: form.roomType,
      maxOccupants: 1,
      privateBathroom: form.privateBathroom,
      balcony: form.balcony,
      desk: form.desk,
      wardrobe: form.wardrobe,
      airConditioning: form.airConditioning,
      price: Number(form.price),
      utilities: form.utilities ? Number(form.utilities) : undefined,
      availableFrom: new Date(form.availableFrom),
      minimumStay: Number(form.minimumStay) || 6,
      status: form.publishNow ? 'available' : 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
    };

    onAdd(newRoom);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold">Novo Quarto</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Nome do quarto *</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="ex: Suite com WC Privativo"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Price + Utilities */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Renda (€/mês) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  placeholder="280"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Despesas (€/mês)</label>
                <input
                  type="number"
                  value={form.utilities}
                  onChange={e => set('utilities', e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            {/* Area + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Área (m²)</label>
                <input
                  type="number"
                  value={form.size}
                  onChange={e => set('size', e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tipo</label>
                <select
                  value={form.roomType}
                  onChange={e => set('roomType', e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="private">Quarto Privado</option>
                  <option value="shared">Quarto Partilhado</option>
                  <option value="studio">Estúdio</option>
                  <option value="apartment">Apartamento</option>
                </select>
              </div>
            </div>

            {/* Available from + Min stay */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Disponível a partir de</label>
                <input
                  type="date"
                  value={form.availableFrom}
                  onChange={e => set('availableFrom', e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Estadia mínima (meses)</label>
                <input
                  type="number"
                  value={form.minimumStay}
                  onChange={e => set('minimumStay', e.target.value)}
                  placeholder="6"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            {/* Extras */}
            <div>
              <label className="block text-sm font-medium mb-2">Extras do quarto</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'privateBathroom', label: 'WC Privativo' },
                  { key: 'balcony', label: 'Varanda' },
                  { key: 'desk', label: 'Secretária' },
                  { key: 'wardrobe', label: 'Roupeiro' },
                  { key: 'airConditioning', label: 'Ar Condicionado' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key as keyof typeof form] as boolean}
                      onChange={e => set(key, e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Publish toggle */}
            <div className={`rounded-xl border p-4 flex items-center gap-3 cursor-pointer transition-colors ${
              form.publishNow ? 'border-green-300 bg-green-50' : 'border-border bg-muted/30'
            }`} onClick={() => set('publishNow', !form.publishNow)}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                form.publishNow ? 'border-green-600 bg-green-600' : 'border-border'
              }`}>
                {form.publishNow && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <div>
                <p className="text-sm font-medium">{form.publishNow ? 'Publicar imediatamente' : 'Guardar como rascunho'}</p>
                <p className="text-xs text-muted-foreground">
                  {form.publishNow ? 'O quarto ficará visível para estudantes' : 'Podes publicar mais tarde'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {form.publishNow ? 'Publicar Quarto' : 'Guardar Rascunho'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── EditRoomDetailModal ──────────────────────────────────────────────────────

function EditRoomDetailModal({
  room,
  onClose,
  onSave,
}: {
  room: Room;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Room>) => void;
}) {
  const [form, setForm] = useState({
    title: room.title,
    price: String(room.price),
    utilities: room.utilities !== undefined ? String(room.utilities) : '',
    utilitiesIncluded: room.utilities !== undefined,
    roomType: room.roomType,
    availableFrom: room.availableFrom
      ? new Date(room.availableFrom).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    minimumStay: String(room.minimumStay || 6),
    description: room.description || '',
    status: room.status as RoomStatus,
  });

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('O nome do quarto é obrigatório'); return; }
    const price = Number(form.price);
    if (isNaN(price) || price <= 0) { toast.error('Preço inválido'); return; }

    onSave(room.id, {
      title: form.title.trim(),
      price,
      utilities: form.utilitiesIncluded && form.utilities ? Number(form.utilities) : undefined,
      roomType: form.roomType,
      availableFrom: new Date(form.availableFrom),
      minimumStay: Number(form.minimumStay) || 6,
      description: form.description.trim(),
      status: form.status,
      updatedAt: new Date(),
    });
  };

  const statusOptions: { value: RoomStatus; label: string }[] = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'available', label: 'Disponível' },
    { value: 'reserved', label: 'Reservado' },
    { value: 'occupied', label: 'Ocupado' },
    { value: 'paused', label: 'Pausado' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Pencil className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold">Editar Quarto</h3>
                <p className="text-xs text-muted-foreground">{room.roomNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nome do quarto *</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Renda (€/mês) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tipo</label>
                <select
                  value={form.roomType}
                  onChange={e => set('roomType', e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="private">Quarto Privado</option>
                  <option value="shared">Quarto Partilhado</option>
                  <option value="studio">Estúdio</option>
                  <option value="apartment">Apartamento</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={form.utilitiesIncluded}
                  onChange={e => set('utilitiesIncluded', e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm font-medium">Despesas incluídas</span>
              </label>
              {form.utilitiesIncluded && (
                <input
                  type="number"
                  value={form.utilities}
                  onChange={e => set('utilities', e.target.value)}
                  placeholder="Valor das despesas (€/mês)"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  min="0"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Disponível a partir de</label>
                <input
                  type="date"
                  value={form.availableFrom}
                  onChange={e => set('availableFrom', e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Estadia mínima (meses)</label>
                <input
                  type="number"
                  value={form.minimumStay}
                  onChange={e => set('minimumStay', e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Estado</label>
              <div className="grid grid-cols-3 gap-2">
                {statusOptions.map(opt => {
                  const colors: Record<RoomStatus, string> = {
                    available: 'border-green-300 bg-green-50 text-green-700',
                    reserved: 'border-blue-300 bg-blue-50 text-blue-700',
                    occupied: 'border-purple-300 bg-purple-50 text-purple-700',
                    paused: 'border-amber-300 bg-amber-50 text-amber-700',
                    draft: 'border-gray-300 bg-gray-50 text-gray-700',
                  };
                  const isActive = form.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('status', opt.value)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                        isActive
                          ? colors[opt.value] + ' ring-2 ring-offset-1 ring-current/30'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Descrição</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                placeholder="Descreve o quarto..."
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1 border-t border-border">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ScheduleVisitModal ───────────────────────────────────────────────────────

function ScheduleVisitModal({
  candidate,
  roomTitle,
  onClose,
  onSchedule,
}: {
  candidate: LandlordApplication;
  roomTitle: string;
  onClose: () => void;
  onSchedule: (applicationId: string, visitDate: string, details: { format: 'presencial' | 'videochamada'; note: string }) => void;
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [form, setForm] = useState({
    date: tomorrow.toISOString().split('T')[0],
    time: '10:00',
    format: 'presencial' as 'presencial' | 'videochamada',
    note: '',
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleConfirm = () => {
    if (!form.date) { toast.error('Escolhe uma data'); return; }
    if (!form.time) { toast.error('Escolhe uma hora'); return; }
    const visitDateTime = `${form.date}T${form.time}`;
    onSchedule(candidate.id, visitDateTime, { format: form.format as 'presencial' | 'videochamada', note: form.note });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold">Agendar Visita</h3>
                <p className="text-xs text-muted-foreground">{candidate.studentName} · {roomTitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${candidate.avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {candidate.initials}
              </div>
              <div>
                <p className="text-sm font-semibold">{candidate.studentName}</p>
                <p className="text-xs text-muted-foreground">{candidate.course} · {candidate.university}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Data</label>
                <input
                  type="date"
                  value={form.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => set('date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Hora</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => set('time', e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Formato da visita</label>
              <div className="grid grid-cols-2 gap-2">
                {(['presencial', 'videochamada'] as const).map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, format: fmt }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.format === fmt
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {fmt === 'presencial' ? (
                      <><Phone className="w-4 h-4" /> Presencial</>
                    ) : (
                      <><Video className="w-4 h-4" /> Videochamada</>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Nota para o candidato (opcional)</label>
              <textarea
                value={form.note}
                onChange={e => set('note', e.target.value)}
                rows={2}
                placeholder="ex: Toca à campainha do 2º andar..."
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1 border-t border-border">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Confirmar Visita
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── EditPropertyModal ────────────────────────────────────────────────────────

function EditPropertyModal({
  property,
  onClose,
  onSave,
}: {
  property: Property;
  onClose: () => void;
  onSave: (updates: Partial<Property>) => void;
}) {
  const [form, setForm] = useState({
    title: property.title,
    description: property.description,
    address: property.address,
    city: property.city,
    zone: property.zone,
    distanceToUniversity: String(property.distanceToUniversity),
    // amenities
    wifi: property.amenities.wifi,
    parking: property.amenities.parking,
    gym: property.amenities.gym,
    laundry: property.amenities.laundry,
    kitchen: property.amenities.kitchen,
    livingRoom: property.amenities.livingRoom,
    backyard: property.amenities.backyard,
    airConditioning: property.amenities.airConditioning,
    heating: property.amenities.heating,
    dishwasher: property.amenities.dishwasher,
    microwave: property.amenities.microwave,
    elevator: property.amenities.elevator,
    // house rules
    smoking: property.houseRules?.smoking ?? false,
    pets: property.houseRules?.pets ?? false,
    parties: property.houseRules?.parties ?? false,
    studentsOnly: property.houseRules?.studentsOnly ?? false,
    quietHours: property.houseRules?.quietHours ?? '',
    cleaningPolicy: property.houseRules?.cleaningPolicy ?? '',
    visitorsPolicy: property.houseRules?.visitorsPolicy ?? '',
    preferredGender: property.houseRules?.preferredGender ?? 'any' as 'any' | 'male' | 'female',
  });

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('O título é obrigatório'); return; }
    const dist = Number(form.distanceToUniversity);
    if (isNaN(dist) || dist < 0) { toast.error('Distância inválida'); return; }

    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      zone: form.zone.trim(),
      distanceToUniversity: dist,
      amenities: {
        wifi: form.wifi,
        parking: form.parking,
        gym: form.gym,
        laundry: form.laundry,
        kitchen: form.kitchen,
        livingRoom: form.livingRoom,
        backyard: form.backyard,
        airConditioning: form.airConditioning,
        heating: form.heating,
        dishwasher: form.dishwasher,
        microwave: form.microwave,
        elevator: form.elevator,
      },
      houseRules: {
        smoking: form.smoking,
        pets: form.pets,
        parties: form.parties,
        studentsOnly: form.studentsOnly,
        quietHours: form.quietHours || undefined,
        cleaningPolicy: form.cleaningPolicy || undefined,
        visitorsPolicy: form.visitorsPolicy || undefined,
        preferredGender: form.preferredGender !== 'any' ? form.preferredGender : undefined,
      },
    });
  };

  const amenityOptions = [
    { key: 'wifi', label: 'Wi-Fi' },
    { key: 'parking', label: 'Estacionamento' },
    { key: 'gym', label: 'Ginásio' },
    { key: 'laundry', label: 'Lavandaria' },
    { key: 'kitchen', label: 'Cozinha' },
    { key: 'livingRoom', label: 'Sala de Estar' },
    { key: 'backyard', label: 'Jardim/Quintal' },
    { key: 'airConditioning', label: 'Ar Condicionado' },
    { key: 'heating', label: 'Aquecimento' },
    { key: 'dishwasher', label: 'Máquina de Louça' },
    { key: 'microwave', label: 'Micro-ondas' },
    { key: 'elevator', label: 'Elevador' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Pencil className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold">Editar Alojamento</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-6">
            {/* Basic info */}
            <section>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Informações Básicas</h4>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Título *</label>
                  <input
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Descrição</label>
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Location */}
            <section>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Localização</h4>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Morada</label>
                  <input
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Cidade</label>
                    <input
                      value={form.city}
                      onChange={e => set('city', e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Zona</label>
                    <input
                      value={form.zone}
                      onChange={e => set('zone', e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Distância à universidade (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.distanceToUniversity}
                    onChange={e => set('distanceToUniversity', e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
            </section>

            {/* Amenities */}
            <section>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Comodidades</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {amenityOptions.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={form[key as keyof typeof form] as boolean}
                      onChange={e => set(key, e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* House rules */}
            <section>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Regras da Casa</h4>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { key: 'smoking', label: 'Fumar permitido' },
                  { key: 'pets', label: 'Animais permitidos' },
                  { key: 'parties', label: 'Festas permitidas' },
                  { key: 'studentsOnly', label: 'Apenas estudantes' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={form[key as keyof typeof form] as boolean}
                      onChange={e => set(key, e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Género preferido</label>
                  <select
                    value={form.preferredGender}
                    onChange={e => set('preferredGender', e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="any">Indiferente</option>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Horário de silêncio</label>
                  <input
                    value={form.quietHours}
                    onChange={e => set('quietHours', e.target.value)}
                    placeholder="ex: 23:00 - 08:00"
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Política de limpeza</label>
                  <input
                    value={form.cleaningPolicy}
                    onChange={e => set('cleaningPolicy', e.target.value)}
                    placeholder="ex: Rotação semanal entre moradores"
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Política de visitas</label>
                  <input
                    value={form.visitorsPolicy}
                    onChange={e => set('visitorsPolicy', e.target.value)}
                    placeholder="ex: Visitas permitidas com aviso prévio"
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-border">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function LandlordPropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getProperty, getRoomsByProperty, updateRoomStatus, updateRoom, updateProperty, addRoom } = useProperties();
  const isAccountSuspended = user ? isUserSuspended(user.id) : false;
  const isBlockedFromPublishing = user ? isUserBlockedFromPublishing(user.id) : false;

  const [selectedImage, setSelectedImage] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [visitCandidate, setVisitCandidate] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<'rooms' | 'candidates'>('rooms');
  const [candidates, setCandidates] = useState<Candidate[]>(() =>
    id ? getApplicationsByProperty(id) : [],
  );
  const [candidateFilter, setCandidateFilter] = useState<'all' | CandidateStatus>('all');
  const [roomFilter, setRoomFilter] = useState<'all' | string>('all');

  const property = getProperty(id || '');
  const rooms = property ? getRoomsByProperty(property.id) : [];

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-10 text-center max-w-md">
          <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Alojamento não encontrado</h2>
          <p className="text-muted-foreground mb-6">Este alojamento não existe ou não tens acesso.</p>
          <Button onClick={() => navigate('/landlord/properties')}>Voltar aos Alojamentos</Button>
        </Card>
      </div>
    );
  }

  if (user?.type !== 'landlord' || property.landlordId !== user.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-10 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-6">Não tens permissão para ver este alojamento.</p>
          <Button onClick={() => navigate('/landlord/properties')}>Voltar aos Alojamentos</Button>
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
    if (property.adminSuspended) {
      toast.error('Este alojamento foi suspenso pela equipa UniRoom. Não é possível reativar quartos.');
      return;
    }
    if (isAccountSuspended) {
      toast.error('A tua conta está suspensa. Não é possível reativar quartos.');
      return;
    }
    updateRoomStatus(roomId, 'available');
    toast.success('Quarto reativado com sucesso');
  };

  const handleAcceptCandidate = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    const targetRoom = rooms.find(r => r.id === candidate.roomId);
    if (targetRoom) {
      const roomStatus = normalizeRoomStatus(targetRoom);
      if (roomStatus === 'reserved' || roomStatus === 'occupied') {
        toast.error(
          `O quarto "${targetRoom.title}" já está ${roomStatus === 'reserved' ? 'reservado' : 'ocupado'}. Liberta o quarto antes de aceitar outro candidato.`,
        );
        return;
      }
      updateRoom(candidate.roomId, { status: 'reserved', reservedBy: candidate.studentId });
    }

    updateCandidateStatus(candidateId, 'accepted');
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: 'accepted' } : c));
    toast.success(`${candidate.studentName} aceite! O quarto foi marcado como reservado.`);
  };

  const handleRejectCandidate = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    updateCandidateStatus(candidateId, 'rejected');
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: 'rejected' } : c));
    toast.info(`Candidatura de ${candidate?.studentName ?? 'candidato'} recusada.`);
  };

  const handleSaveProperty = (updates: Partial<Property>) => {
    updateProperty(property.id, updates);
    setShowEditModal(false);
    toast.success('Alojamento atualizado com sucesso');
  };

  const handleSaveRoomEdit = (roomId: string, updates: Partial<Room>) => {
    updateRoom(roomId, updates);
    setEditingRoom(null);
    toast.success('Quarto atualizado com sucesso');
  };

  const handleScheduleVisit = (applicationId: string, visitDate: string, details: { format: 'presencial' | 'videochamada'; note: string }) => {
    scheduleVisit(applicationId, visitDate, details.format, details.note || undefined);
    setCandidates(prev =>
      prev.map(c => c.id === applicationId
        ? { ...c, visitDate, visitFormat: details.format, visitNote: details.note || undefined, status: c.status === 'pending' ? 'under_review' : c.status }
        : c),
    );
    setVisitCandidate(null);
    toast.success(details.format === 'videochamada' ? 'Videochamada agendada com sucesso' : 'Visita presencial agendada com sucesso');
  };

  const handleAddRoom = (room: Room) => {
    if (room.status === 'available' && (property.adminSuspended || isAccountSuspended || isBlockedFromPublishing)) {
      // Force draft if landlord/property is restricted
      room = { ...room, status: 'draft' };
      if (property.adminSuspended) toast.error('Alojamento suspenso pelo admin. Quarto guardado como rascunho.');
      else toast.error('Conta restringida. Quarto guardado como rascunho.');
    }
    addRoom(room);
    updateProperty(property.id, {
      totalRooms: property.totalRooms + 1,
      roomIds: [...property.roomIds, room.id],
      // If the new room is published and the property is still draft, activate it
      ...(room.status === 'available' && property.status === 'draft' ? { status: 'active' as const } : {}),
    });
    setShowAddRoomModal(false);
    if (room.status !== 'draft') {
      toast.success(`Quarto "${room.title}" publicado com sucesso!`);
    } else {
      toast.info(`Quarto "${room.title}" guardado como rascunho.`);
    }
  };

  // Set of rooms that already have a reserved/occupied status
  const reservedRoomIds = new Set(
    rooms.filter(r => normalizeRoomStatus(r) === 'reserved' || normalizeRoomStatus(r) === 'occupied').map(r => r.id),
  );

  const filteredCandidates = candidates.filter(c => {
    const statusMatch = candidateFilter === 'all' || c.status === candidateFilter;
    const roomMatch = roomFilter === 'all' || c.roomId === roomFilter;
    return statusMatch && roomMatch;
  });

  const pendingCount = candidates.filter(c => c.status === 'pending' || c.status === 'under_review').length;
  const heroImage = property.images[selectedImage] || property.images[0];

  const genderLabel: Record<string, string> = { any: 'Indiferente', male: 'Masculino', female: 'Feminino' };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">

        {/* Back button */}
        <button
          onClick={() => navigate('/landlord/properties')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm">Voltar aos Alojamentos</span>
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

          <div className="absolute bottom-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto text-right md:text-center max-w-xl">
            <div className="flex items-center gap-2 justify-end md:justify-center mb-2">
              {property.adminSuspended ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-red-100 text-red-800 border-red-300">
                  Suspenso pelo Admin
                </span>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
              )}
              {property.verified && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  Verificado
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
              Editar Alojamento
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddRoomModal(true)}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Novo Quarto
            </Button>
          </div>
        </div>

        {/* Admin suspension banner */}
        {property.adminSuspended && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldOff className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-800 mb-0.5">Suspenso pela equipa UniRoom</p>
              <p className="text-sm text-red-700">
                {property.adminSuspensionReason || 'Este anúncio foi suspenso pela equipa UniRoom.'} Não podes reativar ou publicar quartos enquanto esta suspensão estiver ativa. Contacta o suporte em <span className="font-medium">suporte@uniroom.pt</span>.
              </p>
              {property.adminSuspendedAt && (
                <p className="text-xs text-red-500 mt-1">
                  Suspenso em {new Date(property.adminSuspendedAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {property.adminSuspendedBy ? ` por ${property.adminSuspendedBy}` : ''}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
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
                <h2 className="font-semibold text-foreground mb-4">Regras da Casa</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                  {[
                    { key: 'smoking', label: 'Fumar', value: property.houseRules.smoking },
                    { key: 'pets', label: 'Animais de Estimação', value: property.houseRules.pets },
                    { key: 'parties', label: 'Festas', value: property.houseRules.parties },
                    { key: 'studentsOnly', label: 'Apenas Estudantes', value: property.houseRules.studentsOnly },
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
                </div>

                {(property.houseRules.quietHours || property.houseRules.cleaningPolicy || property.houseRules.visitorsPolicy || property.houseRules.preferredGender) && (
                  <div className="border-t border-border pt-4 flex flex-col gap-2.5 text-sm">
                    {property.houseRules.quietHours && (
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">Silêncio: </span>
                          <span className="text-muted-foreground">{property.houseRules.quietHours}</span>
                        </div>
                      </div>
                    )}
                    {property.houseRules.cleaningPolicy && (
                      <div className="flex items-start gap-2">
                        <ClipboardList className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">Limpeza: </span>
                          <span className="text-muted-foreground">{property.houseRules.cleaningPolicy}</span>
                        </div>
                      </div>
                    )}
                    {property.houseRules.visitorsPolicy && (
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">Visitas: </span>
                          <span className="text-muted-foreground">{property.houseRules.visitorsPolicy}</span>
                        </div>
                      </div>
                    )}
                    {property.houseRules.preferredGender && (
                      <div className="flex items-start gap-2">
                        <UserCheck className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">Género preferido: </span>
                          <span className="text-muted-foreground">{genderLabel[property.houseRules.preferredGender] ?? 'Indiferente'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Tabs */}
            <div>
              <div className="flex items-center gap-1 mb-5 border-b border-border">
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    activeTab === 'rooms'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BedDouble className="w-4 h-4" />
                  Quartos ({rooms.length})
                  {roomStats.paused > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      {roomStats.paused} pausado{roomStats.paused > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('candidates')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    activeTab === 'candidates'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Candidatos ({candidates.length})
                  {pendingCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Rooms tab */}
              {activeTab === 'rooms' && (
                <>
                  {rooms.length === 0 ? (
                    <Card className="p-10 text-center">
                      <BedDouble className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="font-medium text-foreground mb-1">Sem quartos ainda</p>
                      <p className="text-muted-foreground text-sm mb-4">Adiciona o primeiro quarto a este alojamento para começar a receber candidaturas.</p>
                      <Button size="sm" onClick={() => setShowAddRoomModal(true)}>
                        <PlusCircle className="w-4 h-4 mr-1.5" />
                        Adicionar Quarto
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {rooms.map(room => {
                        const acceptedCandidate = candidates.find(c => c.roomId === room.id && c.status === 'accepted');
                        return (
                        <RoomCard
                          key={room.id}
                          room={room}
                          reservedByName={room.reservedBy ? (acceptedCandidate?.studentName ?? room.reservedBy) : undefined}
                          onEdit={() => setEditingRoom(room)}
                          onPause={!property.adminSuspended && (normalizeRoomStatus(room) === 'available' || normalizeRoomStatus(room) === 'reserved') ? () => handleRoomPause(room.id) : undefined}
                          onReactivate={!property.adminSuspended && !isAccountSuspended && normalizeRoomStatus(room) === 'paused' ? () => handleRoomReactivate(room.id) : undefined}
                        />
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Candidates tab */}
              {activeTab === 'candidates' && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Total', value: candidates.length, cls: 'bg-card border-border text-foreground' },
                      { label: 'Pendentes', value: candidates.filter(c => c.status === 'pending').length, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
                      { label: 'Em análise', value: candidates.filter(c => c.status === 'under_review').length, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
                      { label: 'Aceites', value: candidates.filter(c => c.status === 'accepted').length, cls: 'bg-green-50 border-green-200 text-green-700' },
                    ].map(stat => (
                      <div key={stat.label} className={`border rounded-xl p-3 text-center ${stat.cls}`}>
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-xs mt-0.5 opacity-80">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Status filter */}
                  <div className="flex gap-2 flex-wrap">
                    {(['all', 'pending', 'under_review', 'accepted', 'rejected'] as const).map(f => {
                      const labels: Record<string, string> = { all: 'Todos', pending: 'Pendentes', under_review: 'Em análise', accepted: 'Aceites', rejected: 'Rejeitados' };
                      const count = f === 'all' ? candidates.length : candidates.filter(c => c.status === f).length;
                      const isActive = candidateFilter === f;
                      return (
                        <button
                          key={f}
                          onClick={() => setCandidateFilter(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            isActive
                              ? 'bg-primary text-white border-primary'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          {labels[f]} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Room filter */}
                  {rooms.length > 1 && (
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className="text-xs text-muted-foreground font-medium">Quarto:</span>
                      <button
                        onClick={() => setRoomFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          roomFilter === 'all' ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'
                        }`}
                      >
                        Todos os quartos ({candidates.length})
                      </button>
                      {rooms.map(room => {
                        const count = candidates.filter(c => c.roomId === room.id).length;
                        const isReserved = reservedRoomIds.has(room.id);
                        return (
                          <button
                            key={room.id}
                            onClick={() => setRoomFilter(room.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                              roomFilter === room.id ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'
                            }`}
                          >
                            {room.title} ({count})
                            {isReserved && (
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" title="Reservado" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Candidate list */}
                  {filteredCandidates.length === 0 ? (
                    <Card className="p-10 text-center">
                      <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="font-medium text-foreground mb-1">
                        {candidates.length === 0
                          ? 'Sem candidaturas ainda'
                          : candidateFilter !== 'all' || roomFilter !== 'all'
                          ? 'Sem candidatos neste filtro'
                          : 'Sem candidaturas'}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {candidates.length === 0
                          ? 'Ainda não há candidaturas para este alojamento.'
                          : 'Altera o filtro de estado ou de quarto para ver outros candidatos.'}
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {filteredCandidates.map(candidate => {
                        // Room is reserved by someone else (another accepted candidate)
                        const roomReservedByOther =
                          reservedRoomIds.has(candidate.roomId) && candidate.status !== 'accepted';
                        return (
                          <CandidateCard
                            key={candidate.id}
                            candidate={candidate}
                            roomAlreadyReserved={roomReservedByOther}
                            onAccept={() => handleAcceptCandidate(candidate.id)}
                            onReject={() => handleRejectCandidate(candidate.id)}
                            onContact={() => {
                              navigate('/messages');
                              toast.info(`A abrir conversa com ${candidate.studentName}`);
                            }}
                            onScheduleVisit={() => setVisitCandidate(candidate)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right column - sidebar */}
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
                    Criado em
                  </span>
                  <span className="font-medium text-foreground text-right text-xs">{createdAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Atualizado
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

            {/* Draft warning */}
            {property.status === 'draft' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Alojamento em rascunho</p>
                  <p className="text-xs text-amber-700 mt-0.5">Publica pelo menos um quarto para tornar este alojamento visível para estudantes.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit property modal */}
      {showEditModal && (
        <EditPropertyModal
          property={property}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProperty}
        />
      )}

      {/* Add room modal */}
      {showAddRoomModal && (
        <AddRoomModal
          propertyId={property.id}
          landlordId={property.landlordId}
          existingRoomsCount={rooms.length}
          onClose={() => setShowAddRoomModal(false)}
          onAdd={handleAddRoom}
        />
      )}

      {/* Edit room detail modal */}
      {editingRoom && (
        <EditRoomDetailModal
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onSave={handleSaveRoomEdit}
        />
      )}

      {/* Schedule visit modal */}
      {visitCandidate && (
        <ScheduleVisitModal
          candidate={visitCandidate}
          roomTitle={rooms.find(r => r.id === visitCandidate.roomId)?.title ?? 'Quarto'}
          onClose={() => setVisitCandidate(null)}
          onSchedule={handleScheduleVisit}
        />
      )}
    </div>
  );
}

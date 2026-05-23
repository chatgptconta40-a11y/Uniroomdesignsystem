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
  Users,
  Star,
  MessageCircle,
  Phone,
  GraduationCap,
  ThumbsUp,
  ThumbsDown,
  Save,
  X,
  AlertCircle,
  ClipboardList,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { toast } from 'sonner';
import { Room, RoomStatus, Property } from '../types/property';
import { normalizeRoomStatus, getRoomStatusLabel, getRoomStatusBadgeClasses } from '../utils/roomStatus';

// ─── Mock candidates ─────────────────────────────────────────────────────────

interface Candidate {
  id: string;
  name: string;
  initials: string;
  color: string;
  university: string;
  course: string;
  year: number;
  isStudent: boolean;
  compatibilityScore: number;
  message: string;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  appliedAt: string;
  wantedRoomTitle: string;
  roomId: string;
}

const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Ana Rodrigues',
    initials: 'AR',
    color: 'from-purple-500 to-pink-500',
    university: 'ESTGV',
    course: 'Engenharia Informática',
    year: 2,
    isStudent: true,
    compatibilityScore: 92,
    message: 'Olá! Sou estudante de Informática no 2º ano na ESTGV. Procuro um quarto tranquilo e organizado. Tenho horários de estudo regulares e gosto de manter a casa limpa.',
    status: 'pending',
    appliedAt: '2026-05-20',
    wantedRoomTitle: 'Suite com WC Privativo',
    roomId: 'room-estgv-1',
  },
  {
    id: 'cand-2',
    name: 'Miguel Santos',
    initials: 'MS',
    color: 'from-blue-500 to-cyan-500',
    university: 'ESTGV',
    course: 'Gestão',
    year: 3,
    isStudent: true,
    compatibilityScore: 85,
    message: 'Bom dia! Sou estudante de Gestão, 3º ano. Procuro alojamento a partir de setembro. Sou calmo, responsável e não fumo. Tenho referências de senhorios anteriores.',
    status: 'under_review',
    appliedAt: '2026-05-18',
    wantedRoomTitle: 'Quarto Standard',
    roomId: 'room-estgv-2',
  },
  {
    id: 'cand-3',
    name: 'Sofia Costa',
    initials: 'SC',
    color: 'from-green-500 to-teal-500',
    university: 'ESTGV',
    course: 'Design de Comunicação',
    year: 1,
    isStudent: true,
    compatibilityScore: 78,
    message: 'Olá! Sou estudante do 1º ano, transferi-me do Porto. Procuro quarto perto da ESTGV. Gosto de ambientes calmos e respeito as regras da casa.',
    status: 'pending',
    appliedAt: '2026-05-22',
    wantedRoomTitle: 'Quarto Standard',
    roomId: 'room-estgv-3',
  },
  {
    id: 'cand-4',
    name: 'João Ferreira',
    initials: 'JF',
    color: 'from-orange-500 to-red-500',
    university: 'ESTGV',
    course: 'Marketing',
    year: 2,
    isStudent: true,
    compatibilityScore: 71,
    message: 'Estudante de Marketing, 2º ano. Procuro quarto económico com boa ligação à faculdade. Sou sociável mas respeito os espaços comuns.',
    status: 'rejected',
    appliedAt: '2026-05-15',
    wantedRoomTitle: 'Quarto Standard',
    roomId: 'room-estgv-2',
  },
];

// ─── CandidateCard ─────────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  onAccept,
  onReject,
  onContact,
}: {
  candidate: Candidate;
  onAccept: () => void;
  onReject: () => void;
  onContact: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = {
    pending: { label: 'Pendente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    under_review: { label: 'Em análise', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    accepted: { label: 'Aceite', cls: 'bg-green-50 text-green-700 border-green-200' },
    rejected: { label: 'Rejeitado', cls: 'bg-red-50 text-red-600 border-red-200' },
  };
  const cfg = statusConfig[candidate.status];
  const scoreColor = candidate.compatibilityScore >= 85 ? 'text-green-600' :
    candidate.compatibilityScore >= 70 ? 'text-amber-600' : 'text-muted-foreground';

  return (
    <div className={`border rounded-xl p-4 transition-all ${
      candidate.status === 'rejected' ? 'border-border opacity-60' : 'border-border hover:border-primary/30'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${candidate.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {candidate.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{candidate.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.cls}`}>
              {cfg.label}
            </span>
            {candidate.isStudent && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                Estudante
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {candidate.course} · {candidate.year}º ano · {candidate.university}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quarto pretendido: <span className="font-medium text-foreground">{candidate.wantedRoomTitle}</span>
            {' · '}Candidatura a {new Date(candidate.appliedAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
          </p>
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

      {candidate.status !== 'rejected' && candidate.status !== 'accepted' && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
          <button
            onClick={onContact}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Mensagem
          </button>
          <button
            onClick={onContact}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Agendar visita
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
            onClick={onAccept}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Aceitar
          </button>
        </div>
      )}
      {(candidate.status === 'accepted' || candidate.status === 'rejected') && (
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
  const { getProperty, getRoomsByProperty, updateRoomStatus, updateProperty, addRoom } = useProperties();

  const [selectedImage, setSelectedImage] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'candidates'>('rooms');
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);
  const [candidateFilter, setCandidateFilter] = useState<'all' | 'pending' | 'under_review' | 'accepted' | 'rejected'>('all');

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
        toast.error(`O quarto "${targetRoom.title}" já está ${roomStatus === 'reserved' ? 'reservado' : 'ocupado'}. Rejeita o candidato ou liberta o quarto primeiro.`);
        return;
      }
      updateRoomStatus(candidate.roomId, 'reserved');
    }

    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: 'accepted' as const } : c));
    toast.success(`${candidate.name} aceite! O quarto foi marcado como reservado.`);
  };

  const handleRejectCandidate = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: 'rejected' as const } : c));
    toast.info(`Candidatura de ${candidate?.name ?? 'candidato'} recusada.`);
  };

  const handleSaveProperty = (updates: Partial<Property>) => {
    updateProperty(property.id, updates);
    setShowEditModal(false);
    toast.success('Alojamento atualizado com sucesso');
  };

  const handleAddRoom = (room: Room) => {
    addRoom(room);
    updateProperty(property.id, {
      totalRooms: property.totalRooms + 1,
      roomIds: [...property.roomIds, room.id],
      // If the new room is published and the property is still draft, activate it
      ...(room.status === 'available' && property.status === 'draft' ? { status: 'active' as const } : {}),
    });
    setShowAddRoomModal(false);
    toast.success(
      room.status === 'available'
        ? `Quarto "${room.title}" publicado com sucesso!`
        : `Quarto "${room.title}" guardado como rascunho.`,
    );
  };

  const filteredCandidates = candidateFilter === 'all'
    ? candidates
    : candidates.filter(c => c.status === candidateFilter);

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
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
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
                      {rooms.map(room => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          onEdit={() => toast.info('Edição detalhada de quarto em breve')}
                          onPause={normalizeRoomStatus(room) === 'available' || normalizeRoomStatus(room) === 'reserved' ? () => handleRoomPause(room.id) : undefined}
                          onReactivate={normalizeRoomStatus(room) === 'paused' ? () => handleRoomReactivate(room.id) : undefined}
                        />
                      ))}
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

                  {/* Filter buttons */}
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

                  {/* Candidate list */}
                  {filteredCandidates.length === 0 ? (
                    <Card className="p-10 text-center">
                      <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="font-medium text-foreground mb-1">
                        {candidateFilter === 'all' ? 'Sem candidaturas' : `Nenhum candidato ${
                          candidateFilter === 'pending' ? 'pendente' :
                          candidateFilter === 'under_review' ? 'em análise' :
                          candidateFilter === 'accepted' ? 'aceite' : 'rejeitado'
                        }`}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {candidateFilter === 'all'
                          ? 'Ainda não há candidaturas para este alojamento.'
                          : 'Altera o filtro para ver outros candidatos.'}
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {filteredCandidates.map(candidate => (
                        <CandidateCard
                          key={candidate.id}
                          candidate={candidate}
                          onAccept={() => handleAcceptCandidate(candidate.id)}
                          onReject={() => handleRejectCandidate(candidate.id)}
                          onContact={() => {
                            navigate('/messages');
                            toast.info(`A abrir conversa com ${candidate.name}`);
                          }}
                        />
                      ))}
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
    </div>
  );
}

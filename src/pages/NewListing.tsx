import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Save,
  Eye,
  Plus,
  Trash2,
  Pencil,
  Home,
  BedDouble,
  Shield,
  AlertCircle,
  CheckCircle,
  X,

  Wifi,
  WashingMachine,
  ChefHat,
  Sofa,
  Car,
  Thermometer,
  Trees,
  Layers,
  GraduationCap,
  PartyPopper,
  PawPrint,
  Cigarette,
  Clock,
  SprayCan,
  Users,
  Camera,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoomDraft {
  tempId: string;
  title: string;
  price: number;
  utilities: number;
  size: number | '';
  roomType: 'private' | 'shared' | 'studio';
  bedType: 'single' | 'double' | 'bunk';
  privateBathroom: boolean;
  furnished: boolean;
  hasWindow: boolean;
  availableFrom: string;
  publishNow: boolean;
}

interface PropertyDraft {
  title: string;
  description: string;
  address: string;
  zone: string;
  city: string;
  university: string;
  distanceToUniversity: number | '';
  walkTimeMinutes: number | '';
  utilitiesIncluded: boolean;
  utilitiesNotes: string;
  amenities: {
    wifi: boolean;
    kitchen: boolean;
    laundry: boolean;
    livingRoom: boolean;
    parking: boolean;
    heating: boolean;
    backyard: boolean;
    elevator: boolean;
  };
}

interface HouseRules {
  studentsOnly: boolean;
  noParties: boolean;
  noPets: boolean;
  noSmoking: boolean;
  quietHours: string;
  cleaningPolicy: string;
  visitorsPolicy: string;
  preferredGender: 'any' | 'male' | 'female';
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultProperty: PropertyDraft = {
  title: '',
  description: '',
  address: '',
  zone: '',
  city: 'Viseu',
  university: 'ESTGV',
  distanceToUniversity: '',
  walkTimeMinutes: '',
  utilitiesIncluded: false,
  utilitiesNotes: '',
  amenities: {
    wifi: false,
    kitchen: true,
    laundry: false,
    livingRoom: true,
    parking: false,
    heating: false,
    backyard: false,
    elevator: false,
  },
};

const defaultRules: HouseRules = {
  studentsOnly: false,
  noParties: false,
  noPets: false,
  noSmoking: false,
  quietHours: '',
  cleaningPolicy: '',
  visitorsPolicy: '',
  preferredGender: 'any',
};

const emptyRoom = (): RoomDraft => ({
  tempId: Math.random().toString(36).slice(2),
  title: '',
  price: 0,
  utilities: 0,
  size: '',
  roomType: 'private',
  bedType: 'single',
  privateBathroom: false,
  furnished: true,
  hasWindow: true,
  availableFrom: '',
  publishNow: false,
});

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function inputCls(error?: boolean) {
  return `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-input-background transition-colors ${
    error ? 'border-red-400' : 'border-border'
  }`;
}

function Toggle({ checked, onChange, label, icon: Icon }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon?: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 text-left transition-all ${
        checked
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-card text-foreground hover:border-border/60'
      }`}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span className="text-sm font-medium flex-1">{label}</span>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        checked ? 'bg-primary border-primary' : 'border-muted-foreground/40'
      }`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  );
}

interface RoomFormModalProps {
  initial?: RoomDraft;
  onSave: (room: RoomDraft) => void;
  onClose: () => void;
}

function RoomFormModal({ initial, onSave, onClose }: RoomFormModalProps) {
  const [form, setForm] = useState<RoomDraft>(initial ?? emptyRoom());
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const set = (updates: Partial<RoomDraft>) => setForm(prev => ({ ...prev, ...updates }));

  const validate = () => {
    const errs: Record<string, boolean> = {};
    if (!form.title.trim()) errs.title = true;
    if (!form.price || form.price <= 0) errs.price = true;
    if (!form.availableFrom) errs.availableFrom = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
  };

  const ROOM_PHOTOS = [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&q=80',
  ];
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <Card className="w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto relative">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-foreground">
              {initial ? 'Editar quarto' : 'Adicionar quarto'}
            </h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Title */}
            <div>
              <FieldLabel required>Nome do quarto</FieldLabel>
              <input
                className={inputCls(errors.title)}
                value={form.title}
                onChange={e => set({ title: e.target.value })}
                placeholder="Ex: Quarto 1, Suite, Quarto duplo..."
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">Nome obrigatório</p>}
            </div>

            {/* Price + Utilities */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Renda (€/mês)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                  <input
                    type="number"
                    min={0}
                    className={`${inputCls(errors.price)} pl-7`}
                    value={form.price || ''}
                    onChange={e => set({ price: Number(e.target.value) })}
                    placeholder="250"
                  />
                </div>
                {errors.price && <p className="text-xs text-red-500 mt-1">Preço obrigatório</p>}
              </div>
              <div>
                <FieldLabel>Despesas (€/mês)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                  <input
                    type="number"
                    min={0}
                    className={`${inputCls()} pl-7`}
                    value={form.utilities || ''}
                    onChange={e => set({ utilities: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Area + Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Área (m²)</FieldLabel>
                <input
                  type="number"
                  min={1}
                  className={inputCls()}
                  value={form.size || ''}
                  onChange={e => set({ size: e.target.value ? Number(e.target.value) : '' })}
                  placeholder="15"
                />
              </div>
              <div>
                <FieldLabel>Tipo</FieldLabel>
                <select
                  className={inputCls()}
                  value={form.roomType}
                  onChange={e => set({ roomType: e.target.value as RoomDraft['roomType'] })}
                >
                  <option value="private">Quarto privado</option>
                  <option value="shared">Quarto partilhado</option>
                  <option value="studio">Estúdio</option>
                </select>
              </div>
            </div>

            {/* Bed + Bathroom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Cama</FieldLabel>
                <select
                  className={inputCls()}
                  value={form.bedType}
                  onChange={e => set({ bedType: e.target.value as RoomDraft['bedType'] })}
                >
                  <option value="single">Solteiro</option>
                  <option value="double">Casal</option>
                  <option value="bunk">Beliche</option>
                </select>
              </div>
              <div>
                <FieldLabel>Disponível a partir de</FieldLabel>
                <input
                  type="date"
                  className={inputCls(errors.availableFrom)}
                  value={form.availableFrom}
                  onChange={e => set({ availableFrom: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.availableFrom && <p className="text-xs text-red-500 mt-1">Data obrigatória</p>}
              </div>
            </div>

            {/* Toggles */}
            <div>
              <FieldLabel>Características</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'privateBathroom', label: 'WC privativo' },
                  { key: 'furnished', label: 'Mobilado' },
                  { key: 'hasWindow', label: 'Janela' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => set({ [opt.key]: !form[opt.key as keyof RoomDraft] } as any)}
                    className={`p-2.5 border-2 rounded-lg text-xs font-medium transition-all ${
                      form[opt.key as keyof RoomDraft]
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {form[opt.key as keyof RoomDraft] ? '✓ ' : ''}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mock photo selection */}
            <div>
              <FieldLabel>Foto do quarto</FieldLabel>
              <div className="flex gap-3">
                {ROOM_PHOTOS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedPhoto(i)}
                    className={`relative w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPhoto === i ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {selectedPhoto === i && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
                <div className="w-24 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <Camera className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Seleciona uma foto de exemplo (upload real em breve)</p>
            </div>

            {/* Publish now toggle */}
            <div className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
              form.publishNow ? 'border-green-400 bg-green-50' : 'border-border'
            }`} onClick={() => set({ publishNow: !form.publishNow })}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                form.publishNow ? 'bg-green-500 border-green-500' : 'border-muted-foreground/40'
              }`}>
                {form.publishNow && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Publicar imediatamente</p>
                <p className="text-xs text-muted-foreground">Sem check: fica em rascunho</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-5 border-t border-border">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" className="flex-1" onClick={handleSave}>
              <Check className="w-4 h-4 mr-1.5" />
              {initial ? 'Guardar alterações' : 'Adicionar quarto'}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, title: 'Propriedade', icon: Home },
  { number: 2, title: 'Quartos', icon: BedDouble },
  { number: 3, title: 'Regras', icon: Shield },
  { number: 4, title: 'Publicação', icon: Eye },
];

const UNIVERSITIES = ['ESTGV', 'UBI', 'IPG', 'UC', 'UA', 'UP', 'UL', 'UM'];

const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
];

// ─── Main component ────────────────────────────────────────────────────────────

export function NewListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addProperty, addRoom } = useProperties();

  const [step, setStep] = useState(1);
  const [property, setProperty] = useState<PropertyDraft>(defaultProperty);
  const [rooms, setRooms] = useState<RoomDraft[]>([]);
  const [rules, setRules] = useState<HouseRules>(defaultRules);
  const [selectedPropertyPhoto, setSelectedPropertyPhoto] = useState(0);

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomDraft | null>(null);
  const [propertyErrors, setPropertyErrors] = useState<Record<string, boolean>>({});

  const setP = (updates: Partial<PropertyDraft>) => setProperty(prev => ({ ...prev, ...updates }));
  const setR = (updates: Partial<HouseRules>) => setRules(prev => ({ ...prev, ...updates }));

  // ── Validation: step 1 ──
  const validateStep1 = () => {
    const errs: Record<string, boolean> = {};
    if (!property.title.trim()) errs.title = true;
    if (!property.address.trim()) errs.address = true;
    if (!property.city.trim()) errs.city = true;
    if (!property.university.trim()) errs.university = true;
    setPropertyErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) {
      toast.error('Preenche os campos obrigatórios');
      return;
    }
    if (step === 2 && rooms.length === 0) {
      toast.error('Adiciona pelo menos um quarto');
      return;
    }
    setStep(s => Math.min(s + 1, 4));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  // ── Room CRUD ──
  const handleAddRoom = (room: RoomDraft) => {
    setRooms(prev => [...prev, room]);
    setShowRoomModal(false);
    toast.success(`"${room.title}" adicionado`);
  };

  const handleEditRoom = (updated: RoomDraft) => {
    setRooms(prev => prev.map(r => r.tempId === updated.tempId ? updated : r));
    setEditingRoom(null);
    toast.success('Quarto atualizado');
  };

  const handleDeleteRoom = (tempId: string) => {
    setRooms(prev => prev.filter(r => r.tempId !== tempId));
    toast.success('Quarto removido');
  };

  const toggleRoomPublish = (tempId: string) => {
    setRooms(prev => prev.map(r =>
      r.tempId === tempId ? { ...r, publishNow: !r.publishNow } : r,
    ));
  };

  // ── Submission ──
  const buildAndSave = (publishAll: boolean) => {
    if (!user) return;

    const propertyId = `prop-${Date.now()}`;
    const now = new Date();

    const roomIds: string[] = [];
    const roomsToCreate = rooms.map((r, i) => {
      const roomId = `room-${Date.now()}-${i}`;
      roomIds.push(roomId);

      const ROOM_PHOTOS_LIST = [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
        'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&q=80',
      ];

      return {
        id: roomId,
        propertyId,
        landlordId: user.id,
        roomNumber: `Q${i + 1}`,
        title: r.title,
        description: `${r.roomType === 'private' ? 'Quarto privado' : r.roomType === 'shared' ? 'Quarto partilhado' : 'Estúdio'}${r.privateBathroom ? ' com WC privativo' : ''}${r.size ? `, ${r.size}m²` : ''}.`,
        images: [ROOM_PHOTOS_LIST[i % ROOM_PHOTOS_LIST.length]],
        size: r.size ? Number(r.size) : undefined,
        roomType: r.roomType as 'private' | 'shared' | 'studio',
        maxOccupants: r.roomType === 'shared' ? 2 : 1,
        privateBathroom: r.privateBathroom,
        balcony: false,
        desk: true,
        wardrobe: true,
        airConditioning: false,
        price: r.price,
        utilities: r.utilities > 0 ? r.utilities : undefined,
        availableFrom: new Date(r.availableFrom),
        minimumStay: 6,
        status: (publishAll || r.publishNow) ? 'available' as const : 'draft' as const,
        createdAt: now,
        updatedAt: now,
        views: 0,
      };
    });

    const newProperty = {
      id: propertyId,
      landlordId: user.id,
      title: property.title,
      description: property.description,
      address: property.address,
      city: property.city,
      zone: property.zone || property.city,
      distanceToUniversity: Number(property.distanceToUniversity) || 0,
      images: [PROPERTY_IMAGES[selectedPropertyPhoto]],
      amenities: {
        wifi: property.amenities.wifi,
        parking: property.amenities.parking,
        gym: false,
        laundry: property.amenities.laundry,
        kitchen: property.amenities.kitchen,
        livingRoom: property.amenities.livingRoom,
        backyard: property.amenities.backyard,
        airConditioning: false,
        heating: property.amenities.heating,
        dishwasher: false,
        microwave: false,
        elevator: property.amenities.elevator,
      },
      houseRules: {
        smoking: !rules.noSmoking,
        pets: !rules.noPets,
        parties: !rules.noParties,
        studentsOnly: rules.studentsOnly,
        quietHours: rules.quietHours || undefined,
        cleaningPolicy: rules.cleaningPolicy || undefined,
        visitorsPolicy: rules.visitorsPolicy || undefined,
        preferredGender: rules.preferredGender !== 'any' ? rules.preferredGender : undefined,
      },
      totalRooms: rooms.length,
      roomIds,
      wholePropertyAvailable: false,
      // Property is active if any rooms are being published, otherwise draft
      status: (publishAll || rooms.some(r => r.publishNow)) ? 'active' as const : 'draft' as const,
      verified: false,
      createdAt: now,
      updatedAt: now,
      views: 0,
    };

    addProperty(newProperty);
    roomsToCreate.forEach(r => addRoom(r));

    const publishedCount = roomsToCreate.filter(r => r.status === 'available').length;

    if (publishAll) {
      toast.success('Alojamento publicado!', {
        description: `${rooms.length} quarto${rooms.length > 1 ? 's' : ''} visível${rooms.length > 1 ? 'is' : ''} para estudantes.`,
      });
    } else if (publishedCount > 0) {
      toast.success('Alojamento ativo com quartos selecionados!', {
        description: `${publishedCount} quarto${publishedCount > 1 ? 's' : ''} publicado${publishedCount > 1 ? 's' : ''}, ${rooms.length - publishedCount} em rascunho.`,
      });
    } else {
      toast.success('Rascunho guardado!', {
        description: 'Todos os quartos ficaram em rascunho. Podes publicá-los em "Os meus alojamentos".',
      });
    }

    setTimeout(() => navigate('/landlord/listings'), 1200);
  };

  // ── Missing fields for preview ──
  const missingFields: string[] = [];
  if (!property.title) missingFields.push('Título da propriedade');
  if (!property.description) missingFields.push('Descrição');
  if (!property.address) missingFields.push('Morada');
  if (!property.distanceToUniversity) missingFields.push('Distância à universidade');
  if (rooms.length === 0) missingFields.push('Pelo menos um quarto');

  const AMENITY_OPTIONS = [
    { key: 'wifi', label: 'Wi-Fi', icon: Wifi },
    { key: 'kitchen', label: 'Cozinha', icon: ChefHat },
    { key: 'laundry', label: 'Lavandaria', icon: WashingMachine },
    { key: 'livingRoom', label: 'Sala comum', icon: Sofa },
    { key: 'parking', label: 'Estacionamento', icon: Car },
    { key: 'heating', label: 'Aquecimento', icon: Thermometer },
    { key: 'backyard', label: 'Jardim/Quintal', icon: Trees },
    { key: 'elevator', label: 'Elevador', icon: Layers },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/landlord/listings')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos alojamentos
          </button>
          <h1 className="text-2xl font-bold text-foreground">Publicar nova propriedade</h1>
          <p className="text-muted-foreground text-sm mt-1">Define a propriedade, os quartos e as regras antes de publicar.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = step > s.number;
            const isActive = step === s.number;
            return (
              <div key={s.number} className="flex items-center flex-1">
                <button
                  onClick={() => isDone && setStep(s.number)}
                  disabled={!isDone}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                    isActive ? 'bg-primary text-white' :
                    isDone ? 'bg-green-50 text-green-700 cursor-pointer hover:bg-green-100' :
                    'text-muted-foreground cursor-default'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-white/20' :
                    isDone ? 'bg-green-200' :
                    'bg-muted'
                  }`}>
                    {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{s.title}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${step > s.number ? 'bg-green-400' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="p-6 md:p-8">

          {/* ─── STEP 1: Property info ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Detalhes da propriedade</h2>
                <p className="text-sm text-muted-foreground">Informação da casa ou apartamento que irás arrendar por quartos.</p>
              </div>

              <div>
                <FieldLabel required>Título do anúncio</FieldLabel>
                <input
                  className={inputCls(propertyErrors.title)}
                  value={property.title}
                  onChange={e => setP({ title: e.target.value })}
                  placeholder="Ex: Apartamento T4 perto da ESTGV"
                  maxLength={100}
                />
                {propertyErrors.title && <p className="text-xs text-red-500 mt-1">Título obrigatório</p>}
              </div>

              <div>
                <FieldLabel>Descrição</FieldLabel>
                <textarea
                  className={`${inputCls()} resize-none`}
                  rows={4}
                  value={property.description}
                  onChange={e => setP({ description: e.target.value })}
                  placeholder="Descreve o espaço, a atmosfera, o que está incluído..."
                  maxLength={800}
                />
                <p className="text-xs text-muted-foreground mt-1">{property.description.length}/800</p>
              </div>

              <div>
                <FieldLabel required>Morada completa</FieldLabel>
                <input
                  className={inputCls(propertyErrors.address)}
                  value={property.address}
                  onChange={e => setP({ address: e.target.value })}
                  placeholder="Rua, número, andar"
                />
                {propertyErrors.address && <p className="text-xs text-red-500 mt-1">Morada obrigatória</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Zona / Bairro</FieldLabel>
                  <input
                    className={inputCls()}
                    value={property.zone}
                    onChange={e => setP({ zone: e.target.value })}
                    placeholder="Ex: Centro"
                  />
                </div>
                <div>
                  <FieldLabel required>Cidade</FieldLabel>
                  <input
                    className={inputCls(propertyErrors.city)}
                    value={property.city}
                    onChange={e => setP({ city: e.target.value })}
                    placeholder="Viseu"
                  />
                </div>
                <div>
                  <FieldLabel required>Universidade</FieldLabel>
                  <select
                    className={inputCls(propertyErrors.university)}
                    value={property.university}
                    onChange={e => setP({ university: e.target.value })}
                  >
                    {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Distância à universidade (km)</FieldLabel>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className={inputCls()}
                    value={property.distanceToUniversity}
                    onChange={e => setP({ distanceToUniversity: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="0.5"
                  />
                </div>
                <div>
                  <FieldLabel>Tempo a pé (minutos)</FieldLabel>
                  <input
                    type="number"
                    min="1"
                    className={inputCls()}
                    value={property.walkTimeMinutes}
                    onChange={e => setP({ walkTimeMinutes: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="5"
                  />
                </div>
              </div>

              {/* Utilities/bills */}
              <div>
                <FieldLabel>Despesas e contas</FieldLabel>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setP({ utilitiesIncluded: !property.utilitiesIncluded })}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 text-left transition-all ${
                      property.utilitiesIncluded
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-foreground'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      property.utilitiesIncluded ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                    }`}>
                      {property.utilitiesIncluded && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Despesas incluídas no preço</p>
                      <p className="text-xs text-muted-foreground">Água, luz, gás, internet incluídos na renda</p>
                    </div>
                  </button>
                  <input
                    className={inputCls()}
                    value={property.utilitiesNotes}
                    onChange={e => setP({ utilitiesNotes: e.target.value })}
                    placeholder="Notas sobre contas, IVA, consumo extra (opcional)"
                  />
                </div>
              </div>

              {/* Property photo selection */}
              <div>
                <FieldLabel>Foto da propriedade</FieldLabel>
                <div className="flex gap-3 flex-wrap">
                  {PROPERTY_IMAGES.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedPropertyPhoto(i)}
                      className={`relative w-28 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedPropertyPhoto === i ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {selectedPropertyPhoto === i && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                  <div className="w-28 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground">
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px]">Fazer upload</span>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <FieldLabel>Áreas comuns e comodidades</FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AMENITY_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const checked = property.amenities[opt.key];
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setP({ amenities: { ...property.amenities, [opt.key]: !checked } })}
                        className={`flex items-center gap-2 p-2.5 border-2 rounded-xl transition-all text-left ${
                          checked
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-foreground hover:border-primary/40'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Rooms ────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Quartos</h2>
                  <p className="text-sm text-muted-foreground">
                    Adiciona cada quarto individualmente com preço, características e disponibilidade.
                  </p>
                </div>
                <Button onClick={() => setShowRoomModal(true)} size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Novo quarto
                </Button>
              </div>

              {rooms.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
                  <BedDouble className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Ainda não adicionaste nenhum quarto.</p>
                  <Button variant="outline" onClick={() => setShowRoomModal(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Adicionar primeiro quarto
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map((room, i) => (
                    <div
                      key={room.tempId}
                      className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card hover:border-primary/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BedDouble className="w-5 h-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground">{room.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                            room.publishNow
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {room.publishNow ? 'Publicar' : 'Rascunho'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          €{room.price}/mês
                          {room.utilities > 0 && ` + €${room.utilities} desp.`}
                          {room.size ? ` · ${room.size}m²` : ''}
                          {room.privateBathroom ? ' · WC privativo' : ''}
                          {room.availableFrom ? ` · desde ${new Date(room.availableFrom).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => toggleRoomPublish(room.tempId)}
                          title="Alternar publicar/rascunho"
                          className="w-8 h-8 rounded-lg border border-border hover:bg-primary/5 flex items-center justify-center transition-colors"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setEditingRoom(room)}
                          className="w-8 h-8 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.tempId)}
                          className="w-8 h-8 rounded-lg border border-red-200 hover:bg-red-50 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setShowRoomModal(true)}
                    className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-primary/30 rounded-xl text-primary hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar mais um quarto
                  </button>
                </div>
              )}

              {rooms.length > 0 && (
                <div className="p-4 bg-muted/40 rounded-xl text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{rooms.length} quarto{rooms.length !== 1 ? 's' : ''} adicionado{rooms.length !== 1 ? 's' : ''}</span>
                    <span className="font-medium text-foreground">
                      {rooms.filter(r => r.publishNow).length} para publicar · {rooms.filter(r => !r.publishNow).length} em rascunho
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 3: House rules ──────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Regras da casa</h2>
                <p className="text-sm text-muted-foreground">Define o que é permitido e o perfil de ocupante que procuras.</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide text-[11px]">Restrições</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Toggle checked={rules.studentsOnly} onChange={v => setR({ studentsOnly: v })} label="Apenas estudantes" icon={GraduationCap} />
                  <Toggle checked={rules.noParties} onChange={v => setR({ noParties: v })} label="Sem festas" icon={PartyPopper} />
                  <Toggle checked={rules.noPets} onChange={v => setR({ noPets: v })} label="Sem animais de estimação" icon={PawPrint} />
                  <Toggle checked={rules.noSmoking} onChange={v => setR({ noSmoking: v })} label="Proibido fumar" icon={Cigarette} />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide text-[11px]">Políticas</p>
                <div className="space-y-4">
                  <div>
                    <FieldLabel>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Horas de silêncio
                      </div>
                    </FieldLabel>
                    <input
                      className={inputCls()}
                      value={rules.quietHours}
                      onChange={e => setR({ quietHours: e.target.value })}
                      placeholder="Ex: Silêncio após as 23h00"
                    />
                  </div>
                  <div>
                    <FieldLabel>
                      <div className="flex items-center gap-2">
                        <SprayCan className="w-4 h-4" />
                        Limpeza das áreas comuns
                      </div>
                    </FieldLabel>
                    <input
                      className={inputCls()}
                      value={rules.cleaningPolicy}
                      onChange={e => setR({ cleaningPolicy: e.target.value })}
                      placeholder="Ex: Rotação semanal entre moradores"
                    />
                  </div>
                  <div>
                    <FieldLabel>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Política de visitas
                      </div>
                    </FieldLabel>
                    <input
                      className={inputCls()}
                      value={rules.visitorsPolicy}
                      onChange={e => setR({ visitorsPolicy: e.target.value })}
                      placeholder="Ex: Visitas permitidas com aviso prévio"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide text-[11px]">Perfil do ocupante ideal</p>
                <div>
                  <FieldLabel>Género preferido</FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'any', label: 'Indiferente' },
                      { value: 'male', label: 'Masculino' },
                      { value: 'female', label: 'Feminino' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setR({ preferredGender: opt.value as HouseRules['preferredGender'] })}
                        className={`p-2.5 border-2 rounded-xl text-sm font-medium transition-all ${
                          rules.preferredGender === opt.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-foreground hover:border-primary/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rules preview */}
              {(rules.studentsOnly || rules.noParties || rules.noPets || rules.noSmoking) && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs font-semibold text-amber-800 mb-2">Regras ativas:</p>
                  <div className="flex flex-wrap gap-2">
                    {rules.studentsOnly && <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">Só estudantes</span>}
                    {rules.noParties && <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">Sem festas</span>}
                    {rules.noPets && <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">Sem animais</span>}
                    {rules.noSmoking && <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">Não fumadores</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 4: Preview & Publish ────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Pré-visualização e publicação</h2>
                <p className="text-sm text-muted-foreground">Revê tudo antes de publicar. Podes publicar agora ou guardar como rascunho.</p>
              </div>

              {/* Missing field warnings */}
              {missingFields.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 mb-1.5">Campos em falta:</p>
                    <ul className="space-y-0.5">
                      {missingFields.map(f => (
                        <li key={f} className="text-xs text-amber-700">· {f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Property summary */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="relative h-36">
                  <img
                    src={PROPERTY_IMAGES[selectedPropertyPhoto]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-white">
                    <p className="font-bold text-lg">{property.title || 'Sem título'}</p>
                    <p className="text-xs text-white/80">{property.address && `${property.address} · `}{property.city}</p>
                  </div>
                </div>
                <div className="p-4 bg-card">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-foreground">{rooms.length}</p>
                      <p className="text-xs text-muted-foreground">quartos</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{rooms.filter(r => r.publishNow).length}</p>
                      <p className="text-xs text-muted-foreground">para publicar</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-600">{rooms.filter(r => !r.publishNow).length}</p>
                      <p className="text-xs text-muted-foreground">em rascunho</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {property.university || '–'}
                      </p>
                      <p className="text-xs text-muted-foreground">universidade</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room list */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Quartos a publicar</p>
                <div className="space-y-2">
                  {rooms.map(room => (
                    <div key={room.tempId} className="flex items-center gap-3 p-3 border border-border rounded-xl">
                      <button
                        onClick={() => toggleRoomPublish(room.tempId)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          room.publishNow ? 'bg-green-500 border-green-500' : 'border-muted-foreground/40'
                        }`}
                      >
                        {room.publishNow && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{room.title}</p>
                        <p className="text-xs text-muted-foreground">
                          €{room.price}/mês{room.utilities > 0 ? ` + €${room.utilities} desp.` : ''}
                          {room.availableFrom ? ` · desde ${new Date(room.availableFrom).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        room.publishNow ? 'bg-green-50 text-green-700' : 'bg-muted text-muted-foreground'
                      }`}>
                        {room.publishNow ? 'Publicar' : 'Rascunho'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules summary */}
              {(rules.studentsOnly || rules.noParties || rules.noPets || rules.noSmoking || rules.quietHours) && (
                <div className="p-4 bg-muted/40 rounded-xl">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Regras ativas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rules.studentsOnly && <span className="text-xs px-2 py-1 bg-card border border-border rounded-full">Só estudantes</span>}
                    {rules.noParties && <span className="text-xs px-2 py-1 bg-card border border-border rounded-full">Sem festas</span>}
                    {rules.noPets && <span className="text-xs px-2 py-1 bg-card border border-border rounded-full">Sem animais</span>}
                    {rules.noSmoking && <span className="text-xs px-2 py-1 bg-card border border-border rounded-full">Não fumadores</span>}
                    {rules.quietHours && <span className="text-xs px-2 py-1 bg-card border border-border rounded-full">{rules.quietHours}</span>}
                  </div>
                </div>
              )}

              {/* Action cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => buildAndSave(false)}
                  className="p-5 border-2 border-border rounded-2xl text-left hover:border-primary/40 hover:bg-muted/30 transition-all group"
                >
                  <Save className="w-6 h-6 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                  <p className="font-semibold text-foreground mb-1">Guardar rascunho</p>
                  <p className="text-xs text-muted-foreground">
                    {rooms.filter(r => r.publishNow).length > 0
                      ? `${rooms.filter(r => r.publishNow).length} quarto${rooms.filter(r => r.publishNow).length > 1 ? 's' : ''} marcado${rooms.filter(r => r.publishNow).length > 1 ? 's' : ''} para publicar, restantes em rascunho`
                      : 'Propriedade e quartos ficam em rascunho'}
                  </p>
                </button>

                <button
                  disabled={missingFields.length > 0}
                  onClick={() => buildAndSave(true)}
                  className={`p-5 border-2 rounded-2xl text-left transition-all ${
                    missingFields.length > 0
                      ? 'border-border bg-muted/20 opacity-60 cursor-not-allowed'
                      : 'border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer'
                  }`}
                >
                  <CheckCircle className={`w-6 h-6 mb-3 transition-colors ${missingFields.length > 0 ? 'text-muted-foreground' : 'text-primary'}`} />
                  <p className="font-semibold text-foreground mb-1">Publicar tudo agora</p>
                  <p className="text-xs text-muted-foreground">
                    {missingFields.length > 0
                      ? 'Preenche os campos obrigatórios primeiro'
                      : `${rooms.length} quarto${rooms.length !== 1 ? 's' : ''} ficarão visíveis para estudantes`}
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Voltar
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => buildAndSave(false)} className="hidden sm:flex">
                <Save className="w-4 h-4 mr-1.5" />
                Guardar rascunho
              </Button>

              {step < 4 && (
                <Button onClick={handleNext}>
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Room add modal */}
      {showRoomModal && (
        <RoomFormModal
          onSave={handleAddRoom}
          onClose={() => setShowRoomModal(false)}
        />
      )}

      {/* Room edit modal */}
      {editingRoom && (
        <RoomFormModal
          initial={editingRoom}
          onSave={handleEditRoom}
          onClose={() => setEditingRoom(null)}
        />
      )}
    </div>
  );
}

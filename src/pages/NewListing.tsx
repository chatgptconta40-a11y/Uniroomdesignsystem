import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Pencil,
  Copy,
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
  MapPin,
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
import { useUserRestrictions } from '../hooks/useUserRestrictions';
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
  description: string;
  images: string[];
}

interface SchoolEntry {
  school: string;
  distanceKm: number | '';
  walkMinutes: number | '';
}

interface PropertyDraft {
  title: string;
  description: string;
  address: string;
  zone: string;
  city: string;
  nearbySchools: SchoolEntry[];
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

type StepNumber = 1 | 2 | 3 | 4;

const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
];

const ROOM_PHOTOS = [
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
];

const defaultProperty: PropertyDraft = {
  title: '',
  description: '',
  address: '',
  zone: '',
  city: 'Viseu',
  nearbySchools: [{ school: 'ESTGV', distanceKm: '', walkMinutes: '' }],
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
  description: '',
  images: [],
});

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const STEPS: Array<{ number: StepNumber; title: string; icon: React.ElementType }> = [
  { number: 1, title: 'Propriedade', icon: Home },
  { number: 2, title: 'Quartos', icon: BedDouble },
  { number: 3, title: 'Regras', icon: Shield },
  { number: 4, title: 'Publicar', icon: CheckCircle },
];

const CITY_OPTIONS = [
  'Viseu',
  'Porto',
  'Lisboa',
  'Coimbra',
  'Aveiro',
  'Braga',
  'Guarda',
  'Castelo Branco',
];

const SCHOOL_OPTIONS = [
  'ESTGV',
  'IPV — Instituto Politécnico de Viseu',
  'Escola Secundária Alves Martins',
  'Escola Secundária de Emídio Navarro',
  'Escola Secundária de Viriato',
  'Universidade do Porto',
  'Universidade de Lisboa',
  'Universidade de Coimbra',
  'Universidade de Aveiro',
  'Universidade do Minho',
  'Universidade da Beira Interior',
  'Outra',
];

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function inputCls(error?: boolean | string) {
  return `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-input-background transition-colors ${
    error ? 'border-red-400' : 'border-border'
  }`;
}

function Toggle({
  checked,
  onChange,
  label,
  icon: Icon,
}: {
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
          : 'border-border bg-card text-foreground hover:border-primary/40'
      }`}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span className="text-sm font-medium flex-1">{label}</span>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          checked ? 'bg-primary border-primary' : 'border-muted-foreground/40'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  );
}

// ─── Room modal ───────────────────────────────────────────────────────────────

interface RoomFormModalProps {
  initial?: RoomDraft;
  onSave: (room: RoomDraft) => void;
  onClose: () => void;
}

function RoomFormModal({ initial, onSave, onClose }: RoomFormModalProps) {
  const [form, setForm] = useState<RoomDraft>(initial ?? emptyRoom());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Photos: start from the room's saved images, falling back to the stock set.
  const [roomPhotos, setRoomPhotos] = useState<string[]>(
    initial?.images?.length ? initial.images : ROOM_PHOTOS,
  );
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  const todayIso = new Date().toISOString().split('T')[0];

  const set = (updates: Partial<RoomDraft>) => {
    setForm(prev => ({ ...prev, ...updates }));
    const updatedKeys = Object.keys(updates);
    if (updatedKeys.length > 0) {
      setErrors(prev => {
        const next = { ...prev };
        updatedKeys.forEach(key => delete next[key]);
        return next;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const title = form.title.trim();
    const size = form.size === '' ? undefined : Number(form.size);

    if (title.length < 3) errs.title = 'Dá um nome claro ao quarto.';
    if (!form.price) errs.price = 'Indica a renda mensal.';
    else if (form.price < 100) errs.price = 'A renda parece demasiado baixa. Confirma o valor.';
    else if (form.price > 1200) errs.price = 'A renda parece demasiado alta para quarto universitário.';

    if (size !== undefined && (Number.isNaN(size) || size < 6 || size > 80)) {
      errs.size = 'A área deve estar entre 6m² e 80m².';
    }

    if (!form.availableFrom) errs.availableFrom = 'Indica a data de disponibilidade.';
    else if (form.availableFrom < todayIso) errs.availableFrom = 'A data não pode ser anterior a hoje.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRoomPhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;
    try {
      const dataUrls = await Promise.all(validFiles.map(readImageFile));
      setRoomPhotos(prev => {
        const next = [...prev, ...dataUrls];
        setSelectedPhoto(prev.length);
        return next;
      });
    } catch {
      // silently ignore
    }
  };

  const removeRoomPhoto = (index: number) => {
    setRoomPhotos(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      setSelectedPhoto(cur => {
        if (index === cur) return 0;
        if (index < cur) return Math.max(0, cur - 1);
        return Math.min(cur, next.length - 1);
      });
      return next;
    });
  };

  const handleSave = () => {
    if (!validate()) return;
    const selectedImages = roomPhotos.length > 0
      ? [roomPhotos[selectedPhoto], ...roomPhotos.filter((_, i) => i !== selectedPhoto)]
      : ROOM_PHOTOS;
    onSave({ ...form, title: form.title.trim(), images: selectedImages });
  };

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
            <div>
              <FieldLabel required>Nome do quarto</FieldLabel>
              <input
                className={inputCls(errors.title)}
                value={form.title}
                onChange={e => set({ title: e.target.value })}
                placeholder="Ex: Quarto 1, Suite, Quarto duplo..."
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <FieldLabel required>Renda (€/mês)</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                <input
                  type="number"
                  min={100}
                  max={1200}
                  className={`${inputCls(errors.price)} pl-7`}
                  value={form.price || ''}
                  onChange={e => set({ price: Number(e.target.value) })}
                  placeholder="250"
                />
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Área (m²)</FieldLabel>
                <input
                  type="number"
                  min={6}
                  max={80}
                  className={inputCls(errors.size)}
                  value={form.size || ''}
                  onChange={e => set({ size: e.target.value ? Number(e.target.value) : '' })}
                  placeholder="15"
                />
                {errors.size && <p className="text-xs text-red-500 mt-1">{errors.size}</p>}
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
                <FieldLabel required>Disponível a partir de</FieldLabel>
                <input
                  type="date"
                  className={inputCls(errors.availableFrom)}
                  value={form.availableFrom}
                  onChange={e => set({ availableFrom: e.target.value })}
                  min={todayIso}
                />
                {errors.availableFrom && <p className="text-xs text-red-500 mt-1">{errors.availableFrom}</p>}
              </div>
            </div>

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
                    onClick={() => set({ [opt.key]: !form[opt.key as keyof RoomDraft] } as Partial<RoomDraft>)}
                    className={`p-2.5 border-2 rounded-lg text-xs font-medium transition-all ${
                      form[opt.key as keyof RoomDraft]
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {form[opt.key as keyof RoomDraft] ? '✓ ' : ''}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Notas adicionais</FieldLabel>
              <textarea
                className={`${inputCls()} resize-none`}
                rows={3}
                value={form.description}
                onChange={e => set({ description: e.target.value })}
                placeholder="Ex: Vista para jardim, secretária grande, boa luminosidade natural..."
              />
            </div>

            <div>
              <FieldLabel>Fotos do quarto</FieldLabel>
              <p className="text-xs text-muted-foreground mb-2">
                Carrega fotografias reais do quarto. A selecionada será a imagem principal.
              </p>
              <div className="flex gap-3 flex-wrap">
                {roomPhotos.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className={`group relative w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPhoto === i ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedPhoto(i)}
                      className="w-full h-full"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                    {selectedPhoto === i && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeRoomPhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <label className="w-24 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-medium">Adicionar</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => handleRoomPhotoUpload(e.target.files)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>{initial ? 'Guardar alterações' : 'Adicionar quarto'}</Button>
          </div>
        </Card>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function NewListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addProperty, addRoom, refreshProperties } = useProperties();

  const [step, setStep] = useState<StepNumber>(1);
  const [property, setProperty] = useState<PropertyDraft>(defaultProperty);
  const [rules, setRules] = useState<HouseRules>(defaultRules);
  const [rooms, setRooms] = useState<RoomDraft[]>([]);
  const [propertyErrors, setPropertyErrors] = useState<Record<string, string>>({});
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomDraft | null>(null);
  const [propertyPhotoOptions, setPropertyPhotoOptions] = useState<string[]>(PROPERTY_IMAGES);
  const [selectedPropertyPhoto, setSelectedPropertyPhoto] = useState(0);
  const [saving, setSaving] = useState(false);

  const {
    isSuspended,
    isBlockedFromPublishing: isBlocked,
  } = useUserRestrictions(user?.id);

  const setP = (updates: Partial<PropertyDraft>) => {
    setProperty(prev => ({ ...prev, ...updates }));
    const updatedKeys = Object.keys(updates);
    if (updatedKeys.length > 0) {
      setPropertyErrors(prev => {
        const next = { ...prev };
        updatedKeys.forEach(key => delete next[key]);
        return next;
      });
    }
  };

  const setR = (updates: Partial<HouseRules>) => {
    setRules(prev => ({ ...prev, ...updates }));
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    const firstSchoolEntry = property.nearbySchools[0];
    const walkTime = firstSchoolEntry?.walkMinutes === '' ? undefined : Number(firstSchoolEntry?.walkMinutes);

    if (property.title.trim().length < 8) errs.title = 'Dá um título claro com pelo menos 8 caracteres.';
    if (property.description.trim().length < 40) errs.description = 'Escreve uma descrição um pouco mais completa.';
    if (property.address.trim().length < 8) errs.address = 'Indica uma morada suficientemente completa.';
    if (property.zone.trim().length < 2) errs.zone = 'Indica a zona ou bairro para melhorar a pesquisa.';
    if (!property.city.trim()) errs.city = 'Indica a cidade.';
    const firstSchool = property.nearbySchools[0];
    if (!firstSchool?.school.trim()) errs.school = 'Seleciona pelo menos uma escola.';
    if (!firstSchool?.distanceKm) errs.distanceToSchool = 'Indica a distância à escola principal.';
    else if (Number(firstSchool.distanceKm) <= 0 || Number(firstSchool.distanceKm) > 20) errs.distanceToSchool = 'A distância deve estar entre 0.1km e 20km.';
    if (walkTime !== undefined && (Number.isNaN(walkTime) || walkTime < 1 || walkTime > 120)) {
      errs.walkTime = 'O tempo a pé deve estar entre 1 e 120 minutos.';
    }

    setPropertyErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (isSuspended) {
      toast.error('A tua conta está suspensa. Não é possível continuar.');
      return;
    }

    if (step === 1 && !validateStep1()) {
      toast.error('Preenche os campos obrigatórios');
      return;
    }

    if (step === 2 && rooms.length === 0) {
      toast.error('Adiciona pelo menos um quarto');
      return;
    }

    setStep(s => Math.min(s + 1, 4) as StepNumber);
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1) as StepNumber);

  const handleAddRoom = (room: RoomDraft) => {
    setRooms(prev => [...prev, room]);
    setShowRoomModal(false);
    toast.success(`"${room.title}" adicionado`);
  };

  const handleEditRoom = (updated: RoomDraft) => {
    setRooms(prev => prev.map(room => room.tempId === updated.tempId ? updated : room));
    setEditingRoom(null);
    toast.success('Quarto atualizado');
  };

  const handleDeleteRoom = (tempId: string) => {
    setRooms(prev => prev.filter(room => room.tempId !== tempId));
    toast.success('Quarto removido');
  };

  const handleDuplicateRoom = (room: RoomDraft) => {
    const duplicate: RoomDraft = {
      ...room,
      tempId: Math.random().toString(36).slice(2),
      title: `${room.title} (cópia)`,
      publishNow: false,
    };

    setRooms(prev => [...prev, duplicate]);
    toast.success(`"${duplicate.title}" duplicado — fica em rascunho`);
  };

  const handlePropertyPhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (validFiles.length === 0) {
      toast.error('Escolhe ficheiros de imagem válidos.');
      return;
    }

    try {
      const uploadedImages = await Promise.all(validFiles.map(readImageFile));

      setPropertyPhotoOptions(prev => {
        const next = [...prev, ...uploadedImages];
        setSelectedPropertyPhoto(prev.length);
        return next;
      });

      toast.success(
        validFiles.length === 1
          ? 'Foto adicionada ao alojamento'
          : `${validFiles.length} fotos adicionadas ao alojamento`,
      );
    } catch {
      toast.error('Não foi possível carregar a imagem.');
    }
  };

  const removePropertyPhoto = (index: number) => {
    setPropertyPhotoOptions(prev => {
      if (prev.length <= 1) {
        toast.error('Mantém pelo menos uma foto.');
        return prev;
      }

      const next = prev.filter((_, i) => i !== index);
      setSelectedPropertyPhoto(current => {
        if (index === current) return 0;
        if (index < current) return Math.max(0, current - 1);
        return Math.min(current, next.length - 1);
      });

      return next;
    });
  };

  const toggleRoomPublish = (tempId: string) => {
    setRooms(prev => prev.map(room =>
      room.tempId === tempId ? { ...room, publishNow: !room.publishNow } : room,
    ));
  };

  const buildAndSave = async (mode: 'draft' | 'selected' | 'all') => {
    if (!user) {
      toast.error('Tens de iniciar sessão para criar alojamentos.');
      return;
    }

    if (saving) return;

    if (isSuspended) {
      toast.error('A tua conta está suspensa. Não é possível criar ou guardar anúncios.');
      return;
    }

    if (mode !== 'draft' && isBlocked) {
      toast.error('A tua conta está bloqueada de publicar. Guarda como rascunho.');
      return;
    }

    if (mode === 'draft') {
      if (property.title.trim().length < 3) {
        setPropertyErrors({ title: 'Dá pelo menos um nome curto ao rascunho.' });
        setStep(1);
        toast.error('Dá um nome ao rascunho antes de guardar.');
        return;
      }
    } else {
      if (!validateStep1()) {
        setStep(1);
        toast.error('Revê os dados da propriedade antes de publicar.');
        return;
      }

      if (rooms.length === 0) {
        setStep(2);
        toast.error('Adiciona pelo menos um quarto antes de publicar.');
        return;
      }

      const selectedRoomsCount = rooms.filter(room => room.publishNow).length;
      if (mode === 'selected' && selectedRoomsCount === 0) {
        setStep(4);
        toast.error('Seleciona pelo menos um quarto para publicar.');
        return;
      }
    }

    setSaving(true);

    let saveSucceeded = false;
    try {
      const propertyId = crypto.randomUUID();
      const now = new Date();

      const roomIds: string[] = [];
      const roomsToCreate = rooms.map((room, index) => {
        const roomId = crypto.randomUUID();
        roomIds.push(roomId);

        const roomStatus =
          mode === 'draft' ? 'draft' as const :
          mode === 'all' ? 'available' as const :
          room.publishNow ? 'available' as const : 'draft' as const;

        return {
          id: roomId,
          propertyId,
          landlordId: user.id,
          roomNumber: `Q${index + 1}`,
          title: room.title,
          description: `${room.roomType === 'private' ? 'Quarto privado' : room.roomType === 'shared' ? 'Quarto partilhado' : 'Estúdio'}${room.privateBathroom ? ' com WC privativo' : ''}${room.size ? `, ${room.size}m²` : ''}.`,
          images: room.images?.length ? room.images : [ROOM_PHOTOS[index % ROOM_PHOTOS.length]],
          size: room.size ? Number(room.size) : undefined,
          roomType: room.roomType,
          maxOccupants: room.roomType === 'shared' ? 2 : 1,
          privateBathroom: room.privateBathroom,
          balcony: false,
          desk: true,
          wardrobe: true,
          airConditioning: false,
          price: room.price,
          utilities: room.utilities > 0 ? room.utilities : undefined,
          availableFrom: room.availableFrom ? new Date(room.availableFrom) : now,
          minimumStay: 6,
          status: roomStatus,
          createdAt: now,
          updatedAt: now,
          views: 0,
        };
      });

      const propertyStatus = mode === 'draft' ? 'draft' as const : 'active' as const;
      const selectedMainImage = propertyPhotoOptions[selectedPropertyPhoto] || propertyPhotoOptions[0] || PROPERTY_IMAGES[0];
      const orderedPropertyImages = [
        selectedMainImage,
        ...propertyPhotoOptions.filter((image, index) => index !== selectedPropertyPhoto && image !== selectedMainImage),
      ];

      const newProperty = {
        id: propertyId,
        landlordId: user.id,
        title: property.title.trim(),
        description: property.description.trim(),
        address: property.address.trim(),
        city: property.city.trim(),
        zone: property.zone.trim() || property.city.trim(),
        distanceToUniversity: Number(property.nearbySchools[0]?.distanceKm) || 0,
        images: orderedPropertyImages,
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
          preferredGender: rules.preferredGender,
        },
        totalRooms: rooms.length,
        roomIds,
        wholePropertyAvailable: false,
        status: propertyStatus,
        verified: false,
        createdAt: now,
        updatedAt: now,
        views: 0,
      };

      await addProperty(newProperty, { skipRefresh: true });
      for (const room of roomsToCreate) {
        await addRoom(room, { skipRefresh: true });
      }
      await refreshProperties();
      window.dispatchEvent(new Event('uniroom:properties-updated'));

      saveSucceeded = true;

      const publishedCount = roomsToCreate.filter(room => room.status === 'available').length;

      if (mode === 'draft') {
        toast.success('Rascunho guardado!', {
          description: 'Nada ficou visível para estudantes. Podes publicar quando estiveres pronto.',
        });
      } else if (mode === 'all') {
        toast.success('Alojamento publicado!', {
          description: `${rooms.length} quarto${rooms.length > 1 ? 's' : ''} visível${rooms.length > 1 ? 'is' : ''} para estudantes.`,
        });
      } else {
        toast.success('Alojamento ativo com quartos selecionados!', {
          description: `${publishedCount} publicado${publishedCount > 1 ? 's' : ''}, ${rooms.length - publishedCount} em rascunho.`,
        });
      }
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : 'Não foi possível guardar o alojamento.';
      toast.error('Falha ao publicar', { description: message });
    } finally {
      setSaving(false);
    }

    if (saveSucceeded) {
      setTimeout(
        () => navigate('/landlord/listings', { state: { refresh: Date.now() } }),
        900,
      );
    }
  };

  const selectedCount = rooms.filter(room => room.publishNow).length;

  const missingFields: string[] = [];
  if (property.title.trim().length < 8) missingFields.push('Título da propriedade');
  if (property.description.trim().length < 40) missingFields.push('Descrição completa');
  if (property.address.trim().length < 8) missingFields.push('Morada completa');
  if (property.zone.trim().length < 2) missingFields.push('Zona ou bairro');
  if (!property.city.trim()) missingFields.push('Cidade');
  if (!property.nearbySchools[0]?.school.trim()) missingFields.push('Escola');
  if (!property.nearbySchools[0]?.distanceKm) missingFields.push('Distância à escola');
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
        <div className="mb-6">
          <button
            onClick={() => navigate('/landlord/listings')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos alojamentos
          </button>

          <h1 className="text-2xl font-bold text-foreground">Publicar nova propriedade</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define a propriedade, os quartos e as regras antes de publicar.
          </p>
        </div>

        {isSuspended && (
          <div className="mb-6 p-5 bg-red-50 border border-red-300 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-800 mb-1">Conta suspensa — criação de anúncios bloqueada</p>
              <p className="text-sm text-red-700">
                A tua conta está suspensa pela equipa UniRoom. Não podes criar, guardar ou publicar novos anúncios enquanto a suspensão estiver ativa.
              </p>
            </div>
          </div>
        )}

        <div className={`flex items-center gap-0 mb-8 ${isSuspended ? 'opacity-40 pointer-events-none' : ''}`}>
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const isDone = step > item.number;
            const isActive = step === item.number;

            return (
              <div key={item.number} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => isDone && setStep(item.number)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary text-white'
                      : isDone
                        ? 'bg-primary/10 text-primary cursor-pointer'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">{item.title}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${step > item.number ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Dados da propriedade</h2>
                <p className="text-sm text-muted-foreground">Esta informação será usada na pesquisa dos estudantes.</p>
              </div>

              <div>
                <FieldLabel required>Título da casa/apartamento</FieldLabel>
                <input
                  className={inputCls(propertyErrors.title)}
                  value={property.title}
                  onChange={e => setP({ title: e.target.value })}
                  placeholder="Ex: Casa T3 perto da ESTGV ou Apartamento T2 no centro"
                />
                {propertyErrors.title && <p className="text-xs text-red-500 mt-1">{propertyErrors.title}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Morada</FieldLabel>
                  <input
                    className={inputCls(propertyErrors.address)}
                    value={property.address}
                    onChange={e => setP({ address: e.target.value })}
                    placeholder="Rua, número, zona..."
                  />
                  {propertyErrors.address && <p className="text-xs text-red-500 mt-1">{propertyErrors.address}</p>}
                </div>

                <div>
                  <FieldLabel required>Zona/Bairro</FieldLabel>
                  <input
                    className={inputCls(propertyErrors.zone)}
                    value={property.zone}
                    onChange={e => setP({ zone: e.target.value })}
                    placeholder="Ex: Centro, Marquês, Repeses..."
                  />
                  {propertyErrors.zone && <p className="text-xs text-red-500 mt-1">{propertyErrors.zone}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <FieldLabel required>Cidade</FieldLabel>
                  <select
                    className={inputCls(propertyErrors.city)}
                    value={property.city}
                    onChange={e => setP({ city: e.target.value })}
                  >
                    {CITY_OPTIONS.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {propertyErrors.city && <p className="text-xs text-red-500 mt-1">{propertyErrors.city}</p>}
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <FieldLabel required>Escolas próximas</FieldLabel>
                      <p className="text-xs text-muted-foreground -mt-1">Adiciona todas as escolas (ensino superior ou secundário) a que o alojamento é próximo.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setP({
                        nearbySchools: [
                          ...property.nearbySchools,
                          { school: 'ESTGV', distanceKm: '', walkMinutes: '' },
                        ],
                      })}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                  </div>

                  <div className="space-y-2">
                    {property.nearbySchools.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border transition-colors ${
                          idx === 0 && (propertyErrors.school || propertyErrors.distanceToSchool)
                            ? 'border-red-300 bg-red-50/40'
                            : 'border-border bg-muted/20 hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-0 divide-x divide-border">
                          <div className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0">
                            <GraduationCap className="w-4 h-4 text-primary flex-shrink-0" />
                            <select
                              className="bg-transparent border-none outline-none text-sm font-medium text-foreground w-full cursor-pointer"
                              value={entry.school}
                              onChange={e => {
                                const updated = property.nearbySchools.map((s, i) =>
                                  i === idx ? { ...s, school: e.target.value } : s,
                                );
                                setP({ nearbySchools: updated });
                              }}
                            >
                              {SCHOOL_OPTIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5 px-3 py-2.5 w-28 flex-shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <input
                              type="number"
                              min={0.1}
                              max={20}
                              step={0.1}
                              className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground/60"
                              value={entry.distanceKm}
                              onChange={e => {
                                const updated = property.nearbySchools.map((s, i) =>
                                  i === idx ? { ...s, distanceKm: e.target.value ? Number(e.target.value) : '' } : s,
                                );
                                setP({ nearbySchools: updated });
                              }}
                              placeholder="0.5 km"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 px-3 py-2.5 w-28 flex-shrink-0">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <input
                              type="number"
                              min={1}
                              max={120}
                              className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground/60"
                              value={entry.walkMinutes}
                              onChange={e => {
                                const updated = property.nearbySchools.map((s, i) =>
                                  i === idx ? { ...s, walkMinutes: e.target.value ? Number(e.target.value) : '' } : s,
                                );
                                setP({ nearbySchools: updated });
                              }}
                              placeholder="8 min"
                            />
                          </div>

                          {property.nearbySchools.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setP({
                                nearbySchools: property.nearbySchools.filter((_, i) => i !== idx),
                              })}
                              className="px-3 py-2.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(propertyErrors.school || propertyErrors.distanceToSchool) && (
                    <p className="text-xs text-red-500 mt-1.5">
                      {propertyErrors.school || propertyErrors.distanceToSchool}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <FieldLabel>Fotos da casa/apartamento</FieldLabel>
                <p className="text-xs text-muted-foreground mb-3">
                  Carrega fotografias reais do alojamento. A foto selecionada será usada como imagem principal.
                </p>

                <div className="flex gap-3 flex-wrap">
                  {propertyPhotoOptions.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className={`group relative w-32 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedPropertyPhoto === index ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPropertyPhoto(index)}
                        className="w-full h-full"
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>

                      {selectedPropertyPhoto === index && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                          <Check className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removePropertyPhoto(index)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Remover foto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <label className="w-32 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary cursor-pointer">
                    <Camera className="w-5 h-5" />
                    <span className="text-[11px] font-medium">Adicionar fotos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={event => handlePropertyPhotoUpload(event.target.files)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <FieldLabel required>Descrição</FieldLabel>
                <textarea
                  rows={5}
                  className={inputCls(propertyErrors.description)}
                  value={property.description}
                  onChange={e => setP({ description: e.target.value })}
                  placeholder="Descreve o alojamento, ambiente da casa, transportes, regras principais..."
                />
                {propertyErrors.description && <p className="text-xs text-red-500 mt-1">{propertyErrors.description}</p>}
              </div>

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

              <button
                type="button"
                onClick={() => setP({ utilitiesIncluded: !property.utilitiesIncluded })}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  property.utilitiesIncluded
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  property.utilitiesIncluded ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                }`}>
                  {property.utilitiesIncluded && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-medium">Despesas incluídas no preço</p>
                  <p className="text-xs text-muted-foreground">Água, luz, gás e internet incluídos na renda.</p>
                </div>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Quartos</h2>
                  <p className="text-sm text-muted-foreground">
                    Cada quarto tem renda, disponibilidade e estado de publicação próprios.
                  </p>
                </div>
                <Button onClick={() => setShowRoomModal(true)} size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Novo quarto
                </Button>
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Podes publicar alguns quartos agora e guardar outros como rascunho.
                </p>
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
                  {rooms.map(room => (
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
                          title={room.publishNow ? 'Mover para rascunho' : 'Marcar para publicar'}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                            room.publishNow
                              ? 'border-green-200 bg-green-50 hover:bg-green-100'
                              : 'border-border hover:bg-primary/5'
                          }`}
                        >
                          {room.publishNow
                            ? <Eye className="w-4 h-4 text-green-600" />
                            : <EyeOff className="w-4 h-4 text-muted-foreground" />
                          }
                        </button>
                        <button
                          onClick={() => handleDuplicateRoom(room)}
                          title="Duplicar quarto"
                          className="w-8 h-8 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors"
                        >
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setEditingRoom(room)}
                          title="Editar quarto"
                          className="w-8 h-8 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.tempId)}
                          title="Remover quarto"
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
                    <span className="text-muted-foreground">
                      {rooms.length} quarto{rooms.length !== 1 ? 's' : ''} adicionado{rooms.length !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium text-foreground">
                      {rooms.filter(room => room.publishNow).length} para publicar · {rooms.filter(room => !room.publishNow).length} em rascunho
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Regras da casa</h2>
                <p className="text-sm text-muted-foreground">
                  As regras ativas ficam visíveis no anúncio e ajudam a filtrar candidatos.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide text-[11px]">Restrições</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Toggle checked={rules.studentsOnly} onChange={value => setR({ studentsOnly: value })} label="Apenas estudantes" icon={GraduationCap} />
                  <Toggle checked={rules.noParties} onChange={value => setR({ noParties: value })} label="Sem festas" icon={PartyPopper} />
                  <Toggle checked={rules.noPets} onChange={value => setR({ noPets: value })} label="Sem animais de estimação" icon={PawPrint} />
                  <Toggle checked={rules.noSmoking} onChange={value => setR({ noSmoking: value })} label="Proibido fumar" icon={Cigarette} />
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

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Pré-visualização e publicação</h2>
                <p className="text-sm text-muted-foreground">
                  Revê o que os estudantes vão ver. Podes guardar como rascunho e publicar mais tarde.
                </p>
              </div>

              {missingFields.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 mb-1.5">Campos em falta:</p>
                    <ul className="space-y-0.5">
                      {missingFields.map(field => (
                        <li key={field} className="text-xs text-amber-700">· {field}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">O que os estudantes vão ver</p>
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="relative h-36">
                    <img
                      src={propertyPhotoOptions[selectedPropertyPhoto] || propertyPhotoOptions[0] || PROPERTY_IMAGES[0]}
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
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                      {property.nearbySchools.filter(s => s.school).map((s, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-muted-foreground">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {s.school}
                          {s.distanceKm ? ` · ${s.distanceKm}km` : ''}
                        </span>
                      ))}
                      {property.amenities.wifi && <span className="text-xs text-muted-foreground">Wi-Fi</span>}
                      {property.amenities.parking && <span className="text-xs text-muted-foreground">Estacionamento</span>}
                      {property.amenities.laundry && <span className="text-xs text-muted-foreground">Lavandaria</span>}
                    </div>

                    {(rules.studentsOnly || rules.noParties || rules.noPets || rules.noSmoking || rules.quietHours) && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                        <span className="text-[10px] text-muted-foreground mr-0.5">Regras visíveis:</span>
                        {rules.studentsOnly && <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">Só estudantes</span>}
                        {rules.noParties && <span className="text-[10px] px-2 py-0.5 bg-muted text-foreground border border-border rounded-full">Sem festas</span>}
                        {rules.noPets && <span className="text-[10px] px-2 py-0.5 bg-muted text-foreground border border-border rounded-full">Sem animais</span>}
                        {rules.noSmoking && <span className="text-[10px] px-2 py-0.5 bg-muted text-foreground border border-border rounded-full">Não fumadores</span>}
                        {rules.quietHours && <span className="text-[10px] px-2 py-0.5 bg-muted text-foreground border border-border rounded-full">{rules.quietHours}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(() => {
                const toPublish = rooms.filter(room => room.publishNow);
                const inDraft = rooms.filter(room => !room.publishNow);

                return (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-700">Quartos que serão publicados ({toPublish.length})</span>
                      </p>

                      {toPublish.length === 0 ? (
                        <div className="p-3 border border-dashed border-border rounded-xl text-center">
                          <p className="text-xs text-muted-foreground">Nenhum quarto marcado para publicar — todos ficarão em rascunho.</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Podes publicar individualmente na lista de quartos ou usar "Publicar tudo".</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {toPublish.map(room => (
                            <div key={room.tempId} className="flex items-center gap-3 p-3 border border-green-200 bg-green-50/50 rounded-xl">
                              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{room.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  €{room.price}/mês{room.utilities > 0 ? ` + €${room.utilities} desp.` : ''}
                                  {room.availableFrom ? ` · desde ${new Date(room.availableFrom).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                                </p>
                              </div>
                              <button
                                onClick={() => toggleRoomPublish(room.tempId)}
                                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
                              >
                                Mover para rascunho
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {inDraft.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                          Quartos que ficam em rascunho ({inDraft.length})
                        </p>

                        <div className="space-y-2">
                          {inDraft.map(room => (
                            <div key={room.tempId} className="flex items-center gap-3 p-3 border border-border bg-muted/20 rounded-xl">
                              <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
                                <EyeOff className="w-3 h-3 text-muted-foreground/50" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{room.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  €{room.price}/mês
                                  {room.availableFrom ? ` · desde ${new Date(room.availableFrom).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                                </p>
                              </div>
                              <button
                                onClick={() => toggleRoomPublish(room.tempId)}
                                className="text-xs text-primary hover:text-primary/80 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                              >
                                Publicar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {isSuspended && (
                <div className="p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Conta suspensa</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Não podes publicar novos anúncios enquanto a suspensão estiver ativa.
                    </p>
                  </div>
                </div>
              )}

              {!isSuspended && isBlocked && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-800">Publicação de anúncios bloqueada</p>
                    <p className="text-xs text-orange-700 mt-0.5">
                      Podes guardar rascunhos, mas não publicar.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Escolhe como avançar</p>

                <button
                  onClick={() => buildAndSave('draft')}
                  disabled={isSuspended || saving}
                  className={`w-full p-4 border-2 rounded-2xl text-left transition-all group flex items-start gap-4 ${
                    isSuspended || saving
                      ? 'border-border opacity-50 cursor-not-allowed'
                      : 'border-blue-300 bg-blue-50/60 hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  <Save className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isSuspended ? 'text-muted-foreground' : 'text-blue-600'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-foreground">Guardar como rascunho</p>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Opção segura</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Nada fica visível para estudantes. Podes rever e publicar quando estiveres pronto.
                    </p>
                  </div>
                </button>

                {rooms.length > 1 && (
                  <button
                    disabled={isSuspended || isBlocked || missingFields.length > 0 || selectedCount === 0 || saving}
                    onClick={() => buildAndSave('selected')}
                    className={`w-full p-4 border-2 rounded-2xl text-left transition-all flex items-start gap-4 ${
                      isSuspended || isBlocked || missingFields.length > 0 || selectedCount === 0 || saving
                        ? 'border-border bg-muted/10 opacity-50 cursor-not-allowed'
                        : 'border-amber-300 bg-amber-50/60 hover:bg-amber-50 cursor-pointer'
                    }`}
                  >
                    <Eye className={`w-5 h-5 mt-0.5 flex-shrink-0 ${missingFields.length > 0 || selectedCount === 0 ? 'text-muted-foreground' : 'text-amber-600'}`} />
                    <div>
                      <p className="font-semibold text-foreground mb-0.5">Publicar quartos selecionados</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedCount === 0
                          ? 'Marca pelo menos um quarto para publicar na lista acima.'
                          : `${selectedCount} quarto${selectedCount > 1 ? 's' : ''} ficam visíveis; ${rooms.length - selectedCount} ficam em rascunho.`}
                      </p>
                    </div>
                  </button>
                )}

                <button
                  disabled={isSuspended || isBlocked || missingFields.length > 0 || saving}
                  onClick={() => buildAndSave('all')}
                  className={`w-full p-4 border-2 rounded-2xl text-left transition-all flex items-start gap-4 ${
                    isSuspended || isBlocked || missingFields.length > 0 || saving
                      ? 'border-border bg-muted/20 opacity-60 cursor-not-allowed'
                      : 'border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer'
                  }`}
                >
                  <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${missingFields.length > 0 ? 'text-muted-foreground' : 'text-primary'}`} />
                  <div>
                    <p className="font-semibold text-foreground mb-0.5">
                      {saving ? 'A guardar...' : 'Publicar tudo agora'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {missingFields.length > 0
                        ? 'Preenche os campos em falta antes de publicar.'
                        : `Todos os ${rooms.length} quarto${rooms.length !== 1 ? 's' : ''} ficam visíveis para estudantes imediatamente.`}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack} disabled={saving}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Voltar
              </Button>
            ) : (
              <div />
            )}

            {step < 4 && (
              <Button onClick={handleNext} disabled={saving}>
                Continuar
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </div>
        </Card>
      </div>

      {showRoomModal && (
        <RoomFormModal
          onSave={handleAddRoom}
          onClose={() => setShowRoomModal(false)}
        />
      )}

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

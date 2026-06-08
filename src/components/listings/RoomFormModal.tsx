import { useState, useEffect, type ReactNode } from 'react';
import { Check, X, Camera, Loader2 } from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { publicAnonKey } from '/utils/supabase/info';
import { uploadSingleImage, MAX_ROOM_IMAGES, type UploadImageOptions } from '../../lib/uploadListingImages';
import { validateImageFile } from '../../lib/imageCompressor';

export interface RoomDraft {
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

export const emptyRoom = (): RoomDraft => ({
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

// ─── Photo entry ─────────────────────────────────────────────────────────────

interface PhotoEntry {
  id: string;
  preview: string;         // blob: URL (or existing https:) — safe for <img src>
  uploadedUrl: string | null; // https: URL once done, null while uploading
  uploading: boolean;
}

function photoFromUrl(url: string): PhotoEntry {
  return { id: crypto.randomUUID(), preview: url, uploadedUrl: url, uploading: false };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RoomFormModalProps {
  initial?: RoomDraft;
  onSave: (room: RoomDraft) => void;
  onClose: () => void;
  /** Storage path context — required to build paths for uploaded images. */
  uploadContext: {
    landlordId: string;
    propertyId: string;
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RoomFormModal({ initial, onSave, onClose, uploadContext }: RoomFormModalProps) {
  const [form, setForm] = useState<RoomDraft>(initial ?? emptyRoom());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<PhotoEntry[]>(
    () => (initial?.images ?? []).map(photoFromUrl),
  );
  const [selectedIdx, setSelectedIdx] = useState(0);

  const todayIso = new Date().toISOString().split('T')[0];
  const uploadingCount = photos.filter(p => p.uploading).length;

  // Revoke blob: URLs on unmount.
  useEffect(() => {
    return () => {
      photos.forEach(p => {
        if (p.preview.startsWith('blob:')) URL.revokeObjectURL(p.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (updates: Partial<RoomDraft>) => {
    setForm(prev => ({ ...prev, ...updates }));
    const keys = Object.keys(updates);
    if (keys.length > 0) {
      setErrors(prev => {
        const next = { ...prev };
        keys.forEach(k => delete next[k]);
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

    if (photos.filter(p => p.uploadedUrl).length === 0) {
      errs.photos = 'Adiciona pelo menos uma foto real do quarto.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (const f of Array.from(files)) {
      const err = validateImageFile(f);
      if (err) { toast.error(err); continue; }
      validFiles.push(f);
    }
    if (validFiles.length === 0) return;

    const remaining = MAX_ROOM_IMAGES - photos.length;
    if (remaining <= 0) {
      toast.error(`Máximo ${MAX_ROOM_IMAGES} fotos por quarto.`);
      return;
    }
    const toUpload = validFiles.slice(0, remaining);
    if (toUpload.length < validFiles.length) {
      toast.info(`Só foram adicionadas ${toUpload.length} foto${toUpload.length > 1 ? 's' : ''} (limite atingido).`);
    }

    // Add spinner entries immediately.
    const newEntries: PhotoEntry[] = toUpload.map(f => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(f),
      uploadedUrl: null,
      uploading: true,
    }));
    setPhotos(prev => {
      const next = [...prev, ...newEntries];
      if (prev.length === 0) setSelectedIdx(0);
      return next;
    });

    const opts: UploadImageOptions = {
      type: 'room',
      landlordId: uploadContext.landlordId,
      propertyId: uploadContext.propertyId,
      roomId: form.tempId,
    };
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? publicAnonKey;

    await Promise.all(
      toUpload.map(async (file, i) => {
        const entry = newEntries[i];
        try {
          const url = await uploadSingleImage(file, opts, token);
          setPhotos(prev =>
            prev.map(p => p.id === entry.id ? { ...p, uploadedUrl: url, uploading: false } : p),
          );
          if (entry.preview.startsWith('blob:')) URL.revokeObjectURL(entry.preview);
        } catch (err) {
          toast.error(`Upload falhou: ${err instanceof Error ? err.message : String(err)}`);
          setPhotos(prev => prev.filter(p => p.id !== entry.id));
          if (entry.preview.startsWith('blob:')) URL.revokeObjectURL(entry.preview);
        }
      }),
    );
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const idx = prev.findIndex(p => p.id === id);
      const entry = prev[idx];
      if (entry?.preview.startsWith('blob:')) URL.revokeObjectURL(entry.preview);
      const next = prev.filter(p => p.id !== id);
      setSelectedIdx(cur => {
        if (next.length === 0) return 0;
        if (idx === cur) return 0;
        if (idx < cur) return Math.max(0, cur - 1);
        return Math.min(cur, next.length - 1);
      });
      return next;
    });
  };

  const handleSave = () => {
    if (uploadingCount > 0) {
      toast.error('Aguarda o upload das imagens antes de guardar.');
      return;
    }
    if (!validate()) return;

    const ordered = [
      photos[selectedIdx],
      ...photos.filter((_, i) => i !== selectedIdx),
    ]
      .filter(Boolean)
      .map(p => p.uploadedUrl!)
      .filter(Boolean);

    onSave({ ...form, title: form.title.trim(), images: ordered });
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

            {/* Photos */}
            <div>
              <FieldLabel required>Fotos do quarto</FieldLabel>
              <p className="text-xs text-muted-foreground mb-2">
                JPG, PNG ou WebP · máx. 8 MB por foto · máx. {MAX_ROOM_IMAGES} fotos.
                A foto selecionada fica como imagem principal.
              </p>
              {errors.photos && <p className="text-xs text-red-500 mb-2">{errors.photos}</p>}
              {uploadingCount > 0 && (
                <p className="text-xs text-primary mb-2 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  A fazer upload de {uploadingCount} imagem{uploadingCount > 1 ? 'ns' : ''}…
                </p>
              )}

              <div className="flex gap-3 flex-wrap">
                {photos.map((p, i) => (
                  <div
                    key={p.id}
                    className={`group relative w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedIdx === i && !p.uploading
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => !p.uploading && setSelectedIdx(i)}
                      className="w-full h-full"
                      disabled={p.uploading}
                    >
                      <img
                        src={p.preview}
                        alt=""
                        className={`w-full h-full object-cover transition-opacity ${p.uploading ? 'opacity-50' : ''}`}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      {p.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </button>

                    {selectedIdx === i && !p.uploading && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}

                    {!p.uploading && (
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {photos.length < MAX_ROOM_IMAGES && (
                  <label className="w-24 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <span className="text-[10px] font-medium">Adicionar</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={e => handlePhotoUpload(e.target.files)}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={uploadingCount > 0}>
              {uploadingCount > 0 ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />A carregar…
                </span>
              ) : initial ? 'Guardar alterações' : 'Adicionar quarto'}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

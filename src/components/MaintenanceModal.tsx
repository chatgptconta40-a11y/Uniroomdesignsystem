import { useRef, useState, type ElementType } from 'react';
import {
  AlertCircle,
  Droplets,
  Flame,
  ImagePlus,
  KeyRound,
  Loader2,
  Plus,
  Plug,
  Router,
  Sparkles,
  Trash2,
  X,
  Wrench,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useAuth } from '../context/AuthContext';
import { supabase, supabaseUrl, publicAnonKey } from '../lib/supabase';
import { validateImageFile, compressToWebP } from '../lib/imageCompressor';
import { maintenanceUrgencyLabels } from '../types/maintenance';
import type { MaintenanceCategory, MaintenanceUrgency } from '../types/maintenance';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  accommodationId: string;
  landlordId: string;
}

type MaintenanceIssueDraft = {
  id: string;
  category: MaintenanceCategory | '';
  title: string;
  description: string;
  urgency: MaintenanceUrgency;
  photoUrl: string;
  photoUploading: boolean;
};

const categories: {
  value: MaintenanceCategory;
  label: string;
  icon: ElementType;
}[] = [
  { value: 'plumbing', label: 'Canalização', icon: Droplets },
  { value: 'electricity', label: 'Eletricidade', icon: Zap },
  { value: 'heating', label: 'Água quente / Esquentador', icon: Flame },
  { value: 'internet', label: 'Internet', icon: Router },
  { value: 'appliances', label: 'Eletrodomésticos', icon: Plug },
  { value: 'locks', label: 'Fechaduras / Portas', icon: KeyRound },
  { value: 'cleaning', label: 'Limpeza / Espaços comuns', icon: Sparkles },
  { value: 'other', label: 'Outro', icon: Wrench },
];

function createEmptyIssue(): MaintenanceIssueDraft {
  return {
    id: `issue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    category: '',
    title: '',
    description: '',
    urgency: 'medium',
    photoUrl: '',
    photoUploading: false,
  };
}

export function MaintenanceModal({
  isOpen,
  onClose,
  accommodationId,
  landlordId,
}: MaintenanceModalProps) {
  const { user } = useAuth();

  const [issues, setIssues] = useState<MaintenanceIssueDraft[]>(() => [createEmptyIssue()]);
  const [activeIssueId, setActiveIssueId] = useState<string>(() => issues[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Tracks which issue the pending file picker belongs to
  const pendingIssueIdRef = useRef<string>('');

  const activeIssue = issues.find(issue => issue.id === activeIssueId) || issues[0];

  const resetForm = () => {
    const firstIssue = createEmptyIssue();
    setIssues([firstIssue]);
    setActiveIssueId(firstIssue.id);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateIssue = (issueId: string, updates: Partial<MaintenanceIssueDraft>) => {
    setIssues(prev =>
      prev.map(issue =>
        issue.id === issueId ? { ...issue, ...updates } : issue,
      ),
    );
  };

  const addIssue = () => {
    if (issues.length >= 3) {
      toast.info('Podes reportar no máximo 3 problemas de cada vez.');
      return;
    }
    const nextIssue = createEmptyIssue();
    setIssues(prev => [...prev, nextIssue]);
    setActiveIssueId(nextIssue.id);
  };

  const removeIssue = (issueId: string) => {
    if (issues.length === 1) {
      toast.info('Tens de manter pelo menos um problema.');
      return;
    }
    setIssues(prev => {
      const next = prev.filter(issue => issue.id !== issueId);
      if (activeIssueId === issueId) setActiveIssueId(next[0]?.id || '');
      return next;
    });
  };

  const validateIssues = () => {
    for (let index = 0; index < issues.length; index += 1) {
      const issue = issues[index];
      if (!issue.category || !issue.title.trim() || !issue.description.trim()) {
        setActiveIssueId(issue.id);
        toast.error(`Preenche todos os campos obrigatórios no problema ${index + 1}.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateIssues() || !user) return;

    if (issues.some(i => i.photoUploading)) {
      toast.info('Aguarda o upload da fotografia antes de enviar.');
      return;
    }

    setIsSubmitting(true);

    const rows = issues.map(issue => ({
      id: `maint-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: user.id,
      room_id: accommodationId,
      property_id: null as string | null,
      landlord_id: landlordId,
      category: issue.category as MaintenanceCategory,
      title: issue.title.trim(),
      description: issue.description.trim(),
      urgency: issue.urgency,
      status: 'pending',
      photo_url: issue.photoUrl || null,
    }));

    const { error } = await supabase.from('maintenance_requests').insert(rows);

    if (error) {
      console.error('Maintenance insert error:', error.message);
      toast.error('Erro ao enviar pedido. Tenta novamente.');
      setIsSubmitting(false);
      return;
    }

    toast.success(
      issues.length === 1 ? 'Pedido de manutenção enviado!' : `${issues.length} pedidos de manutenção enviados!`,
      { description: 'O senhorio foi notificado.' },
    );
    handleClose();
  };

  // Open native file picker for the given issue
  const triggerFilePicker = (issueId: string) => {
    pendingIssueIdRef.current = issueId;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const issueId = pendingIssueIdRef.current;
    if (!issueId) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    updateIssue(issueId, { photoUploading: true });

    try {
      const compressed = await compressToWebP(file);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? publicAnonKey;

      const form = new FormData();
      form.append('file', compressed, 'photo.webp');

      const res = await fetch(
        `${supabaseUrl}/functions/v1/make-server-08c694dc/images/upload-maintenance`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha no upload.');

      updateIssue(issueId, { photoUrl: data.url as string, photoUploading: false });
      toast.success('Fotografia adicionada.');
    } catch (err) {
      console.error('[MaintenanceModal] photo upload failed:', err);
      toast.error('Não foi possível fazer upload da fotografia.', {
        description: String(err instanceof Error ? err.message : err),
      });
      updateIssue(issueId, { photoUploading: false });
    }
  };

  const removePhoto = (issueId: string) => {
    updateIssue(issueId, { photoUrl: '' });
  };

  const completedIssues = issues.filter(issue =>
    issue.category && issue.title.trim() && issue.description.trim(),
  ).length;

  const anyUploading = issues.some(i => i.photoUploading);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reportar problema"
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between w-full">
          <p className="text-xs text-muted-foreground">
            {completedIssues}/{issues.length} problema{issues.length === 1 ? '' : 's'} preenchido{issues.length === 1 ? '' : 's'}
          </p>
          <div className="flex items-center gap-3 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || anyUploading}
            >
              {isSubmitting
                ? 'A enviar...'
                : issues.length === 1
                  ? 'Enviar pedido'
                  : `Enviar ${issues.length} pedidos`}
            </Button>
          </div>
        </div>
      }
    >
      {/* Hidden file input shared across all issues */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="space-y-6">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Podes reportar até 3 problemas de uma vez.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Cada problema fica registado como um pedido individual para o senhorio conseguir acompanhar melhor.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <label className="block text-sm font-semibold text-foreground">
              Problemas a reportar
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addIssue}
              disabled={issues.length >= 3 || isSubmitting}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Adicionar problema
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {issues.map((issue, index) => {
              const selected = issue.id === activeIssueId;
              const complete = issue.category && issue.title.trim() && issue.description.trim();
              return (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => setActiveIssueId(issue.id)}
                  className={`text-left rounded-xl border-2 p-4 transition-all ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : complete
                        ? 'border-secondary/40 bg-secondary/5'
                        : 'border-border hover:border-primary/40 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-foreground">Problema {index + 1}</p>
                    {complete && <span className="w-2.5 h-2.5 rounded-full bg-secondary mt-1" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {issue.title.trim() || 'Ainda sem título'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {activeIssue && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-foreground">
                  Problema {issues.findIndex(issue => issue.id === activeIssue.id) + 1}
                </h3>
                <p className="text-xs text-muted-foreground">Preenche a informação deste problema.</p>
              </div>
              {issues.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeIssue(activeIssue.id)}
                  disabled={isSubmitting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Remover
                </Button>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Categoria do problema *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const selected = activeIssue.category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => updateIssue(activeIssue.id, { category: cat.value })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium text-foreground">{cat.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Título do problema *
              </label>
              <Input
                value={activeIssue.title}
                onChange={event => updateIssue(activeIssue.id, { title: event.target.value })}
                placeholder="Ex: Esquentador avariado"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">{activeIssue.title.length}/100 caracteres</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Descrição *
              </label>
              <textarea
                value={activeIssue.description}
                onChange={event => updateIssue(activeIssue.id, { description: event.target.value })}
                placeholder="Descreve o problema em detalhe..."
                rows={5}
                maxLength={500}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{activeIssue.description.length}/500 caracteres</p>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Urgência *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as const).map(level => {
                  const selected = activeIssue.urgency === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateIssue(activeIssue.id, { urgency: level })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selected
                          ? level === 'high'
                            ? 'border-destructive bg-destructive/5'
                            : level === 'medium'
                              ? 'border-accent bg-accent/5'
                              : 'border-secondary bg-secondary/5'
                          : 'border-border hover:border-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          selected
                            ? level === 'high'
                              ? 'text-destructive'
                              : level === 'medium'
                                ? 'text-accent'
                                : 'text-secondary'
                            : 'text-foreground'
                        }`}
                      >
                        {maintenanceUrgencyLabels[level]}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Fotografia (opcional)
              </label>

              {activeIssue.photoUrl ? (
                /* Preview */
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img
                    src={activeIssue.photoUrl}
                    alt="Fotografia do problema"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(activeIssue.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                    title="Remover fotografia"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/50 to-transparent">
                    <p className="text-xs text-white font-medium">Fotografia adicionada</p>
                  </div>
                </div>
              ) : activeIssue.photoUploading ? (
                /* Uploading state */
                <div className="w-full p-6 border-2 border-dashed border-primary/40 rounded-xl bg-primary/5 flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm font-medium text-foreground">A carregar fotografia…</p>
                  <p className="text-xs text-muted-foreground">A comprimir e a fazer upload</p>
                </div>
              ) : (
                /* Picker trigger */
                <button
                  type="button"
                  onClick={() => triggerFilePicker(activeIssue.id)}
                  className="w-full p-6 border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 rounded-xl transition-all flex flex-col items-center gap-2"
                >
                  <ImagePlus className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Adicionar fotografia</p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou WebP · máx. 8 MB · guardado em WebP
                  </p>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="p-4 bg-muted/40 border border-border rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-semibold mb-1">O que acontece a seguir?</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• O senhorio será notificado de cada problema</li>
              <li>• Cada problema fica com estado próprio</li>
              <li>• Podes acompanhar tudo em "Pedidos de manutenção"</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
}

import { useState, type ElementType } from 'react';
import {
  AlertCircle,
  Droplets,
  Flame,
  KeyRound,
  Plus,
  Plug,
  Router,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useAuth } from '../context/AuthContext';
import { createMaintenanceRequest } from '../data/mockMaintenance';
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
        issue.id === issueId
          ? { ...issue, ...updates }
          : issue,
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
      if (activeIssueId === issueId) {
        setActiveIssueId(next[0]?.id || '');
      }
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
    if (!validateIssues()) return;

    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 700));

    issues.forEach(issue => {
      createMaintenanceRequest(
        user?.id || '',
        accommodationId,
        landlordId,
        issue.category as MaintenanceCategory,
        issue.title.trim(),
        issue.description.trim(),
        issue.urgency,
        issue.photoUrl || undefined,
      );
    });

    toast.success(
      issues.length === 1
        ? 'Pedido de manutenção enviado!'
        : `${issues.length} pedidos de manutenção enviados!`,
      {
        description: 'O senhorio foi notificado.',
      },
    );

    handleClose();
  };

  const handleFileUpload = (issueId: string) => {
    const samplePhotoUrl = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=900&q=80';
    updateIssue(issueId, { photoUrl: samplePhotoUrl });
    toast.success('Fotografia anexada ao pedido.');
  };

  const completedIssues = issues.filter(issue =>
    issue.category && issue.title.trim() && issue.description.trim(),
  ).length;

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

            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
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
                <p className="text-xs text-muted-foreground">
                  Preenche a informação deste problema.
                </p>
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

            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Fotografia (opcional)
              </label>

              <button
                type="button"
                onClick={() => handleFileUpload(activeIssue.id)}
                className={`w-full p-6 border-2 border-dashed rounded-xl transition-all ${
                  activeIssue.photoUrl
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary hover:bg-primary/5'
                }`}
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">
                  {activeIssue.photoUrl ? 'Fotografia anexada' : 'Anexar fotografia'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeIssue.photoUrl
                    ? 'A fotografia será enviada com este problema.'
                    : 'Adiciona uma imagem para ajudar o senhorio a identificar o problema.'}
                </p>
              </button>
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
              <li>• Podes acompanhar tudo em “Pedidos de manutenção”</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
}

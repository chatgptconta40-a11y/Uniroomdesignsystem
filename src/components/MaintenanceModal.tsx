import { useState, type ElementType } from 'react';
import {
  AlertCircle,
  Droplets,
  Flame,
  KeyRound,
  Plug,
  Router,
  Sparkles,
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

export function MaintenanceModal({
  isOpen,
  onClose,
  accommodationId,
  landlordId,
}: MaintenanceModalProps) {
  const { user } = useAuth();

  const [category, setCategory] = useState<MaintenanceCategory | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<MaintenanceUrgency>('medium');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCategory('');
    setTitle('');
    setDescription('');
    setUrgency('medium');
    setPhotoUrl('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!category || !title.trim() || !description.trim()) {
      toast.error('Preenche todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 700));

    createMaintenanceRequest(
      user?.id || '',
      accommodationId,
      landlordId,
      category,
      title.trim(),
      description.trim(),
      urgency,
      photoUrl || undefined,
    );

    toast.success('Pedido de manutenção enviado!', {
      description: 'O senhorio foi notificado.',
    });

    handleClose();
  };

  const handleFileUpload = () => {
    const demoPhotoUrl = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=900&q=80';
    setPhotoUrl(demoPhotoUrl);
    toast.success('Foto de exemplo anexada ao pedido.');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reportar problema"
      size="lg"
      footer={
        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>

          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'A enviar...' : 'Enviar pedido'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Categoria do problema *
          </label>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map(cat => {
              const Icon = cat.icon;
              const selected = category === cat.value;

              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
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
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="Ex: Esquentador avariado"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground mt-1">{title.length}/100 caracteres</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Descrição *
          </label>
          <textarea
            value={description}
            onChange={event => setDescription(event.target.value)}
            placeholder="Descreve o problema em detalhe..."
            rows={5}
            maxLength={500}
            className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">{description.length}/500 caracteres</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Urgência *
          </label>

          <div className="grid grid-cols-3 gap-3">
            {(['low', 'medium', 'high'] as const).map(level => {
              const selected = urgency === level;

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setUrgency(level)}
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
            Foto opcional
          </label>

          <button
            type="button"
            onClick={handleFileUpload}
            className={`w-full p-6 border-2 border-dashed rounded-xl transition-all ${
              photoUrl
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary hover:bg-primary/5'
            }`}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              {photoUrl ? 'Foto anexada' : 'Anexar foto'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {photoUrl
                ? 'Podes enviar o pedido com esta fotografia.'
                : 'Adiciona uma fotografia demonstrativa ao pedido.'}
            </p>
          </button>
        </div>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-semibold mb-1">O que acontece a seguir?</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• O senhorio será notificado do problema</li>
              <li>• Podes acompanhar o estado do pedido</li>
              <li>• Receberás atualizações quando o estado mudar</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
}
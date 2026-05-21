import { useState } from 'react';
import { X, Wrench, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { useAuth } from '../context/AuthContext';
import { createMaintenanceRequest } from '../data/mockMaintenance';
import { maintenanceCategoryLabels, maintenanceUrgencyLabels } from '../types/maintenance';
import { toast } from 'sonner';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  accommodationId: string;
  landlordId: string;
}

export function MaintenanceModal({ isOpen, onClose, accommodationId, landlordId }: MaintenanceModalProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'plumbing', label: 'Canalização', icon: '🚰' },
    { value: 'electricity', label: 'Eletricidade', icon: '⚡' },
    { value: 'heating', label: 'Água quente / Esquentador', icon: '🔥' },
    { value: 'internet', label: 'Internet', icon: '📶' },
    { value: 'appliances', label: 'Eletrodomésticos', icon: '🔌' },
    { value: 'locks', label: 'Fechaduras / Portas', icon: '🔐' },
    { value: 'cleaning', label: 'Limpeza / Espaços comuns', icon: '🧹' },
    { value: 'other', label: 'Outro', icon: '🔧' },
  ];

  const handleSubmit = async () => {
    if (!category || !title || !description) {
      toast.error('Preenche todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    createMaintenanceRequest(
      user?.id || '',
      accommodationId,
      landlordId,
      category,
      title,
      description,
      urgency,
      photoUrl || undefined
    );

    setIsSubmitting(false);
    toast.success('Pedido de manutenção enviado!', {
      description: 'O senhorio foi notificado.',
    });

    // Reset form
    setCategory('');
    setTitle('');
    setDescription('');
    setUrgency('medium');
    setPhotoUrl('');

    onClose();
  };

  const handleFileUpload = () => {
    // Mock file upload
    toast.info('Funcionalidade de upload em desenvolvimento');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reportar Problema"
      size="lg"
      footer={
        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'A enviar...' : 'Enviar Pedido'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Categoria do Problema *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  category === cat.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-muted'
                }`}
              >
                <div className="text-2xl mb-2">{cat.icon}</div>
                <p className="text-sm font-medium text-foreground">{cat.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Título do Problema *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Esquentador avariado"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground mt-1">{title.length}/100 caracteres</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Descrição *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreve o problema em detalhe..."
            rows={5}
            maxLength={500}
            className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">{description.length}/500 caracteres</p>
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Urgência *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['low', 'medium', 'high'] as const).map(level => (
              <button
                key={level}
                onClick={() => setUrgency(level)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  urgency === level
                    ? level === 'high'
                      ? 'border-destructive bg-destructive/5'
                      : level === 'medium'
                      ? 'border-accent bg-accent/5'
                      : 'border-secondary bg-secondary/5'
                    : 'border-border hover:border-muted-foreground hover:bg-muted'
                }`}
              >
                <p className={`text-sm font-semibold ${
                  urgency === level
                    ? level === 'high'
                      ? 'text-destructive'
                      : level === 'medium'
                      ? 'text-accent'
                      : 'text-secondary'
                    : 'text-foreground'
                }`}>
                  {maintenanceUrgencyLabels[level]}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Photo Upload (Mock) */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Foto (opcional)
          </label>
          <button
            onClick={handleFileUpload}
            className="w-full p-6 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Carregar foto</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 5MB</p>
          </button>
        </div>

        {/* Info Box */}
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

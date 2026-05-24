import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel?: string;
  loading?: boolean;
  /** destructive = vermelho (ação perigosa), positive = verde (ação positiva), neutral = azul (ação neutra) */
  variant?: 'destructive' | 'positive' | 'neutral';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  loading = false,
  variant = 'destructive',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const iconConfig = {
    destructive: {
      bg: 'bg-red-50',
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
    },
    positive: {
      bg: 'bg-green-50',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    },
    neutral: {
      bg: 'bg-blue-50',
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
  };

  const confirmButtonClass = {
    destructive: 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700',
    positive: 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700',
    neutral: '',
  };

  const { bg, icon } = iconConfig[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />
      <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'neutral' ? 'primary' : 'outline'}
            onClick={onConfirm}
            disabled={loading}
            className={variant !== 'neutral' ? confirmButtonClass[variant] : undefined}
          >
            {loading ? 'A processar…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

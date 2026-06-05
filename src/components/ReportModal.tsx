import { useState } from 'react';
import { AlertTriangle, Flag, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './Button';
import { useReport } from '../hooks/useTrust';

type ReportedType = 'accommodation' | 'user' | 'message' | 'review';
type ReportType = 'fraude_possivel' | 'localizacao_falsa' | 'pagamento_externo' | 'fotos_enganosas' | 'identidade_nao_verificada' | 'comportamento_abusivo';
type ReportPriority = 'baixa' | 'media' | 'alta' | 'critica';

interface ReportModalProps {
  reportedType: ReportedType;
  reportedId: string;
  reportedName: string;
  userId: string;
  userName?: string;
  onClose: () => void;
  propertyId?: string;
  propertyTitle?: string;
  roomId?: string;
  roomTitle?: string;
  landlordId?: string;
  landlordName?: string;
}

interface ReasonOption {
  value: ReportType;
  label: string;
  description: string;
  priority: ReportPriority;
}

const REASON_OPTIONS: ReasonOption[] = [
  {
    value: 'fraude_possivel',
    label: 'Possível fraude',
    description: 'Conta suspeita, pedido de caução sem contrato, perfil falso ou tentativa de burla.',
    priority: 'critica',
  },
  {
    value: 'pagamento_externo',
    label: 'Pedido de pagamento fora da plataforma',
    description: 'Pedido de transferência bancária, MB Way ou outro método externo sem garantias.',
    priority: 'critica',
  },
  {
    value: 'comportamento_abusivo',
    label: 'Comportamento abusivo',
    description: 'Ameaças, assédio, pressão indevida ou comunicação intimidatória.',
    priority: 'alta',
  },
  {
    value: 'fotos_enganosas',
    label: 'Fotos enganosas',
    description: 'O alojamento real não corresponde às fotografias ou às condições apresentadas.',
    priority: 'alta',
  },
  {
    value: 'localizacao_falsa',
    label: 'Localização falsa',
    description: 'A morada, zona ou distância à universidade está incorreta.',
    priority: 'media',
  },
  {
    value: 'identidade_nao_verificada',
    label: 'Identidade do senhorio não verificada',
    description: 'Não foi possível confirmar a identidade real do senhorio ou há dados contraditórios.',
    priority: 'media',
  },
];

const PRIORITY_BADGE: Record<ReportPriority, { label: string; cls: string }> = {
  critica: { label: 'Crítica', cls: 'bg-red-100 text-red-700 border-red-200' },
  alta: { label: 'Alta', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  media: { label: 'Média', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  baixa: { label: 'Baixa', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const TYPE_LABELS: Record<ReportedType, string> = {
  accommodation: 'alojamento',
  user: 'utilizador',
  message: 'mensagem',
  review: 'avaliação',
};

export function ReportModal({
  reportedType,
  reportedId,
  reportedName,
  userId,
  userName,
  onClose,
  propertyId,
  propertyTitle,
  roomId,
  roomTitle,
  landlordId,
  landlordName,
}: ReportModalProps) {
  const { createReport } = useReport();
  const [reason, setReason] = useState<ReportType | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOption = REASON_OPTIONS.find(option => option.value === reason);
  const trimmedDescription = description.trim();
  const canSubmit = Boolean(reason && selectedOption && trimmedDescription.length >= 20 && !isSubmitting);

  const handleSubmit = async () => {
    if (!reason || !selectedOption) {
      toast.error('Seleciona um motivo para a denúncia.');
      return;
    }

    if (trimmedDescription.length < 20) {
      toast.error('Descreve o problema com pelo menos 20 caracteres.');
      return;
    }

    setIsSubmitting(true);

    const ok = await createReport({
      targetType: reportedType,
      targetId: reportedId,
      targetName: reportedName,
      reason: selectedOption.value,
      description: trimmedDescription,
      severity: selectedOption.priority,
    });

    setIsSubmitting(false);

    if (!ok) {
      toast.error('Erro ao enviar a denúncia.', {
        description: 'Verifica a tua ligação e tenta novamente.',
      });
      return;
    }

    toast.success('Denúncia enviada com sucesso!', {
      description: 'A equipa UniRoom vai analisar o caso. A tua identidade será mantida em confidencialidade.',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Flag className="w-5 h-5 text-red-600" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">
                Denunciar {TYPE_LABELS[reportedType]}
              </h2>
              <p className="text-sm text-muted-foreground">{reportedName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Fechar modal"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900 mb-1">
                Usa a denúncia apenas quando existe um problema real
              </p>
              <p className="text-yellow-700">
                Denúncias falsas podem prejudicar outros utilizadores e podem resultar na suspensão da conta.
              </p>
            </div>
          </div>

          {(propertyTitle || roomTitle || landlordName) && (
            <div className="p-4 bg-muted/40 border border-border rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Contexto da denúncia</p>
              <div className="space-y-1 text-sm text-foreground">
                {propertyTitle && <p>Alojamento: {propertyTitle}</p>}
                {roomTitle && <p>Quarto: {roomTitle}</p>}
                {landlordName && <p>Senhorio: {landlordName}</p>}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Motivo da denúncia
            </label>

            <div className="space-y-2">
              {REASON_OPTIONS.map(option => {
                const isSelected = reason === option.value;
                const badge = PRIORITY_BADGE[option.priority];

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setReason(option.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-foreground">{option.label}</span>

                      {(option.priority === 'critica' || option.priority === 'alta') && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Descreve o problema
            </label>

            <textarea
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Explica o que aconteceu, quando aconteceu e porque consideras que deve ser analisado."
              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              rows={5}
              maxLength={1000}
            />

            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Mínimo recomendado: 20 caracteres.</p>
              <p className="text-xs text-muted-foreground">{description.length}/1000</p>
            </div>
          </div>

          {selectedOption && (selectedOption.priority === 'critica' || selectedOption.priority === 'alta') && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-900 mb-1">Denúncia prioritária</p>
                <p className="text-red-700">
                  Este tipo de problema será tratado com prioridade pela equipa UniRoom.
                </p>
              </div>
            </div>
          )}

          <div className="p-5 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-foreground font-medium">O que acontece a seguir?</p>
            <ul className="text-sm text-foreground mt-2 space-y-1">
              <li>A equipa UniRoom analisa a denúncia e o contexto associado.</li>
              <li>O caso fica disponível no backoffice para moderação.</li>
              <li>A tua identidade é mantida em confidencialidade.</li>
              <li>Se o problema for confirmado, podem ser aplicadas medidas ao anúncio ou ao senhorio.</li>
            </ul>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-between gap-3">
          <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
            Cancelar
          </Button>

          <Button onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {isSubmitting ? 'A enviar...' : 'Enviar denúncia'}
          </Button>
        </div>
      </div>
    </div>
  );
}

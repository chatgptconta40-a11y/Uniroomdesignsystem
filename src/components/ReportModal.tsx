
import { useState } from 'react';
import { X, AlertTriangle, Flag, ShieldAlert } from 'lucide-react';
import { Button } from './Button';
import { createReport } from '../data/mockTrust';
import { ReportReason } from '../types/trust';
import { addReport } from '../data/mockAdminReports';
import { ReportType, ReportPriority } from '../data/mockAdminReports';
import { Report } from '../types/trust';
import { toast } from 'sonner';

interface ReportModalProps {
  reportedType: Report['reportedType'];
  reportedId: string;
  reportedName: string;
  userId: string;
  userName?: string;
  onClose: () => void;
  // Optional context for property/room reports
  propertyId?: string;
  propertyTitle?: string;
  roomId?: string;
  roomTitle?: string;
  landlordId?: string;
  landlordName?: string;
}

// Accommodation-specific report reasons — map directly to admin report types
type AccommodationReportReason = ReportType | 'outro';

interface ReasonOption {
  value: AccommodationReportReason;
  label: string;
  description: string;
  priority: ReportPriority;
  legacyReason: ReportReason; // for trust.ts compat
}

const REASON_OPTIONS: ReasonOption[] = [
  {
    value: 'fraude_possivel',
    label: 'Possível fraude',
    description: 'Conta suspeita, pagamento adiantado sem contrato ou perfil falso',
    priority: 'critica',
    legacyReason: 'scam',
  },
  {
    value: 'pagamento_externo',
    label: 'Pedido de pagamento fora da plataforma',
    description: 'Senhorio pediu transferência bancária, MB Way ou outro método externo',
    priority: 'critica',
    legacyReason: 'scam',
  },
  {
    value: 'comportamento_abusivo',
    label: 'Comportamento abusivo',
    description: 'Ameaças, assédio ou comunicação intimidatória',
    priority: 'alta',
    legacyReason: 'harassment',
  },
  {
    value: 'fotos_enganosas',
    label: 'Fotos enganosas',
    description: 'O alojamento real não corresponde às fotos do anúncio',
    priority: 'alta',
    legacyReason: 'inappropriate_content',
  },
  {
    value: 'localizacao_falsa',
    label: 'Localização falsa',
    description: 'A morada ou distância à universidade está incorreta',
    priority: 'media',
    legacyReason: 'fake_listing',
  },
  {
    value: 'identidade_nao_verificada',
    label: 'Identidade do senhorio não verificada',
    description: 'Não foi possível confirmar a identidade real do senhorio',
    priority: 'media',
    legacyReason: 'other',
  },
  {
    value: 'outro',
    label: 'Outro problema',
    description: 'Outro problema não listado acima',
    priority: 'media',
    legacyReason: 'other',
  },
];

const PRIORITY_BADGE: Record<ReportPriority, { label: string; cls: string }> = {
  critica: { label: 'Crítica', cls: 'bg-red-100 text-red-700 border-red-200' },
  alta: { label: 'Alta', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  media: { label: 'Média', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  baixa: { label: 'Baixa', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
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
  const [reason, setReason] = useState<AccommodationReportReason | ''>('');
  const [description, setDescription] = useState('');

  const selectedOption = REASON_OPTIONS.find(r => r.value === reason);

  const typeLabels = {
    accommodation: 'alojamento',
    user: 'utilizador',
    message: 'mensagem',
    review: 'avaliação',
  };

  const handleSubmit = () => {
    if (!reason || !selectedOption) {
      toast.error('Por favor, seleciona um motivo');
      return;
    }
    if (!description.trim()) {
      toast.error('Por favor, descreve o problema');
      return;
    }

    // Persist to legacy trust mock
    createReport(userId, reportedType, reportedId, selectedOption.legacyReason, description.trim());

    // Also create entry in admin moderation system
    if (landlordId) {
      const adminType: ReportType = reason === 'outro' ? 'fraude_possivel' : reason as ReportType;
      addReport({
        type: adminType,
        propertyId,
        propertyTitle,
        roomId,
        roomTitle,
        landlordId,
        landlordName: landlordName ?? 'Senhorio',
        reportedByStudentId: userId,
        reportedByStudentName: userName ?? 'Estudante',
        description: description.trim(),
        date: new Date().toISOString().split('T')[0],
        priority: selectedOption.priority,
        status: 'aberta',
      });
    }

    toast.success('Denúncia enviada com sucesso!', {
      description: 'A equipa UniRoom irá analisar em 24-48h. A tua identidade é mantida em confidencialidade.',
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
                Denunciar {typeLabels[reportedType]}
              </h2>
              <p className="text-sm text-muted-foreground">{reportedName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900 mb-1">
                Denúncias falsas são levadas a sério
              </p>
              <p className="text-yellow-700">
                Apenas denuncia se realmente existe um problema. Denúncias falsas podem resultar na
                suspensão da tua conta.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Motivo da denúncia:
            </label>
            <div className="space-y-2">
              {REASON_OPTIONS.map(item => {
                const isSelected = reason === item.value;
                const badge = PRIORITY_BADGE[item.priority];
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setReason(item.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-foreground">{item.label}</span>
                      {(item.priority === 'critica' || item.priority === 'alta') && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
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
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Fornece detalhes sobre o problema que encontraste..."
              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              rows={5}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/1000 caracteres
            </p>
          </div>

          {selectedOption && (selectedOption.priority === 'critica' || selectedOption.priority === 'alta') && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-900 mb-1">Denúncia prioritária</p>
                <p className="text-red-700">
                  Este tipo de problema é tratado com prioridade máxima pela equipa UniRoom. Receberás uma resposta em menos de 24h.
                </p>
              </div>
            </div>
          )}

          <div className="p-5 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-foreground font-medium">
              O que acontece a seguir?
            </p>
            <ul className="text-sm text-foreground mt-2 space-y-1">
              <li>A nossa equipa irá analisar a tua denúncia em 24-48h.</li>
              <li>Poderás acompanhar o estado na tua área de notificações.</li>
              <li>A tua identidade será mantida em confidencialidade.</li>
              <li>Tomaremos as medidas apropriadas se o problema for confirmado.</li>
            </ul>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-between gap-3">
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!reason || !description.trim()}>
            Enviar denúncia
          </Button>
        </div>
      </div>
    </div>
  );
}

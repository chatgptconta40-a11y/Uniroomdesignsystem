
import { useState } from 'react';
import { X, AlertTriangle, Flag } from 'lucide-react';
import { Button } from './Button';
import { createReport } from '../data/mockTrust';
import { Report, ReportReason } from '../types/trust';
import { addReport } from '../data/mockAdminReports';
import { ReportType, ReportPriority } from '../data/mockAdminReports';
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

// Map generic reason to admin report type and priority
function mapToAdminReport(reason: ReportReason): { type: ReportType; priority: ReportPriority } {
  switch (reason) {
    case 'scam': return { type: 'fraude_possivel', priority: 'critica' };
    case 'fake_listing': return { type: 'localizacao_falsa', priority: 'media' };
    case 'inappropriate_content': return { type: 'fotos_enganosas', priority: 'alta' };
    case 'harassment': return { type: 'comportamento_abusivo', priority: 'alta' };
    case 'discrimination': return { type: 'comportamento_abusivo', priority: 'alta' };
    case 'spam': return { type: 'pagamento_externo', priority: 'media' };
    default: return { type: 'fraude_possivel', priority: 'media' };
  }
}

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
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');

  const reasons: { value: ReportReason; label: string; description: string }[] = [
    {
      value: 'inappropriate_content',
      label: 'Conteúdo inapropriado',
      description: 'Linguagem ofensiva ou imagens inapropriadas',
    },
    {
      value: 'fake_listing',
      label: 'Anúncio falso',
      description: 'Alojamento não existe ou informações falsas',
    },
    {
      value: 'scam',
      label: 'Burla ou fraude',
      description: 'Tentativa de burla ou pedido de dinheiro suspeito',
    },
    {
      value: 'harassment',
      label: 'Assédio',
      description: 'Comportamento abusivo ou perseguição',
    },
    {
      value: 'discrimination',
      label: 'Discriminação',
      description: 'Discriminação por raça, género, orientação sexual, etc.',
    },
    {
      value: 'spam',
      label: 'Spam',
      description: 'Mensagens repetitivas ou não solicitadas',
    },
    {
      value: 'other',
      label: 'Outro',
      description: 'Outro motivo não listado acima',
    },
  ];

  const typeLabels = {
    accommodation: 'alojamento',
    user: 'utilizador',
    message: 'mensagem',
    review: 'avaliação',
  };

  const handleSubmit = () => {
    if (!reason) {
      toast.error('Por favor, seleciona um motivo');
      return;
    }
    if (!description.trim()) {
      toast.error('Por favor, descreve o problema');
      return;
    }

    // Persist to legacy trust mock
    createReport(userId, reportedType, reportedId, reason, description.trim());

    // Also create entry in admin moderation system
    if (landlordId) {
      const { type, priority } = mapToAdminReport(reason as ReportReason);
      addReport({
        type,
        propertyId: propertyId,
        propertyTitle: propertyTitle,
        roomId: roomId,
        roomTitle: roomTitle,
        landlordId,
        landlordName: landlordName ?? 'Senhorio',
        reportedByStudentId: userId,
        reportedByStudentName: userName ?? 'Estudante',
        description: description.trim(),
        date: new Date().toISOString().split('T')[0],
        priority,
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
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
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

            <div className="space-y-3">
              {reasons.map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setReason(item.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    reason === item.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/60'
                  }`}
                >
                  <div className="font-medium text-foreground">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </button>
              ))}
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

          <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
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
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Flag,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Ban,
  X,
  Search,
  ShieldAlert,
  ShieldOff,
  ShieldCheck,
  UserX,
  UserCheck,
  Home,
  MessageSquare,
  FilePen,
  CheckSquare,
  XSquare,
  Unlock,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useReports, type ReportRow } from '../../hooks/useDb';
import { useAdminAuditLogs, type AuditLogInput } from '../../hooks/useAdminAuditLogs';
import { useProperties } from '../../context/PropertiesContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// ─── Config maps ──────────────────────────────────────────────────────────────

const REPORT_TYPE_LABELS: Record<string, string> = {
  fraude_possivel: 'Possível Fraude',
  localizacao_falsa: 'Localização Falsa',
  pagamento_externo: 'Pagamento Fora da Plataforma',
  fotos_enganosas: 'Fotos Enganosas',
  identidade_nao_verificada: 'Identidade Não Verificada',
  comportamento_abusivo: 'Comportamento Abusivo',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  accommodation: 'Alojamento',
  user: 'Utilizador',
  message: 'Mensagem',
  review: 'Avaliação',
  listing: 'Anúncio',
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending: { label: 'Aberta', cls: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
  under_review: { label: 'Em Análise', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  reviewed: { label: 'Em Revisão', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Eye },
  resolved: { label: 'Resolvida', cls: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  dismissed: { label: 'Rejeitada', cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: XSquare },
};

const SEVERITY_CONFIG: Record<string, { label: string; cls: string }> = {
  critical: { label: 'Crítica', cls: 'bg-red-50 text-red-700 border-red-200' },
  high: { label: 'Alta', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  medium: { label: 'Média', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Baixa', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function getStatusCfg(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
}

function getSeverityCfg(severity: string | undefined) {
  return SEVERITY_CONFIG[severity ?? ''] ?? SEVERITY_CONFIG.medium;
}

function formatDate(d: Date | string | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Sanctions local state ────────────────────────────────────────────────────

interface SanctionState {
  propertySuspended: boolean;
  landlordSuspended: boolean;
  landlordBlocked: boolean;
  propertySuspensionLifted: boolean;
  landlordSuspensionLifted: boolean;
  landlordUnblocked: boolean;
}

const INITIAL_SANCTIONS: SanctionState = {
  propertySuspended: false,
  landlordSuspended: false,
  landlordBlocked: false,
  propertySuspensionLifted: false,
  landlordSuspensionLifted: false,
  landlordUnblocked: false,
};

// ─── ReportDetailModal ────────────────────────────────────────────────────────

type PendingAction = {
  action: string;
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'destructive' | 'positive' | 'neutral';
};

function ReportDetailModal({
  report: initialReport,
  onClose,
  onUpdateStatus,
  onAddNote,
  onSuspendProperty,
  onSuspendLandlord,
  onBlockLandlord,
  onLiftPropertySuspension,
  onLiftLandlordSuspension,
  onUnblockLandlord,
  createLog,
}: {
  report: ReportRow;
  onClose: () => void;
  onUpdateStatus: (id: string, status: ReportRow['status'], resolution?: string) => Promise<boolean>;
  onAddNote: (id: string, note: string) => Promise<boolean>;
  onSuspendProperty: (id: string, name: string) => void;
  onSuspendLandlord: (id: string, name: string) => void;
  onBlockLandlord: (id: string, name: string) => void;
  onLiftPropertySuspension: (id: string, name: string) => void;
  onLiftLandlordSuspension: (id: string, name: string) => void;
  onUnblockLandlord: (id: string, name: string) => void;
  createLog: (input: AuditLogInput) => Promise<unknown>;
}) {
  const [report, setReport] = useState(initialReport);
  const [noteText, setNoteText] = useState(report.internalNote || '');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [sanctions, setSanctions] = useState<SanctionState>(INITIAL_SANCTIONS);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const isAccommodation = report.targetType === 'accommodation' || report.targetType === 'listing';
  const isUser = report.targetType === 'user';

  const statusCfg = getStatusCfg(report.status);
  const severityCfg = getSeverityCfg(report.severity);
  const isActionable = report.status !== 'resolved' && report.status !== 'dismissed';
  const hasSanctions = sanctions.propertySuspended || sanctions.landlordSuspended || sanctions.landlordBlocked;
  const hasLiftableActions =
    (sanctions.propertySuspended && isAccommodation) ||
    sanctions.landlordSuspended ||
    sanctions.landlordBlocked;

  const handleResolve = async (newStatus: ReportRow['status']) => {
    const ok = await onUpdateStatus(report.id, newStatus, noteText || undefined);
    if (!ok) { toast.error('Erro ao atualizar a denúncia.'); return; }
    setReport(prev => ({ ...prev, status: newStatus }));
    void createLog({
      action: newStatus === 'resolved' ? 'report_resolved' : 'report_rejected',
      entityType: 'report',
      entityId: report.id,
      entityLabel: `Denúncia: ${REPORT_TYPE_LABELS[report.reason] ?? report.reason} — ${report.targetName ?? report.targetId}`,
      note: noteText || undefined,
    });
  };

  const handleSaveNote = async () => {
    const ok = await onAddNote(report.id, noteText);
    if (!ok) { toast.error('Erro ao guardar nota.'); return; }
    setReport(prev => ({ ...prev, internalNote: noteText }));
    setShowNoteInput(false);
    void createLog({
      action: 'note_added',
      entityType: 'report',
      entityId: report.id,
      entityLabel: `Denúncia: ${REPORT_TYPE_LABELS[report.reason] ?? report.reason} — ${report.targetName ?? report.targetId}`,
      note: noteText,
    });
  };

  const executeAction = (action: string) => {
    if (action === 'resolve') { void handleResolve('resolved'); return; }
    if (action === 'reject') { void handleResolve('dismissed'); return; }
    if (action === 'under_review') { void handleResolve('under_review'); return; }

    const name = report.targetName ?? report.targetId;

    switch (action) {
      case 'suspend_property':
        setSanctions(s => ({ ...s, propertySuspended: true, propertySuspensionLifted: false }));
        onSuspendProperty(report.targetId, name);
        void createLog({ action: 'property_suspended', entityType: 'property', entityId: report.targetId, entityLabel: name, note: `Suspenso por denúncia ${report.id}` });
        break;
      case 'suspend_landlord':
        setSanctions(s => ({ ...s, landlordSuspended: true, landlordSuspensionLifted: false }));
        onSuspendLandlord(report.targetId, name);
        void createLog({ action: 'landlord_suspended', entityType: 'landlord', entityId: report.targetId, entityLabel: name, note: `Suspenso por denúncia ${report.id}` });
        break;
      case 'block_landlord':
        setSanctions(s => ({ ...s, landlordBlocked: true, landlordSuspended: true, landlordUnblocked: false, landlordSuspensionLifted: false }));
        onBlockLandlord(report.targetId, name);
        void createLog({ action: 'publishing_blocked', entityType: 'landlord', entityId: report.targetId, entityLabel: name, note: `Bloqueado por denúncia ${report.id}` });
        break;
      case 'lift_property_suspension':
        setSanctions(s => ({ ...s, propertySuspended: false, propertySuspensionLifted: true }));
        onLiftPropertySuspension(report.targetId, name);
        void createLog({ action: 'property_suspension_lifted', entityType: 'property', entityId: report.targetId, entityLabel: name, note: 'Suspensão levantada manualmente' });
        break;
      case 'lift_landlord_suspension':
        setSanctions(s => ({ ...s, landlordSuspended: false, landlordSuspensionLifted: true }));
        onLiftLandlordSuspension(report.targetId, name);
        void createLog({ action: 'landlord_suspension_lifted', entityType: 'landlord', entityId: report.targetId, entityLabel: name, note: 'Suspensão levantada manualmente' });
        break;
      case 'unblock_landlord':
        setSanctions(s => ({ ...s, landlordBlocked: false, landlordSuspended: false, landlordUnblocked: true }));
        onUnblockLandlord(report.targetId, name);
        void createLog({ action: 'user_unblocked', entityType: 'landlord', entityId: report.targetId, entityLabel: name, note: 'Bloqueio de publicação removido manualmente' });
        break;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                <Flag className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold">Detalhe da Denúncia</h3>
                <p className="text-xs text-muted-foreground">{report.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5">

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.cls}`}>
                <statusCfg.icon className="w-3.5 h-3.5" />
                {statusCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${severityCfg.cls}`}>
                {severityCfg.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-muted">
                {REPORT_TYPE_LABELS[report.reason] ?? report.reason}
              </span>
            </div>

            {/* Active sanctions */}
            {hasSanctions && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-semibold text-red-800">Sanções ativas (sessão atual)</p>
                {sanctions.propertySuspended && (
                  <div className="flex items-center gap-1.5 text-xs text-red-700">
                    <ShieldOff className="w-3.5 h-3.5" /> Anúncio suspenso pelo admin
                  </div>
                )}
                {sanctions.landlordSuspended && (
                  <div className="flex items-center gap-1.5 text-xs text-red-700">
                    <UserX className="w-3.5 h-3.5" /> Conta suspensa
                  </div>
                )}
                {sanctions.landlordBlocked && (
                  <div className="flex items-center gap-1.5 text-xs text-red-700">
                    <Ban className="w-3.5 h-3.5" /> Bloqueado de publicar novos anúncios
                  </div>
                )}
              </div>
            )}

            {/* Lifted sanctions */}
            {(sanctions.propertySuspensionLifted || sanctions.landlordSuspensionLifted || sanctions.landlordUnblocked) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-semibold text-green-800">Sanções levantadas</p>
                {sanctions.propertySuspensionLifted && (
                  <div className="flex items-center gap-1.5 text-xs text-green-700">
                    <ShieldCheck className="w-3.5 h-3.5" /> Suspensão de anúncio levantada
                  </div>
                )}
                {sanctions.landlordSuspensionLifted && (
                  <div className="flex items-center gap-1.5 text-xs text-green-700">
                    <UserCheck className="w-3.5 h-3.5" /> Suspensão de conta levantada
                  </div>
                )}
                {sanctions.landlordUnblocked && (
                  <div className="flex items-center gap-1.5 text-xs text-green-700">
                    <Unlock className="w-3.5 h-3.5" /> Bloqueio de publicação removido
                  </div>
                )}
              </div>
            )}

            {/* Parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">ALVO DA DENÚNCIA</p>
                <p className="text-sm font-semibold">{report.targetName ?? report.targetId}</p>
                <p className="text-xs text-muted-foreground">
                  {TARGET_TYPE_LABELS[report.targetType] ?? report.targetType}
                  {' · '}
                  <span className="font-mono">{report.targetId.slice(0, 12)}…</span>
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {sanctions.landlordSuspended && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold">
                      <UserX className="w-2.5 h-2.5" /> Suspenso
                    </span>
                  )}
                  {sanctions.landlordBlocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-semibold">
                      <Ban className="w-2.5 h-2.5" /> Bloqueado
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">DENUNCIANTE</p>
                <p className="text-sm font-semibold">Utilizador autenticado</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {report.reporterId ? `${report.reporterId.slice(0, 12)}…` : 'ID não disponível'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Submetido em {formatDate(report.createdAt)}
                </p>
              </div>
            </div>

            {/* Anúncio suspenso context */}
            {sanctions.propertySuspended && isAccommodation && (
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">IMÓVEL</p>
                <div className="flex items-center gap-2 text-sm">
                  <Home className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{report.targetName ?? report.targetId}</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold">
                    <ShieldOff className="w-2.5 h-2.5" /> Suspenso
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">DESCRIÇÃO</p>
              <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-xl p-3">
                "{report.description}"
              </p>
            </div>

            {/* Resolution */}
            {report.resolution && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">RESOLUÇÃO</p>
                <p className="text-sm text-foreground bg-green-50 border border-green-100 rounded-xl p-3">
                  {report.resolution}
                </p>
              </div>
            )}

            {/* Internal note */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground">NOTA INTERNA</p>
                {isActionable && (
                  <button
                    onClick={() => setShowNoteInput(!showNoteInput)}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    {showNoteInput ? 'Cancelar' : 'Editar'}
                  </button>
                )}
              </div>
              {showNoteInput ? (
                <div className="space-y-2">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    rows={3}
                    placeholder="Adicionar nota interna..."
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                  <button
                    onClick={() => void handleSaveNote()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    <FilePen className="w-3.5 h-3.5" />
                    Guardar nota
                  </button>
                </div>
              ) : (
                <p className={`text-sm rounded-xl p-3 ${report.internalNote ? 'bg-blue-50 border border-blue-100 text-blue-800' : 'text-muted-foreground italic'}`}>
                  {report.internalNote || 'Sem nota interna.'}
                </p>
              )}
            </div>

            {/* Admin actions */}
            {isActionable && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3">AÇÕES DE MODERAÇÃO</p>

                {report.status === 'pending' && (
                  <button
                    onClick={() => setPendingAction({ action: 'under_review', title: 'Iniciar análise?', description: 'A denúncia passará para "Em Análise". Podes continuar a adicionar notas internas.', confirmLabel: 'Iniciar análise', variant: 'neutral' })}
                    className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-medium hover:bg-amber-100 transition-colors mb-3 w-full sm:w-auto"
                  >
                    <Clock className="w-4 h-4" />
                    Marcar em análise
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {isAccommodation && !sanctions.propertySuspended && (
                    <button
                      onClick={() => setPendingAction({ action: 'suspend_property', title: 'Suspender anúncio?', description: `O anúncio "${report.targetName ?? report.targetId}" ficará invisível para estudantes imediatamente.`, confirmLabel: 'Suspender anúncio', variant: 'destructive' })}
                      className="flex items-center gap-2 px-3 py-2.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-xs font-medium hover:bg-orange-100 transition-colors"
                    >
                      <ShieldOff className="w-4 h-4" />
                      Suspender anúncio
                    </button>
                  )}
                  {isUser && !sanctions.landlordSuspended && (
                    <button
                      onClick={() => setPendingAction({ action: 'suspend_landlord', title: 'Suspender utilizador?', description: `A conta de "${report.targetName ?? report.targetId}" será suspensa.`, confirmLabel: 'Suspender utilizador', variant: 'destructive' })}
                      className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                      Suspender utilizador
                    </button>
                  )}
                  {isUser && !sanctions.landlordBlocked && (
                    <button
                      onClick={() => setPendingAction({ action: 'block_landlord', title: 'Bloquear novos anúncios?', description: `"${report.targetName ?? report.targetId}" ficará impedido de publicar novos anúncios.`, confirmLabel: 'Bloquear publicação', variant: 'destructive' })}
                      className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                      Bloquear novos anúncios
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingAction({ action: 'reject', title: 'Rejeitar denúncia?', description: 'Esta denúncia será marcada como rejeitada. O processo de moderação será encerrado.', confirmLabel: 'Rejeitar denúncia', variant: 'neutral' })}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-border text-muted-foreground rounded-xl text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <XSquare className="w-4 h-4" />
                    Rejeitar denúncia
                  </button>
                  <button
                    onClick={() => setPendingAction({ action: 'resolve', title: 'Resolver denúncia?', description: 'Esta denúncia será marcada como resolvida. Confirma que o problema foi tratado adequadamente.', confirmLabel: 'Marcar como resolvida', variant: 'positive' })}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Marcar como resolvida
                  </button>
                </div>
              </div>
            )}

            {/* Lift sanctions */}
            {hasLiftableActions && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3">LEVANTAR SANÇÕES</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sanctions.propertySuspended && isAccommodation && (
                    <button
                      onClick={() => setPendingAction({ action: 'lift_property_suspension', title: 'Levantar suspensão do anúncio?', description: 'A suspensão do anúncio será removida. Voltará a ficar visível para os estudantes.', confirmLabel: 'Levantar suspensão', variant: 'positive' })}
                      className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium hover:bg-green-100 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Levantar suspensão do anúncio
                    </button>
                  )}
                  {sanctions.landlordSuspended && (
                    <button
                      onClick={() => setPendingAction({ action: 'lift_landlord_suspension', title: 'Levantar suspensão?', description: 'A suspensão da conta será removida. O utilizador voltará a poder gerir os seus anúncios.', confirmLabel: 'Levantar suspensão', variant: 'positive' })}
                      className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium hover:bg-green-100 transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      Levantar suspensão do utilizador
                    </button>
                  )}
                  {sanctions.landlordBlocked && (
                    <button
                      onClick={() => setPendingAction({ action: 'unblock_landlord', title: 'Permitir publicação novamente?', description: 'O bloqueio de publicação será removido. O utilizador poderá voltar a publicar novos anúncios.', confirmLabel: 'Permitir publicação', variant: 'positive' })}
                      className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Unlock className="w-4 h-4" />
                      Permitir publicação novamente
                    </button>
                  )}
                </div>
              </div>
            )}

            {!isActionable && !hasLiftableActions && (
              <div className="border-t border-border pt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Esta denúncia foi {report.status === 'resolved' ? 'resolvida' : 'rejeitada'}
                  {report.resolvedAt ? ` em ${formatDate(report.resolvedAt)}` : ''}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction) { executeAction(pendingAction.action); setPendingAction(null); }
        }}
        title={pendingAction?.title || ''}
        description={pendingAction?.description || ''}
        cancelLabel="Cancelar"
        confirmLabel={pendingAction?.confirmLabel || 'Confirmar'}
        variant={pendingAction?.variant || 'destructive'}
      />
    </>
  );
}

// ─── AdminReports ─────────────────────────────────────────────────────────────

export function AdminReports() {
  const { user } = useAuth();
  const { properties, rooms, updateRoomStatus, adminSuspendProperty, liftAdminSuspension } = useProperties();
  const { reports, loading, updateStatus, addInternalNote } = useReports();
  const { createLog } = useAdminAuditLogs({ limit: 1 });
  const adminLabel = user?.name ?? user?.email ?? 'Admin UniRoom';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ReportRow['status']>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | string>('all');
  const [filterReason, setFilterReason] = useState<'all' | string>('all');
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);

  const stats = {
    open: reports.filter(r => r.status === 'pending').length,
    inReview: reports.filter(r => r.status === 'under_review').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    critical: reports.filter(
      r => r.severity === 'critical' && r.status !== 'resolved' && r.status !== 'dismissed',
    ).length,
  };

  const filtered = reports.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (r.targetName?.toLowerCase().includes(q) ?? false) ||
      r.description.toLowerCase().includes(q) ||
      (REPORT_TYPE_LABELS[r.reason] ?? r.reason).toLowerCase().includes(q);
    return (
      matchesSearch &&
      (filterStatus === 'all' || r.status === filterStatus) &&
      (filterSeverity === 'all' || r.severity === filterSeverity) &&
      (filterReason === 'all' || r.reason === filterReason)
    );
  });

  // ── Sanction handlers (UI-only, mock side effects) ──────────────────────────

  const updateUserStatus = async (
    userId: string,
    patch: { status?: 'active' | 'suspended'; blocked_from_publishing?: boolean; admin_reason?: string | null },
  ) => {
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (error) {
      console.error('[AdminReports] profile update error:', error.message);
      toast.error('Erro ao atualizar utilizador.');
      return false;
    }
    return true;
  };

  const handleSuspendProperty = (propertyId: string, propertyTitle: string) => {
    adminSuspendProperty(propertyId, 'Suspenso por denúncia na plataforma UniRoom', adminLabel);
    rooms
      .filter(r => r.propertyId === propertyId && r.status === 'available')
      .forEach(room => updateRoomStatus(room.id, 'paused'));
    toast.success(`Anúncio "${propertyTitle}" suspenso com sucesso.`);
  };

  const handleSuspendLandlord = async (landlordId: string, landlordName: string) => {
    const ok = await updateUserStatus(landlordId, {
      status: 'suspended',
      admin_reason: 'Suspenso por moderação admin',
    });
    if (!ok) return;
    properties
      .filter(p => p.landlordId === landlordId && p.status === 'active')
      .forEach(p => {
        adminSuspendProperty(p.id, 'Suspenso por suspensão de conta do senhorio', adminLabel);
        rooms
          .filter(r => r.propertyId === p.id && r.status === 'available')
          .forEach(room => updateRoomStatus(room.id, 'paused'));
      });
    toast.success(`Utilizador "${landlordName}" suspenso com sucesso.`);
  };

  const handleBlockLandlord = async (landlordId: string, landlordName: string) => {
    const ok = await updateUserStatus(landlordId, {
      status: 'suspended',
      blocked_from_publishing: true,
      admin_reason: 'Bloqueado de publicar novos anúncios',
    });
    if (!ok) return;
    toast.success(`Publicação bloqueada para "${landlordName}".`);
  };

  const handleLiftPropertySuspension = (propertyId: string, _name: string) => {
    liftAdminSuspension(propertyId);
    toast.success('Suspensão do anúncio levantada.');
  };

  const handleLiftLandlordSuspension = async (landlordId: string, _name: string) => {
    const ok = await updateUserStatus(landlordId, {
      status: 'active',
      admin_reason: null,
    });
    if (!ok) return;
    toast.success('Suspensão do utilizador levantada.');
  };

  const handleUnblockLandlord = async (landlordId: string, _name: string) => {
    const ok = await updateUserStatus(landlordId, {
      status: 'active',
      blocked_from_publishing: false,
      admin_reason: null,
    });
    if (!ok) return;
    toast.success('Bloqueio de publicação removido.');
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Moderação & Denúncias</h1>
        <p className="text-sm text-gray-500">Gere fraudes, abusos e violações das regras da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Abertas', value: stats.open, cls: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'Em Análise', value: stats.inReview, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Resolvidas', value: stats.resolved, cls: 'bg-green-50 border-green-200 text-green-700' },
          {
            label: 'Críticas',
            value: stats.critical,
            cls: stats.critical > 0 ? 'bg-red-100 border-red-300 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-600',
          },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-3 text-center ${s.cls}`}>
            <p className="text-2xl font-bold">{loading ? '—' : s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por alvo, descrição ou tipo..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todos os estados</option>
            <option value="pending">Aberta</option>
            <option value="under_review">Em Análise</option>
            <option value="reviewed">Em Revisão</option>
            <option value="resolved">Resolvida</option>
            <option value="dismissed">Rejeitada</option>
          </select>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todas as prioridades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
          <select
            value={filterReason}
            onChange={e => setFilterReason(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todos os tipos</option>
            {Object.entries(REPORT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <Card className="p-12 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-gray-500">A carregar denúncias…</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Flag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">Sem denúncias</p>
          <p className="text-sm text-gray-500">
            {searchQuery || filterStatus !== 'all' || filterSeverity !== 'all' || filterReason !== 'all'
              ? 'Nenhuma denúncia corresponde aos filtros aplicados.'
              : 'Não existem denúncias na plataforma.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => {
            const statusCfg = getStatusCfg(report.status);
            const severityCfg = getSeverityCfg(report.severity);
            const StatusIcon = statusCfg.icon;
            const isCritical = report.severity === 'critical';
            const isActive = report.status !== 'resolved' && report.status !== 'dismissed';

            return (
              <div
                key={report.id}
                className={`border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all ${
                  isCritical && isActive
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-border bg-card hover:border-primary/20'
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCritical ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    {isCritical
                      ? <ShieldAlert className="w-5 h-5 text-red-600" />
                      : <Flag className="w-5 h-5 text-amber-600" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${severityCfg.cls}`}>
                        {severityCfg.label}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {REPORT_TYPE_LABELS[report.reason] ?? report.reason}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusCfg.cls}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {statusCfg.label}
                      </span>
                    </div>

                    <p className="text-sm text-foreground leading-snug line-clamp-2 mb-2">
                      {report.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Alvo: <span className="font-medium text-foreground">{report.targetName ?? report.targetId}</span>
                      </span>
                      <span>{TARGET_TYPE_LABELS[report.targetType] ?? report.targetType}</span>
                      <span className="ml-auto">{formatDate(report.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    onClick={e => { e.stopPropagation(); setSelectedReport(report); }}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-lg text-xs hover:bg-muted transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Abrir
                  </button>
                </div>

                {report.internalNote && (
                  <div className="mt-2 ml-12 flex items-start gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                    <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{report.internalNote}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdateStatus={updateStatus}
          onAddNote={addInternalNote}
          onSuspendProperty={handleSuspendProperty}
          onSuspendLandlord={handleSuspendLandlord}
          onBlockLandlord={handleBlockLandlord}
          onLiftPropertySuspension={handleLiftPropertySuspension}
          onLiftLandlordSuspension={handleLiftLandlordSuspension}
          onUnblockLandlord={handleUnblockLandlord}
          createLog={createLog}
        />
      )}
    </div>
  );
}

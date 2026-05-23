import { useState } from 'react';
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
  BedDouble,
  FilePen,
  CheckSquare,
  XSquare,
  PauseCircle,
  Unlock,
} from 'lucide-react';
import { Card } from '../../components/Card';
import {
  AdminReport,
  ReportType,
  ReportStatus,
  ReportPriority,
  AdminActionType,
  getAllReports,
  updateReportStatus,
  addInternalNote,
  applyAdminAction,
} from '../../data/mockAdminReports';
import { addAuditEntry } from '../../data/mockAdminAudit';
import {
  setUserSuspended,
  setUserBlockedFromPublishing,
  liftUserSuspension,
  unblockUserPublishing,
} from '../../data/mockAdminUsersState';
import { useProperties } from '../../context/PropertiesContext';

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  fraude_possivel: 'Possível Fraude',
  localizacao_falsa: 'Localização Falsa',
  pagamento_externo: 'Pagamento Fora da Plataforma',
  fotos_enganosas: 'Fotos Enganosas',
  identidade_nao_verificada: 'Identidade Não Verificada',
  comportamento_abusivo: 'Comportamento Abusivo',
};

const PRIORITY_CONFIG: Record<ReportPriority, { label: string; cls: string }> = {
  baixa: { label: 'Baixa', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  media: { label: 'Média', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  alta: { label: 'Alta', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  critica: { label: 'Crítica', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; cls: string; icon: React.ElementType }> = {
  aberta: { label: 'Aberta', cls: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
  em_analise: { label: 'Em Análise', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  resolvida: { label: 'Resolvida', cls: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  rejeitada: { label: 'Rejeitada', cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: XSquare },
};

const ADMIN_ID = 'admin-1';
const ADMIN_NAME = 'Admin UniRoom';

// ─── ReportDetailModal ────────────────────────────────────────────────────────

function ReportDetailModal({
  report: initialReport,
  onClose,
  onUpdate,
  onSuspendProperty,
  onSuspendLandlord,
  onBlockLandlord,
  onLiftPropertySuspension,
  onLiftLandlordSuspension,
  onUnblockLandlord,
}: {
  report: AdminReport;
  onClose: () => void;
  onUpdate: (report: AdminReport) => void;
  onSuspendProperty: (propertyId: string, propertyTitle: string) => void;
  onSuspendLandlord: (landlordId: string, landlordName: string) => void;
  onBlockLandlord: (landlordId: string, landlordName: string) => void;
  onLiftPropertySuspension: (propertyId: string, propertyTitle: string) => void;
  onLiftLandlordSuspension: (landlordId: string, landlordName: string) => void;
  onUnblockLandlord: (landlordId: string, landlordName: string) => void;
}) {
  const [report, setReport] = useState(initialReport);
  const [noteText, setNoteText] = useState(report.internalNote || '');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const applyAction = (action: AdminActionType) => {
    const updated = applyAdminAction(report.id, action);
    if (!updated) return;
    setReport(updated);
    onUpdate(updated);

    switch (action) {
      case 'suspend_property':
        if (report.propertyId) {
          onSuspendProperty(report.propertyId, report.propertyTitle || report.landlordName);
          addAuditEntry({ action: 'property_suspended', entityType: 'property', entityId: report.propertyId, entityName: report.propertyTitle || report.landlordName, adminId: ADMIN_ID, adminName: ADMIN_NAME, note: `Suspenso por denúncia ${report.id}` });
        }
        break;
      case 'suspend_landlord':
        onSuspendLandlord(report.landlordId, report.landlordName);
        addAuditEntry({ action: 'landlord_suspended', entityType: 'landlord', entityId: report.landlordId, entityName: report.landlordName, adminId: ADMIN_ID, adminName: ADMIN_NAME, note: `Suspenso por denúncia ${report.id}` });
        break;
      case 'block_landlord':
        onBlockLandlord(report.landlordId, report.landlordName);
        addAuditEntry({ action: 'landlord_blocked', entityType: 'landlord', entityId: report.landlordId, entityName: report.landlordName, adminId: ADMIN_ID, adminName: ADMIN_NAME, note: `Bloqueado por denúncia ${report.id}` });
        break;
      case 'lift_property_suspension':
        if (report.propertyId) {
          onLiftPropertySuspension(report.propertyId, report.propertyTitle || report.landlordName);
          addAuditEntry({ action: 'property_suspension_lifted', entityType: 'property', entityId: report.propertyId, entityName: report.propertyTitle || report.landlordName, adminId: ADMIN_ID, adminName: ADMIN_NAME, note: `Suspensão levantada manualmente` });
        }
        break;
      case 'lift_landlord_suspension':
        onLiftLandlordSuspension(report.landlordId, report.landlordName);
        addAuditEntry({ action: 'landlord_suspension_lifted', entityType: 'landlord', entityId: report.landlordId, entityName: report.landlordName, adminId: ADMIN_ID, adminName: ADMIN_NAME, note: `Suspensão levantada manualmente` });
        break;
      case 'unblock_landlord':
        onUnblockLandlord(report.landlordId, report.landlordName);
        addAuditEntry({ action: 'landlord_unblocked', entityType: 'landlord', entityId: report.landlordId, entityName: report.landlordName, adminId: ADMIN_ID, adminName: ADMIN_NAME, note: `Bloqueio de publicação removido manualmente` });
        break;
    }
  };

  const handleResolve = (newStatus: ReportStatus) => {
    const updated = updateReportStatus(report.id, newStatus, ADMIN_ID, noteText || undefined);
    if (!updated) return;
    setReport(updated);
    onUpdate(updated);
    addAuditEntry({
      action: newStatus === 'resolvida' ? 'report_resolved' : 'report_rejected',
      entityType: 'report',
      entityId: report.id,
      entityName: `Denúncia: ${REPORT_TYPE_LABELS[report.type]} — ${report.landlordName}`,
      adminId: ADMIN_ID,
      adminName: ADMIN_NAME,
      note: noteText || undefined,
    });
  };

  const handleSaveNote = () => {
    const updated = addInternalNote(report.id, noteText);
    if (!updated) return;
    setReport(updated);
    onUpdate(updated);
    setShowNoteInput(false);
    addAuditEntry({ action: 'note_added', entityType: 'report', entityId: report.id, entityName: `Denúncia: ${REPORT_TYPE_LABELS[report.type]} — ${report.landlordName}`, adminId: ADMIN_ID, adminName: ADMIN_NAME, note: noteText });
  };

  const statusCfg = STATUS_CONFIG[report.status];
  const priorityCfg = PRIORITY_CONFIG[report.priority];
  const isActionable = report.status !== 'resolvida' && report.status !== 'rejeitada';
  const hasSanctions = report.propertySuspended || report.landlordSuspended || report.landlordBlocked;
  const hasLiftableActions = (report.propertySuspended && report.propertyId) || report.landlordSuspended || report.landlordBlocked;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
            {/* Header badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.cls}`}>
                <statusCfg.icon className="w-3.5 h-3.5" />
                {statusCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${priorityCfg.cls}`}>
                {priorityCfg.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-muted">
                {REPORT_TYPE_LABELS[report.type]}
              </span>
            </div>

            {/* Active sanctions */}
            {hasSanctions && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-semibold text-red-800">Sanções ativas</p>
                {report.propertySuspended && (
                  <div className="flex items-center gap-1.5 text-xs text-red-700">
                    <ShieldOff className="w-3.5 h-3.5" /> Anúncio suspenso pelo admin
                  </div>
                )}
                {report.landlordSuspended && (
                  <div className="flex items-center gap-1.5 text-xs text-red-700">
                    <UserX className="w-3.5 h-3.5" /> Conta de senhorio suspensa
                  </div>
                )}
                {report.landlordBlocked && (
                  <div className="flex items-center gap-1.5 text-xs text-red-700">
                    <Ban className="w-3.5 h-3.5" /> Bloqueado de publicar novos anúncios
                  </div>
                )}
              </div>
            )}

            {/* Lifted sanctions info */}
            {(report.propertySuspensionLifted || report.landlordSuspensionLifted || report.landlordUnblocked) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-semibold text-green-800">Sanções levantadas</p>
                {report.propertySuspensionLifted && (
                  <div className="flex items-center gap-1.5 text-xs text-green-700">
                    <ShieldCheck className="w-3.5 h-3.5" /> Suspensão de anúncio levantada
                  </div>
                )}
                {report.landlordSuspensionLifted && (
                  <div className="flex items-center gap-1.5 text-xs text-green-700">
                    <UserCheck className="w-3.5 h-3.5" /> Suspensão de conta levantada
                  </div>
                )}
                {report.landlordUnblocked && (
                  <div className="flex items-center gap-1.5 text-xs text-green-700">
                    <Unlock className="w-3.5 h-3.5" /> Bloqueio de publicação removido
                  </div>
                )}
              </div>
            )}

            {/* Parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">DENUNCIANTE</p>
                <p className="text-sm font-semibold">{report.reportedByStudentName}</p>
                <p className="text-xs text-muted-foreground">Estudante · {report.reportedByStudentId}</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">SENHORIO DENUNCIADO</p>
                <p className="text-sm font-semibold">{report.landlordName}</p>
                <p className="text-xs text-muted-foreground">{report.landlordId}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {report.landlordSuspended && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold">
                      <UserX className="w-2.5 h-2.5" /> Suspenso
                    </span>
                  )}
                  {report.landlordBlocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-semibold">
                      <Ban className="w-2.5 h-2.5" /> Bloqueado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Property/room context */}
            {(report.propertyTitle || report.roomTitle) && (
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">IMÓVEL ASSOCIADO</p>
                {report.propertyTitle && (
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{report.propertyTitle}</span>
                    {report.propertySuspended && (
                      <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold">
                        <ShieldOff className="w-2.5 h-2.5" /> Suspenso
                      </span>
                    )}
                  </div>
                )}
                {report.roomTitle && (
                  <div className="flex items-center gap-2 text-sm">
                    <BedDouble className="w-4 h-4 text-muted-foreground" />
                    <span>{report.roomTitle}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">DESCRIÇÃO</p>
              <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-xl p-3">
                "{report.description}"
              </p>
            </div>

            {/* Internal note */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground">NOTA INTERNA</p>
                <button
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  {showNoteInput ? 'Cancelar' : 'Editar'}
                </button>
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
                    onClick={handleSaveNote}
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

            {/* Admin actions — apply sanctions */}
            {isActionable && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3">AÇÕES DE MODERAÇÃO</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {report.propertyId && !report.propertySuspended && (
                    <button
                      onClick={() => applyAction('suspend_property')}
                      className="flex items-center gap-2 px-3 py-2.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-xs font-medium hover:bg-orange-100 transition-colors"
                    >
                      <ShieldOff className="w-4 h-4" />
                      Suspender anúncio
                    </button>
                  )}
                  {!report.landlordSuspended && (
                    <button
                      onClick={() => applyAction('suspend_landlord')}
                      className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                      Suspender senhorio
                    </button>
                  )}
                  {!report.landlordBlocked && (
                    <button
                      onClick={() => applyAction('block_landlord')}
                      className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                      Bloquear novos anúncios
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolve('rejeitada')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-border text-muted-foreground rounded-xl text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <XSquare className="w-4 h-4" />
                    Rejeitar denúncia
                  </button>
                  <button
                    onClick={() => handleResolve('resolvida')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Marcar como resolvida
                  </button>
                </div>
              </div>
            )}

            {/* Lift sanctions — always shown when sanctions exist */}
            {hasLiftableActions && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3">LEVANTAR SANÇÕES</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {report.propertySuspended && report.propertyId && (
                    <button
                      onClick={() => applyAction('lift_property_suspension')}
                      className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium hover:bg-green-100 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Levantar suspensão do anúncio
                    </button>
                  )}
                  {report.landlordSuspended && (
                    <button
                      onClick={() => applyAction('lift_landlord_suspension')}
                      className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium hover:bg-green-100 transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      Levantar suspensão do senhorio
                    </button>
                  )}
                  {report.landlordBlocked && (
                    <button
                      onClick={() => applyAction('unblock_landlord')}
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
                  Esta denúncia foi {report.status === 'resolvida' ? 'resolvida' : 'rejeitada'}
                  {report.resolvedAt ? ` em ${report.resolvedAt}` : ''}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── AdminReports ─────────────────────────────────────────────────────────────

export function AdminReports() {
  const { properties, rooms, updateRoomStatus, adminSuspendProperty, liftAdminSuspension } = useProperties();
  const [reports, setReports] = useState<AdminReport[]>(() => getAllReports());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ReportStatus>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | ReportPriority>('all');
  const [filterType, setFilterType] = useState<'all' | ReportType>('all');
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);

  const filtered = reports.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      r.reportedByStudentName.toLowerCase().includes(q) ||
      r.landlordName.toLowerCase().includes(q) ||
      (r.propertyTitle?.toLowerCase().includes(q) ?? false) ||
      r.description.toLowerCase().includes(q);
    return matchesSearch &&
      (filterStatus === 'all' || r.status === filterStatus) &&
      (filterPriority === 'all' || r.priority === filterPriority) &&
      (filterType === 'all' || r.type === filterType);
  });

  const handleUpdate = (updated: AdminReport) => {
    setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
    if (selectedReport?.id === updated.id) setSelectedReport(updated);
  };

  // ── Suspend (apply) ──────────────────────────────────────────────────────────

  const handleSuspendProperty = (propertyId: string, propertyTitle: string) => {
    adminSuspendProperty(propertyId, `Suspenso por denúncia na plataforma UniRoom`, ADMIN_NAME);
    const propertyRooms = rooms.filter(r => r.propertyId === propertyId);
    propertyRooms.forEach(room => {
      if (room.status === 'available') updateRoomStatus(room.id, 'paused');
    });
  };

  const handleSuspendLandlord = (landlordId: string, _landlordName: string) => {
    setUserSuspended(landlordId, true, `Suspenso por moderação admin`);
    const landlordProperties = properties.filter(p => p.landlordId === landlordId && p.status === 'active');
    landlordProperties.forEach(p => {
      adminSuspendProperty(p.id, `Suspenso por suspensão de conta do senhorio`, ADMIN_NAME);
      const propertyRooms = rooms.filter(r => r.propertyId === p.id && r.status === 'available');
      propertyRooms.forEach(room => updateRoomStatus(room.id, 'paused'));
    });
  };

  const handleBlockLandlord = (landlordId: string, _landlordName: string) => {
    setUserBlockedFromPublishing(landlordId, true, `Bloqueado de publicar novos anúncios`);
    setUserSuspended(landlordId, true, `Suspenso por moderação admin`);
  };

  // ── Lift (reverse) ───────────────────────────────────────────────────────────

  const handleLiftPropertySuspension = (propertyId: string, _propertyTitle: string) => {
    liftAdminSuspension(propertyId);
    // Property stays paused; landlord can reactivate manually
  };

  const handleLiftLandlordSuspension = (landlordId: string, _landlordName: string) => {
    // Only lift suspension — blockedFromPublishing stays as-is
    liftUserSuspension(landlordId);
  };

  const handleUnblockLandlord = (landlordId: string, _landlordName: string) => {
    // Only remove publishing block — suspended stays as-is
    unblockUserPublishing(landlordId);
  };

  const stats = {
    open: reports.filter(r => r.status === 'aberta').length,
    inReview: reports.filter(r => r.status === 'em_analise').length,
    resolved: reports.filter(r => r.status === 'resolvida').length,
    critical: reports.filter(r => r.priority === 'critica' && r.status !== 'resolvida' && r.status !== 'rejeitada').length,
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
          { label: 'Críticas', value: stats.critical, cls: stats.critical > 0 ? 'bg-red-100 border-red-300 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-600' },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-3 text-center ${s.cls}`}>
            <p className="text-2xl font-bold">{s.value}</p>
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
              placeholder="Pesquisar por nome, senhorio, imóvel..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todos os estados</option>
            <option value="aberta">Aberta</option>
            <option value="em_analise">Em Análise</option>
            <option value="resolvida">Resolvida</option>
            <option value="rejeitada">Rejeitada</option>
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as typeof filterPriority)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todas as prioridades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as typeof filterType)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todos os tipos</option>
            {(Object.entries(REPORT_TYPE_LABELS) as [ReportType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Reports list */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Flag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">Sem denúncias</p>
          <p className="text-sm text-gray-500">
            {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all'
              ? 'Nenhuma denúncia corresponde aos filtros aplicados.'
              : 'Não existem denúncias na plataforma.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => {
            const statusCfg = STATUS_CONFIG[report.status];
            const priorityCfg = PRIORITY_CONFIG[report.priority];
            const StatusIcon = statusCfg.icon;
            const isActive = report.status !== 'resolvida' && report.status !== 'rejeitada';

            return (
              <div
                key={report.id}
                className={`border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all ${
                  report.priority === 'critica' && isActive
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-border bg-card hover:border-primary/20'
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    report.priority === 'critica' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    {report.priority === 'critica'
                      ? <ShieldAlert className="w-5 h-5 text-red-600" />
                      : <Flag className="w-5 h-5 text-amber-600" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityCfg.cls}`}>
                        {priorityCfg.label}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {REPORT_TYPE_LABELS[report.type]}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusCfg.cls}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {statusCfg.label}
                      </span>
                      {report.landlordSuspended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-red-50 text-red-700 border-red-200">
                          <UserX className="w-2.5 h-2.5" /> Senhorio suspenso
                        </span>
                      )}
                      {report.propertySuspended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-orange-50 text-orange-700 border-orange-200">
                          <ShieldOff className="w-2.5 h-2.5" /> Anúncio suspenso
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-foreground leading-snug line-clamp-2 mb-2">
                      {report.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Denunciante: <span className="font-medium text-foreground">{report.reportedByStudentName}</span></span>
                      <span>Senhorio: <span className="font-medium text-foreground">{report.landlordName}</span></span>
                      {report.propertyTitle && (
                        <span className="flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          {report.propertyTitle}
                        </span>
                      )}
                      <span className="ml-auto">{report.date}</span>
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
          onUpdate={handleUpdate}
          onSuspendProperty={handleSuspendProperty}
          onSuspendLandlord={handleSuspendLandlord}
          onBlockLandlord={handleBlockLandlord}
          onLiftPropertySuspension={handleLiftPropertySuspension}
          onLiftLandlordSuspension={handleLiftLandlordSuspension}
          onUnblockLandlord={handleUnblockLandlord}
        />
      )}
    </div>
  );
}

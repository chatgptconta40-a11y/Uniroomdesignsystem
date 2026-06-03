import { useState } from 'react';
import {
  Clock,
  ShieldOff,
  ShieldCheck,
  Flag,
  UserX,
  UserCheck,
  MessageSquare,
  FilePen,
  Ban,
  Search,
  Activity,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card } from '../../components/Card';
import {
  useAdminAuditLogs,
  AUDIT_ACTION_LABELS,
  type AuditAction,
  type AuditLogEntry,
} from '../../hooks/useAdminAuditLogs';

const ACTION_ICON: Record<string, React.ElementType> = {
  property_suspended: ShieldOff,
  property_reactivated: ShieldCheck,
  property_suspension_lifted: ShieldCheck,
  ad_reactivated: RefreshCw,
  report_resolved: Flag,
  report_rejected: Flag,
  landlord_suspended: UserX,
  landlord_suspension_lifted: UserCheck,
  landlord_blocked: Ban,
  landlord_unblocked: UserCheck,
  user_suspended: UserX,
  user_unblocked: UserCheck,
  publishing_blocked: Ban,
  verification_requested: FilePen,
  verification_approved: UserCheck,
  verification_cleared: UserCheck,
  note_added: MessageSquare,
  settings_updated: FilePen,
};

const ACTION_COLOR: Record<string, string> = {
  property_suspended: 'bg-red-100 text-red-600',
  property_reactivated: 'bg-green-100 text-green-600',
  property_suspension_lifted: 'bg-green-100 text-green-700',
  ad_reactivated: 'bg-green-100 text-green-600',
  report_resolved: 'bg-green-100 text-green-600',
  report_rejected: 'bg-gray-100 text-gray-500',
  landlord_suspended: 'bg-red-100 text-red-600',
  landlord_suspension_lifted: 'bg-green-100 text-green-700',
  landlord_blocked: 'bg-red-100 text-red-700',
  landlord_unblocked: 'bg-blue-100 text-blue-600',
  user_suspended: 'bg-red-100 text-red-600',
  user_unblocked: 'bg-blue-100 text-blue-600',
  publishing_blocked: 'bg-red-100 text-red-700',
  verification_requested: 'bg-amber-100 text-amber-600',
  verification_approved: 'bg-green-100 text-green-600',
  verification_cleared: 'bg-gray-100 text-gray-500',
  note_added: 'bg-blue-100 text-blue-600',
  settings_updated: 'bg-purple-100 text-purple-600',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  property: 'Imóvel',
  landlord: 'Senhorio',
  report: 'Denúncia',
  room: 'Quarto',
  user: 'Utilizador',
  settings: 'Configurações',
};

function shortId(id: string | null | undefined): string {
  if (!id) return '—';
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export function AdminAudit() {
  const { logs, loading } = useAdminAuditLogs({ limit: 500 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<'all' | AuditAction>('all');

  const filtered = logs.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (e.entityLabel?.toLowerCase().includes(q) ?? false) ||
      (e.note?.toLowerCase().includes(q) ?? false) ||
      e.adminId.toLowerCase().includes(q);
    const matchesAction = filterAction === 'all' || e.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const grouped = filtered.reduce((acc, entry) => {
    const dateKey = entry.createdAt.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, AuditLogEntry[]>);

  const actionOptions = Object.entries(AUDIT_ACTION_LABELS) as [AuditAction, string][];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Auditoria</h1>
        <p className="text-sm text-gray-500">Registo completo de ações administrativas na plataforma</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total de ações', value: logs.length, icon: Activity, color: 'bg-blue-100 text-blue-600' },
          {
            label: 'Suspensões',
            value: logs.filter((e) =>
              e.action === 'property_suspended' ||
              e.action === 'landlord_suspended' ||
              e.action === 'user_suspended',
            ).length,
            icon: ShieldOff,
            color: 'bg-red-100 text-red-600',
          },
          {
            label: 'Denúncias resolvidas',
            value: logs.filter((e) => e.action === 'report_resolved').length,
            icon: Flag,
            color: 'bg-green-100 text-green-600',
          },
          {
            label: 'Verificações',
            value: logs.filter((e) => e.action === 'verification_approved' || e.action === 'verification_requested').length,
            icon: UserCheck,
            color: 'bg-amber-100 text-amber-600',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por entidade, admin, nota..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value as typeof filterAction)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todas as ações</option>
            {actionOptions.map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Timeline grouped by day */}
      {loading ? (
        <Card className="p-12 text-center">
          <Loader2 className="w-10 h-10 text-gray-300 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-gray-500">A carregar ações…</p>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">Ainda não há ações administrativas registadas.</p>
          <p className="text-sm text-gray-500">As ações dos administradores aparecerão aqui em tempo real.</p>
        </Card>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">Sem ações para os filtros aplicados</p>
          <p className="text-sm text-gray-500">Ajusta a pesquisa ou o filtro de ação.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayEntries]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted-foreground px-2">{date}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-2">
                {dayEntries.map((entry) => {
                  const Icon = ACTION_ICON[entry.action] || FilePen;
                  const colorCls = ACTION_COLOR[entry.action] || 'bg-gray-100 text-gray-500';

                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/20 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">
                            {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {entry.createdAt.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-medium">
                            {ENTITY_TYPE_LABELS[entry.entityType] ?? entry.entityType}
                          </span>
                          <span className="font-medium text-foreground truncate">
                            {entry.entityLabel ?? shortId(entry.entityId)}
                          </span>
                        </div>

                        {entry.note && (
                          <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded-lg px-2.5 py-1.5 italic">
                            "{entry.note}"
                          </p>
                        )}

                        <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">
                          por {shortId(entry.adminId)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

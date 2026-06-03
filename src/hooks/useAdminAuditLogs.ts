import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type AuditAction =
  | 'property_suspended'
  | 'property_reactivated'
  | 'property_suspension_lifted'
  | 'ad_reactivated'
  | 'report_resolved'
  | 'report_rejected'
  | 'landlord_suspended'
  | 'landlord_suspension_lifted'
  | 'landlord_blocked'
  | 'landlord_unblocked'
  | 'verification_requested'
  | 'verification_approved'
  | 'verification_rejected'
  | 'verification_cleared'
  | 'note_added'
  | 'user_suspended'
  | 'user_unblocked'
  | 'publishing_blocked'
  | 'settings_updated'
  | (string & {});

export type AuditEntityType =
  | 'property'
  | 'landlord'
  | 'report'
  | 'room'
  | 'user'
  | 'settings'
  | (string & {});

export interface AuditLogEntry {
  id: string;
  adminId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  entityLabel: string | null;
  note: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface AuditLogInput {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  entityLabel?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  property_suspended: 'Anúncio suspenso pelo admin',
  property_reactivated: 'Anúncio reativado',
  property_suspension_lifted: 'Suspensão de anúncio levantada',
  ad_reactivated: 'Anúncio reativado',
  report_resolved: 'Denúncia resolvida',
  report_rejected: 'Denúncia rejeitada',
  landlord_suspended: 'Senhorio suspenso',
  landlord_suspension_lifted: 'Suspensão de senhorio levantada',
  landlord_blocked: 'Senhorio bloqueado de publicar',
  landlord_unblocked: 'Senhorio desbloqueado',
  verification_requested: 'Verificação obrigatória pedida',
  verification_approved: 'Verificação aprovada',
  verification_rejected: 'Verificação rejeitada',
  verification_cleared: 'Pedido de verificação removido',
  note_added: 'Nota adicionada',
  user_suspended: 'Utilizador suspenso',
  user_unblocked: 'Utilizador desbloqueado',
  publishing_blocked: 'Publicação bloqueada',
  settings_updated: 'Configurações atualizadas',
};

function rowToEntry(row: any): AuditLogEntry {
  return {
    id: row.id,
    adminId: row.admin_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? null,
    entityLabel: row.entity_label ?? null,
    note: row.note ?? null,
    metadata: row.metadata ?? {},
    createdAt: new Date(row.created_at),
  };
}

function newLogId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useAdminAuditLogs(opts: { limit?: number } = {}) {
  const { user } = useAuth();
  const limit = opts.limit ?? 500;
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (err) {
      console.error('[useAdminAuditLogs] fetch error:', err.message);
      setError(err.message);
      setLogs([]);
    } else {
      setError(null);
      setLogs((data ?? []).map(rowToEntry));
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:admin-audit-logs:${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_audit_logs' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = String((payload.old as { id?: string } | null)?.id ?? '');
            if (!id) return;
            setLogs((prev) => prev.filter((l) => l.id !== id));
            return;
          }
          const incoming = rowToEntry(payload.new);
          setLogs((prev) => {
            const idx = prev.findIndex((l) => l.id === incoming.id);
            if (idx === -1) return [incoming, ...prev].slice(0, limit);
            return prev.map((l) => (l.id === incoming.id ? incoming : l));
          });
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [limit]);

  const createLog = useCallback(async (input: AuditLogInput): Promise<AuditLogEntry | null> => {
    if (!user?.id) {
      console.warn('[useAdminAuditLogs] createLog ignored — no authenticated user');
      return null;
    }
    const id = newLogId();
    const payload = {
      id,
      admin_id: user.id,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      entity_label: input.entityLabel ?? null,
      note: input.note ?? null,
      metadata: input.metadata ?? {},
    };
    const { data, error: err } = await supabase
      .from('admin_audit_logs')
      .insert(payload)
      .select('*')
      .maybeSingle();
    if (err) {
      console.error('[useAdminAuditLogs] insert error:', err.message);
      return null;
    }
    return data ? rowToEntry(data) : null;
  }, [user?.id]);

  return { logs, loading, error, refresh, createLog };
}

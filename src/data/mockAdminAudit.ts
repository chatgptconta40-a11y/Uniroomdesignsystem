// Admin audit log — actions taken by admins on the platform.

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
  | 'note_added';

export type AuditEntityType = 'property' | 'landlord' | 'report' | 'room' | 'user';

export interface AuditEntry {
  id: string;
  date: string; // ISO datetime string
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;
  adminId: string;
  adminName: string;
  note?: string;
}

const STORAGE_KEY = 'uniroom_admin_audit';
const DATA_VERSION_KEY = 'uniroom_admin_audit_version';
const CURRENT_VERSION = '2026-05-v1';

const INITIAL_ENTRIES: AuditEntry[] = [
  {
    id: 'audit-1',
    date: '2026-05-22T14:32:00',
    action: 'report_resolved',
    entityType: 'report',
    entityId: 'rep-5',
    entityName: 'Denúncia: Identidade não verificada — Maria Oliveira',
    adminId: 'admin-1',
    adminName: 'Admin UniRoom',
    note: 'Verificação manual efetuada via email. Documento recebido e validado.',
  },
  {
    id: 'audit-2',
    date: '2026-05-22T11:15:00',
    action: 'verification_approved',
    entityType: 'landlord',
    entityId: 'landlord-2',
    entityName: 'Maria Oliveira',
    adminId: 'admin-1',
    adminName: 'Admin UniRoom',
    note: 'NIF e CC validados manualmente.',
  },
  {
    id: 'audit-3',
    date: '2026-05-21T16:45:00',
    action: 'report_rejected',
    entityType: 'report',
    entityId: 'rep-7',
    entityName: 'Denúncia: Pagamento externo — Carlos Ferreira',
    adminId: 'admin-1',
    adminName: 'Admin UniRoom',
    note: 'Após análise, a transação foi acordada pelos dois lados. Sem evidência de má-fé.',
  },
  {
    id: 'audit-4',
    date: '2026-05-21T09:20:00',
    action: 'verification_requested',
    entityType: 'landlord',
    entityId: 'landlord-3',
    entityName: 'António Silva',
    adminId: 'admin-1',
    adminName: 'Admin UniRoom',
    note: 'Conta criada há menos de 48h com anúncio de alto risco. Pedido de verificação de identidade enviado.',
  },
  {
    id: 'audit-5',
    date: '2026-05-20T14:10:00',
    action: 'note_added',
    entityType: 'report',
    entityId: 'rep-1',
    entityName: 'Denúncia: Pagamento externo — Carlos Ferreira',
    adminId: 'admin-1',
    adminName: 'Admin UniRoom',
    note: 'Padrão recorrente nesta conta. Verificar histórico de pagamentos externos.',
  },
  {
    id: 'audit-6',
    date: '2026-05-19T11:00:00',
    action: 'property_reactivated',
    entityType: 'property',
    entityId: 'prop-2',
    entityName: 'Quarto Luminoso Porto Centro',
    adminId: 'admin-1',
    adminName: 'Admin UniRoom',
    note: 'Suspensão levantada após senhorio corrigir informações de localização.',
  },
  {
    id: 'audit-7',
    date: '2026-05-18T17:30:00',
    action: 'property_suspended',
    entityType: 'property',
    entityId: 'prop-2',
    entityName: 'Quarto Luminoso Porto Centro',
    adminId: 'admin-1',
    adminName: 'Admin UniRoom',
    note: 'Suspenso temporariamente após denúncia de localização falsa. Aguarda correção.',
  },
];

function initStorage(): AuditEntry[] {
  const version = localStorage.getItem(DATA_VERSION_KEY);
  if (version !== CURRENT_VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ENTRIES));
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
    return INITIAL_ENTRIES;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ENTRIES));
    return INITIAL_ENTRIES;
  }
  try {
    return JSON.parse(stored) as AuditEntry[];
  } catch {
    return INITIAL_ENTRIES;
  }
}

function saveAll(entries: AuditEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getAuditLog(): AuditEntry[] {
  return initStorage().sort((a, b) => b.date.localeCompare(a.date));
}

export function addAuditEntry(entry: Omit<AuditEntry, 'id' | 'date'>): AuditEntry {
  const all = initStorage();
  const newEntry: AuditEntry = {
    ...entry,
    id: `audit-${Date.now()}`,
    date: new Date().toISOString(),
  };
  all.unshift(newEntry);
  saveAll(all);
  return newEntry;
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
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
  verification_requested: 'Verificação pedida',
  verification_approved: 'Verificação aprovada',
  note_added: 'Nota adicionada',
};

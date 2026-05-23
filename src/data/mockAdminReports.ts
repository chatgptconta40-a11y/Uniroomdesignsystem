// Admin-side fraud/moderation reports, persisted in localStorage.

export type ReportType =
  | 'fraude_possivel'
  | 'localizacao_falsa'
  | 'pagamento_externo'
  | 'fotos_enganosas'
  | 'identidade_nao_verificada'
  | 'comportamento_abusivo';

export type ReportStatus = 'aberta' | 'em_analise' | 'resolvida' | 'rejeitada';
export type ReportPriority = 'baixa' | 'media' | 'alta' | 'critica';

export interface AdminReport {
  id: string;
  type: ReportType;
  propertyId?: string;
  propertyTitle?: string;
  roomId?: string;
  roomTitle?: string;
  landlordId: string;
  landlordName: string;
  reportedByStudentId: string;
  reportedByStudentName: string;
  description: string;
  date: string; // ISO date string
  priority: ReportPriority;
  status: ReportStatus;
  internalNote?: string;
  resolvedAt?: string;
  resolvedByAdminId?: string;
  // actions applied
  landlordSuspended?: boolean;
  propertySuspended?: boolean;
  landlordBlocked?: boolean;
}

const STORAGE_KEY = 'uniroom_admin_reports';
const DATA_VERSION_KEY = 'uniroom_admin_reports_version';
const CURRENT_VERSION = '2026-05-v1';

const INITIAL_REPORTS: AdminReport[] = [
  {
    id: 'rep-1',
    type: 'pagamento_externo',
    propertyId: 'prop-estgv',
    propertyTitle: 'Quarto em Apartamento Moderno perto da ESTGV',
    roomId: 'room-estgv-1',
    roomTitle: 'Quarto Individual com WC Privativo',
    landlordId: 'landlord-1',
    landlordName: 'Carlos Ferreira',
    reportedByStudentId: 'student-3',
    reportedByStudentName: 'Sofia Costa',
    description:
      'O senhorio pediu-me para pagar a primeira renda por transferência bancária antes de assinar qualquer contrato, dizendo que era para "garantir o quarto". Nunca me enviou recibo.',
    date: '2026-05-21',
    priority: 'critica',
    status: 'em_analise',
    internalNote: 'Padrão recorrente nesta conta. Verificar histórico de pagamentos externos.',
  },
  {
    id: 'rep-2',
    type: 'fotos_enganosas',
    propertyId: 'prop-1',
    propertyTitle: 'Casa de Estudantes Viseu Centro',
    landlordId: 'landlord-2',
    landlordName: 'Maria Oliveira',
    reportedByStudentId: 'student-1',
    reportedByStudentName: 'Ana Rodrigues',
    description:
      'As fotos do anúncio mostram um apartamento renovado mas quando fui visitar o quarto estava degradado, com humidade nas paredes e a mobília partida.',
    date: '2026-05-20',
    priority: 'alta',
    status: 'aberta',
  },
  {
    id: 'rep-3',
    type: 'localizacao_falsa',
    propertyId: 'prop-estgv',
    propertyTitle: 'Quarto em Apartamento Moderno perto da ESTGV',
    landlordId: 'landlord-1',
    landlordName: 'Carlos Ferreira',
    reportedByStudentId: 'student-2',
    reportedByStudentName: 'Miguel Santos',
    description:
      'O anúncio diz que fica a 500m da ESTGV mas na verdade fica a mais de 3km. A morada indicada está errada.',
    date: '2026-05-19',
    priority: 'media',
    status: 'aberta',
  },
  {
    id: 'rep-4',
    type: 'fraude_possivel',
    landlordId: 'landlord-3',
    landlordName: 'António Silva',
    reportedByStudentId: 'student-4',
    reportedByStudentName: 'João Ferreira',
    description:
      'Recebi uma proposta de arrendamento de um senhorio que diz não poder fazer visitas mas pediu pagamento adiantado de 3 meses. O perfil foi criado há 2 dias.',
    date: '2026-05-18',
    priority: 'critica',
    status: 'aberta',
  },
  {
    id: 'rep-5',
    type: 'identidade_nao_verificada',
    propertyId: 'prop-1',
    propertyTitle: 'Casa de Estudantes Viseu Centro',
    landlordId: 'landlord-2',
    landlordName: 'Maria Oliveira',
    reportedByStudentId: 'student-5',
    reportedByStudentName: 'Beatriz Lopes',
    description:
      'Tentei verificar a identidade do senhorio através dos documentos pedidos mas nunca os recebeu. A plataforma mostra o perfil como "Verificado" sem evidência.',
    date: '2026-05-17',
    priority: 'media',
    status: 'resolvida',
    resolvedAt: '2026-05-22',
    resolvedByAdminId: 'admin-1',
    internalNote: 'Verificação manual efetuada via email. Documento recebido e validado.',
  },
  {
    id: 'rep-6',
    type: 'comportamento_abusivo',
    landlordId: 'landlord-4',
    landlordName: 'Rui Pinto',
    reportedByStudentId: 'student-2',
    reportedByStudentName: 'Miguel Santos',
    description:
      'O senhorio enviou-me mensagens ameaçadoras após eu recusar a sua proposta de arrendamento, dizendo que iria "arranjar problemas".',
    date: '2026-05-15',
    priority: 'alta',
    status: 'em_analise',
  },
  {
    id: 'rep-7',
    type: 'pagamento_externo',
    propertyId: 'prop-estgv',
    propertyTitle: 'Quarto em Apartamento Moderno perto da ESTGV',
    landlordId: 'landlord-1',
    landlordName: 'Carlos Ferreira',
    reportedByStudentId: 'student-4',
    reportedByStudentName: 'João Ferreira',
    description: 'Recebi pedido de pagamento de caução fora da plataforma, por Mbway. O senhorio disse que era "mais rápido".',
    date: '2026-05-14',
    priority: 'alta',
    status: 'rejeitada',
    resolvedAt: '2026-05-16',
    resolvedByAdminId: 'admin-1',
    internalNote: 'Após análise, a transação foi acordada pelos dois lados e documentada. Sem evidência de má-fé.',
  },
];

function initStorage(): AdminReport[] {
  const version = localStorage.getItem(DATA_VERSION_KEY);
  if (version !== CURRENT_VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
    return INITIAL_REPORTS;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
    return INITIAL_REPORTS;
  }
  try {
    return JSON.parse(stored) as AdminReport[];
  } catch {
    return INITIAL_REPORTS;
  }
}

function saveAll(reports: AdminReport[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function getAllReports(): AdminReport[] {
  return initStorage();
}

export function getOpenReportsCount(): number {
  return initStorage().filter(r => r.status === 'aberta' || r.status === 'em_analise').length;
}

export function getCriticalReportsCount(): number {
  return initStorage().filter(r => r.priority === 'critica' && r.status !== 'resolvida' && r.status !== 'rejeitada').length;
}

export function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  adminId: string,
  note?: string,
): AdminReport | null {
  const all = initStorage();
  const idx = all.findIndex(r => r.id === reportId);
  if (idx < 0) return null;
  all[idx] = {
    ...all[idx],
    status,
    ...(note ? { internalNote: note } : {}),
    ...(status === 'resolvida' || status === 'rejeitada'
      ? { resolvedAt: new Date().toISOString().split('T')[0], resolvedByAdminId: adminId }
      : {}),
  };
  saveAll(all);
  return all[idx];
}

export function addInternalNote(reportId: string, note: string): AdminReport | null {
  const all = initStorage();
  const idx = all.findIndex(r => r.id === reportId);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], internalNote: note };
  saveAll(all);
  return all[idx];
}

export function applyAdminAction(
  reportId: string,
  action: 'suspend_property' | 'suspend_landlord' | 'block_landlord',
): AdminReport | null {
  const all = initStorage();
  const idx = all.findIndex(r => r.id === reportId);
  if (idx < 0) return null;
  if (action === 'suspend_property') all[idx] = { ...all[idx], propertySuspended: true, status: 'em_analise' };
  if (action === 'suspend_landlord') all[idx] = { ...all[idx], landlordSuspended: true, status: 'em_analise' };
  if (action === 'block_landlord') all[idx] = { ...all[idx], landlordBlocked: true, landlordSuspended: true, status: 'em_analise' };
  saveAll(all);
  return all[idx];
}

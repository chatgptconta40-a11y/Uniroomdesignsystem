import {
  AdminMetrics,
  GrowthData,
  Alert,
  ActivityLog,
  SuspiciousActivity,
  PlatformStats,
  AdminUser,
  AdminListing,
  AdminReport,
  BusinessMetrics,
  RetentionData,
  CityActivity,
  ModerationMetrics,
  SystemSettings,
  ModerationRule,
} from '../types/admin';

export const mockAdminMetrics: AdminMetrics = {
  totalUsers: 2847,
  totalStudents: 2456,
  totalLandlords: 391,
  activeListings: 1289,
  pendingReports: 8,
  monthlyGrowth: 18.5,
  newUsersToday: 24,
  newListingsToday: 12,
};

export const mockGrowthData: GrowthData[] = [
  { month: 'Out 2025', users: 1250, listings: 580, applications: 420 },
  { month: 'Nov 2025', users: 1580, listings: 720, applications: 580 },
  { month: 'Dez 2025', users: 1820, listings: 850, applications: 680 },
  { month: 'Jan 2026', users: 2150, listings: 980, applications: 820 },
  { month: 'Fev 2026', users: 2420, listings: 1120, applications: 950 },
  { month: 'Mar 2026', users: 2680, listings: 1250, applications: 1080 },
  { month: 'Abr 2026', users: 2847, listings: 1289, applications: 1156 },
];

export const mockAlerts: Alert[] = [
  {
    id: 'alert1',
    type: 'warning',
    title: 'Utilizador com múltiplas denúncias',
    description: 'O utilizador "João Silva" recebeu 3 denúncias nas últimas 24h',
    timestamp: new Date('2026-04-19T10:30:00'),
    link: '/admin/users/u123',
  },
  {
    id: 'alert2',
    type: 'danger',
    title: 'Anúncio suspeito detetado',
    description: 'Possível fraude no anúncio "Apartamento barato Lisboa" - preço 60% abaixo da média',
    timestamp: new Date('2026-04-19T09:15:00'),
    link: '/admin/listings/l456',
  },
  {
    id: 'alert3',
    type: 'info',
    title: 'Pico de atividade detetado',
    description: 'Aumento de 45% nas candidaturas nas últimas 4 horas',
    timestamp: new Date('2026-04-19T08:00:00'),
  },
  {
    id: 'alert4',
    type: 'warning',
    title: 'Taxa de rejeição elevada',
    description: 'Senhorio "Maria Costa" tem taxa de rejeição de 85% (15 candidaturas rejeitadas)',
    timestamp: new Date('2026-04-18T16:20:00'),
    link: '/admin/users/u789',
  },
];

export const mockActivityLog: ActivityLog[] = [
  {
    id: 'act1',
    type: 'user_registration',
    userId: 'u234',
    userName: 'Pedro Santos',
    description: 'Novo estudante registado',
    timestamp: new Date('2026-04-19T11:45:00'),
  },
  {
    id: 'act2',
    type: 'listing_created',
    userId: 'u567',
    userName: 'Ana Ferreira',
    description: 'Publicou novo alojamento em Coimbra',
    timestamp: new Date('2026-04-19T11:30:00'),
  },
  {
    id: 'act3',
    type: 'application_accepted',
    userId: 'u890',
    userName: 'Carlos Mendes',
    description: 'Aceitou candidatura de Maria Silva',
    timestamp: new Date('2026-04-19T11:15:00'),
  },
  {
    id: 'act4',
    type: 'report_submitted',
    userId: 'u123',
    userName: 'Sofia Costa',
    description: 'Submeteu denúncia sobre alojamento',
    timestamp: new Date('2026-04-19T10:50:00'),
  },
  {
    id: 'act5',
    type: 'user_registration',
    userId: 'u456',
    userName: 'Luís Oliveira',
    description: 'Novo senhorio registado',
    timestamp: new Date('2026-04-19T10:30:00'),
  },
];

export const mockSuspiciousActivity: SuspiciousActivity[] = [
  {
    id: 'sus1',
    type: 'user',
    targetId: 'u999',
    targetName: 'João Silva',
    reason: '3 denúncias recebidas em 24h',
    severity: 'high',
    timestamp: new Date('2026-04-19T10:30:00'),
  },
  {
    id: 'sus2',
    type: 'listing',
    targetId: 'l888',
    targetName: 'Apartamento T2 Lisboa',
    reason: 'Preço 60% abaixo da média da zona',
    severity: 'high',
    timestamp: new Date('2026-04-19T09:15:00'),
  },
  {
    id: 'sus3',
    type: 'user',
    targetId: 'u777',
    targetName: 'Maria Costa',
    reason: 'Taxa de rejeição 85% (15/17 candidaturas)',
    severity: 'medium',
    timestamp: new Date('2026-04-18T16:20:00'),
  },
  {
    id: 'sus4',
    type: 'listing',
    targetId: 'l666',
    targetName: 'Quarto Partilhado Porto',
    reason: 'Múltiplas edições em curto período',
    severity: 'low',
    timestamp: new Date('2026-04-18T14:00:00'),
  },
];

export const mockPlatformStats: PlatformStats = {
  conversionRate: 12.5,
  averageResponseTime: 3.2,
  userSatisfaction: 4.6,
  activeListingsRate: 78.5,
};

export function getAdminMetrics() {
  return mockAdminMetrics;
}

export function getGrowthData() {
  return mockGrowthData;
}

export function getAlerts() {
  return mockAlerts;
}

export function getActivityLog() {
  return mockActivityLog;
}

export function getSuspiciousActivity() {
  return mockSuspiciousActivity;
}

export function getPlatformStats() {
  return mockPlatformStats;
}

export const mockAdminUsers: AdminUser[] = [
  {
    id: 'admin-001',
    name: 'Gestor UniRoom',
    email: 'admin@uniroom.pt',
    type: 'admin',
    status: 'active',
    verified: true,
    verificationLevel: 'gold',
    trustScore: 100,
    createdAt: new Date('2025-06-01'),
    lastActive: new Date('2026-05-04T12:30:00'),
    reportsReceived: 0,
    reportsSubmitted: 0,
  },
  {
    id: 'u001',
    name: 'Ana Silva',
    email: 'ana.silva@example.com',
    type: 'student',
    status: 'active',
    verified: true,
    verificationLevel: 'gold',
    trustScore: 92,
    createdAt: new Date('2025-09-15'),
    lastActive: new Date('2026-05-04T08:30:00'),
    totalApplications: 12,
    reportsReceived: 0,
    reportsSubmitted: 1,
  },
  {
    id: 'u002',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@example.com',
    type: 'landlord',
    status: 'active',
    verified: true,
    verificationLevel: 'silver',
    trustScore: 88,
    createdAt: new Date('2025-08-20'),
    lastActive: new Date('2026-05-03T19:45:00'),
    totalListings: 5,
    reportsReceived: 0,
    reportsSubmitted: 0,
  },
  {
    id: 'u003',
    name: 'João Silva',
    email: 'joao.silva@example.com',
    type: 'student',
    status: 'suspended',
    verified: true,
    verificationLevel: 'bronze',
    trustScore: 45,
    createdAt: new Date('2026-01-10'),
    lastActive: new Date('2026-05-02T14:20:00'),
    totalApplications: 8,
    reportsReceived: 3,
    reportsSubmitted: 0,
  },
  {
    id: 'u004',
    name: 'Maria Costa',
    email: 'maria.costa@example.com',
    type: 'landlord',
    status: 'active',
    verified: true,
    verificationLevel: 'bronze',
    trustScore: 62,
    createdAt: new Date('2025-11-05'),
    lastActive: new Date('2026-05-04T10:15:00'),
    totalListings: 3,
    reportsReceived: 2,
    reportsSubmitted: 1,
  },
  {
    id: 'u005',
    name: 'Pedro Santos',
    email: 'pedro.santos@example.com',
    type: 'student',
    status: 'active',
    verified: false,
    verificationLevel: 'none',
    trustScore: 0,
    createdAt: new Date('2026-05-03'),
    lastActive: new Date('2026-05-04T11:00:00'),
    totalApplications: 1,
    reportsReceived: 0,
    reportsSubmitted: 0,
  },
  {
    id: 'u006',
    name: 'Rita Oliveira',
    email: 'rita.oliveira@example.com',
    type: 'student',
    status: 'blocked',
    verified: false,
    verificationLevel: 'none',
    trustScore: 0,
    createdAt: new Date('2026-02-14'),
    lastActive: new Date('2026-04-28T16:30:00'),
    totalApplications: 15,
    reportsReceived: 5,
    reportsSubmitted: 2,
  },
  {
    id: 'u007',
    name: 'Tiago Ferreira',
    email: 'tiago.ferreira@example.com',
    type: 'landlord',
    status: 'active',
    verified: true,
    verificationLevel: 'gold',
    trustScore: 95,
    createdAt: new Date('2025-07-10'),
    lastActive: new Date('2026-05-04T09:20:00'),
    totalListings: 12,
    reportsReceived: 0,
    reportsSubmitted: 3,
  },
  {
    id: 'u008',
    name: 'Sofia Rodrigues',
    email: 'sofia.rodrigues@example.com',
    type: 'student',
    status: 'active',
    verified: true,
    verificationLevel: 'silver',
    trustScore: 78,
    createdAt: new Date('2025-10-22'),
    lastActive: new Date('2026-05-04T07:45:00'),
    totalApplications: 6,
    reportsReceived: 0,
    reportsSubmitted: 0,
  },
];

export const mockAdminListings: AdminListing[] = [
  {
    id: 'l001',
    title: 'Quarto Luminoso no Centro de Lisboa',
    landlordId: 'u002',
    landlordName: 'Carlos Mendes',
    city: 'Lisboa',
    zone: 'Baixa',
    price: 450,
    type: 'Quarto Individual',
    status: 'active',
    views: 324,
    applications: 12,
    createdAt: new Date('2026-03-15'),
    updatedAt: new Date('2026-04-20'),
    flags: 0,
    suspiciousScore: 0,
  },
  {
    id: 'l002',
    title: 'Apartamento T2 - Preço Incrível!!!',
    landlordId: 'u004',
    landlordName: 'Maria Costa',
    city: 'Lisboa',
    zone: 'Alvalade',
    price: 300,
    type: 'Apartamento T2',
    status: 'pending',
    views: 156,
    applications: 28,
    createdAt: new Date('2026-05-03'),
    updatedAt: new Date('2026-05-03'),
    flags: 4,
    suspiciousScore: 85,
  },
  {
    id: 'l003',
    title: 'Residência de Estudantes - Porto',
    landlordId: 'u007',
    landlordName: 'Tiago Ferreira',
    city: 'Porto',
    zone: 'Paranhos',
    price: 380,
    type: 'Quarto Individual',
    status: 'active',
    views: 542,
    applications: 18,
    createdAt: new Date('2025-09-10'),
    updatedAt: new Date('2026-04-15'),
    flags: 0,
    suspiciousScore: 0,
  },
  {
    id: 'l004',
    title: 'Quarto Duplo Partilhado',
    landlordId: 'u002',
    landlordName: 'Carlos Mendes',
    city: 'Coimbra',
    zone: 'Centro',
    price: 220,
    type: 'Quarto Partilhado',
    status: 'active',
    views: 198,
    applications: 8,
    createdAt: new Date('2026-02-28'),
    updatedAt: new Date('2026-03-10'),
    flags: 0,
    suspiciousScore: 0,
  },
  {
    id: 'l005',
    title: 'Studio Moderno - Baixo Preço',
    landlordId: 'u004',
    landlordName: 'Maria Costa',
    city: 'Lisboa',
    zone: 'Saldanha',
    price: 250,
    type: 'Estúdio',
    status: 'rejected',
    views: 89,
    applications: 15,
    createdAt: new Date('2026-04-28'),
    updatedAt: new Date('2026-05-01'),
    flags: 3,
    suspiciousScore: 78,
  },
  {
    id: 'l006',
    title: 'Casa Partilhada - 4 Quartos',
    landlordId: 'u007',
    landlordName: 'Tiago Ferreira',
    city: 'Braga',
    zone: 'São Vítor',
    price: 320,
    type: 'Quarto Individual',
    status: 'active',
    views: 421,
    applications: 14,
    createdAt: new Date('2025-11-20'),
    updatedAt: new Date('2026-04-05'),
    flags: 0,
    suspiciousScore: 0,
  },
  {
    id: 'l007',
    title: 'Apartamento T1 Junto ao ISCTE',
    landlordId: 'u002',
    landlordName: 'Carlos Mendes',
    city: 'Lisboa',
    zone: 'Areeiro',
    price: 550,
    type: 'Apartamento T1',
    status: 'inactive',
    views: 267,
    applications: 9,
    createdAt: new Date('2025-12-05'),
    updatedAt: new Date('2026-03-20'),
    flags: 0,
    suspiciousScore: 0,
  },
  {
    id: 'l008',
    title: 'Quarto Económico Urgente',
    landlordId: 'u004',
    landlordName: 'Maria Costa',
    city: 'Porto',
    zone: 'Boavista',
    price: 180,
    type: 'Quarto Partilhado',
    status: 'pending',
    views: 234,
    applications: 22,
    createdAt: new Date('2026-05-02'),
    updatedAt: new Date('2026-05-02'),
    flags: 5,
    suspiciousScore: 92,
  },
];

export const mockAdminReports: AdminReport[] = [
  {
    id: 'r001',
    type: 'listing',
    targetId: 'l002',
    targetName: 'Apartamento T2 - Preço Incrível!!!',
    reporterId: 'u001',
    reporterName: 'Ana Silva',
    reason: 'Preço Suspeito',
    description:
      'O preço anunciado está muito abaixo do valor de mercado para a zona. Suspeito que seja fraude ou que as condições reais sejam muito diferentes do anunciado.',
    status: 'pending',
    severity: 'high',
    createdAt: new Date('2026-05-03T14:30:00'),
  },
  {
    id: 'r002',
    type: 'user',
    targetId: 'u003',
    targetName: 'João Silva',
    reporterId: 'u002',
    reporterName: 'Carlos Mendes',
    reason: 'Comportamento Inadequado',
    description:
      'O utilizador enviou mensagens ofensivas e inadequadas após a rejeição da sua candidatura.',
    status: 'under_review',
    severity: 'high',
    createdAt: new Date('2026-05-02T16:45:00'),
  },
  {
    id: 'r003',
    type: 'listing',
    targetId: 'l005',
    targetName: 'Studio Moderno - Baixo Preço',
    reporterId: 'u008',
    reporterName: 'Sofia Rodrigues',
    reason: 'Informação Falsa',
    description:
      'As fotos do anúncio não correspondem ao alojamento real. Visitei o local e as condições são muito diferentes.',
    status: 'resolved',
    severity: 'medium',
    createdAt: new Date('2026-04-28T11:20:00'),
    resolvedAt: new Date('2026-05-01T09:30:00'),
    resolvedBy: 'Admin UniRoom',
    resolution:
      'Anúncio rejeitado após verificação. Senhorio advertido sobre uso de fotografias enganosas.',
  },
  {
    id: 'r004',
    type: 'user',
    targetId: 'u006',
    targetName: 'Rita Oliveira',
    reporterId: 'u007',
    reporterName: 'Tiago Ferreira',
    reason: 'Spam',
    description:
      'Utilizadora enviou a mesma mensagem genérica para mais de 20 anúncios diferentes em menos de 10 minutos.',
    status: 'resolved',
    severity: 'medium',
    createdAt: new Date('2026-04-26T19:10:00'),
    resolvedAt: new Date('2026-04-28T10:15:00'),
    resolvedBy: 'Admin UniRoom',
    resolution: 'Conta bloqueada após verificação de comportamento spam repetido.',
  },
  {
    id: 'r005',
    type: 'listing',
    targetId: 'l008',
    targetName: 'Quarto Económico Urgente',
    reporterId: 'u005',
    reporterName: 'Pedro Santos',
    reason: 'Preço Suspeito',
    description:
      'Preço extremamente baixo comparado com outros anúncios na mesma zona. Pode ser fraude.',
    status: 'pending',
    severity: 'high',
    createdAt: new Date('2026-05-02T20:30:00'),
  },
  {
    id: 'r006',
    type: 'user',
    targetId: 'u003',
    targetName: 'João Silva',
    reporterId: 'u004',
    reporterName: 'Maria Costa',
    reason: 'Linguagem Ofensiva',
    description: 'Usou linguagem inapropriada e ameaças nas mensagens.',
    status: 'under_review',
    severity: 'high',
    createdAt: new Date('2026-05-01T22:15:00'),
  },
  {
    id: 'r007',
    type: 'listing',
    targetId: 'l002',
    targetName: 'Apartamento T2 - Preço Incrível!!!',
    reporterId: 'u008',
    reporterName: 'Sofia Rodrigues',
    reason: 'Informação Falsa',
    description:
      'A descrição menciona metro a 2 minutos mas na realidade fica a 15 minutos a pé.',
    status: 'pending',
    severity: 'low',
    createdAt: new Date('2026-05-04T08:45:00'),
  },
  {
    id: 'r008',
    type: 'user',
    targetId: 'u003',
    targetName: 'João Silva',
    reporterId: 'u007',
    reporterName: 'Tiago Ferreira',
    reason: 'Comportamento Inadequado',
    description: 'Tentou negociar pagamento fora da plataforma de forma insistente.',
    status: 'pending',
    severity: 'medium',
    createdAt: new Date('2026-05-03T17:20:00'),
  },
  {
    id: 'r009',
    type: 'listing',
    targetId: 'l008',
    targetName: 'Quarto Económico Urgente',
    reporterId: 'u001',
    reporterName: 'Ana Silva',
    reason: 'Duplicado',
    description: 'Este anúncio parece ser duplicado de outro já existente na plataforma.',
    status: 'dismissed',
    severity: 'low',
    createdAt: new Date('2026-05-01T12:00:00'),
    resolvedAt: new Date('2026-05-02T14:30:00'),
    resolvedBy: 'Admin UniRoom',
    resolution:
      'Após verificação, confirmado que são anúncios diferentes do mesmo senhorio.',
  },
];

export function getAdminUsers() {
  return mockAdminUsers;
}

export function getAdminListings() {
  return mockAdminListings;
}

export function getAdminReports() {
  return mockAdminReports;
}

export const mockBusinessMetrics: BusinessMetrics = {
  totalRevenue: 145800,
  monthlyRevenue: 28500,
  averageBookingValue: 385,
  successfulMatches: 1156,
  conversionRate: 12.5,
  churnRate: 8.2,
};

export const mockRetentionData: RetentionData[] = [
  { period: 'Mês 1', studentsRetained: 95, studentsTotal: 100, landlordsRetained: 92, landlordsTotal: 100 },
  { period: 'Mês 2', studentsRetained: 88, studentsTotal: 100, landlordsRetained: 89, landlordsTotal: 100 },
  { period: 'Mês 3', studentsRetained: 82, studentsTotal: 100, landlordsRetained: 86, landlordsTotal: 100 },
  { period: 'Mês 4', studentsRetained: 76, studentsTotal: 100, landlordsRetained: 83, landlordsTotal: 100 },
  { period: 'Mês 5', studentsRetained: 71, studentsTotal: 100, landlordsRetained: 80, landlordsTotal: 100 },
  { period: 'Mês 6', studentsRetained: 68, studentsTotal: 100, landlordsRetained: 78, landlordsTotal: 100 },
];

export const mockCityActivity: CityActivity[] = [
  { city: 'Lisboa', activeListings: 542, activeUsers: 1234, applications: 487, growth: 22.5 },
  { city: 'Porto', activeListings: 389, activeUsers: 856, applications: 342, growth: 18.3 },
  { city: 'Coimbra', activeListings: 198, activeUsers: 425, applications: 178, growth: 15.7 },
  { city: 'Braga', activeListings: 87, activeUsers: 198, applications: 76, growth: 12.4 },
  { city: 'Aveiro', activeListings: 42, activeUsers: 89, applications: 38, growth: 9.8 },
  { city: 'Faro', activeListings: 31, activeUsers: 45, applications: 35, growth: 25.1 },
];

export const mockModerationMetrics: ModerationMetrics = {
  totalReports: 127,
  resolvedReports: 119,
  averageResolutionTime: 4.2,
  accuracyRate: 94.5,
  falsePositives: 7,
  automatedActions: 45,
};

export const mockSystemSettings: SystemSettings = {
  maxListingsPerLandlord: 10,
  maxApplicationsPerStudent: 5,
  minTrustScoreForListing: 50,
  autoSuspendThreshold: 3,
  reportReviewTimeLimit: 48,
};

export const mockModerationRules: ModerationRule[] = [
  {
    id: 'rule1',
    name: 'Múltiplas Denúncias',
    description:
      'Suspende automaticamente utilizadores que recebem múltiplas denúncias num curto período',
    enabled: true,
    severity: 'high',
    action: 'suspend',
    threshold: 3,
  },
  {
    id: 'rule2',
    name: 'Preço Suspeito',
    description: 'Sinaliza anúncios com preços significativamente abaixo da média',
    enabled: true,
    severity: 'medium',
    action: 'flag',
    threshold: 60,
  },
  {
    id: 'rule3',
    name: 'Spam de Mensagens',
    description: 'Bloqueia utilizadores que enviam mensagens idênticas em massa',
    enabled: true,
    severity: 'high',
    action: 'block',
    threshold: 10,
  },
  {
    id: 'rule4',
    name: 'Trust Score Baixo',
    description: 'Restringe ações para utilizadores com trust score muito baixo',
    enabled: true,
    severity: 'medium',
    action: 'flag',
    threshold: 30,
  },
  {
    id: 'rule5',
    name: 'Edições Frequentes',
    description: 'Sinaliza anúncios editados múltiplas vezes em curto período',
    enabled: false,
    severity: 'low',
    action: 'flag',
    threshold: 5,
  },
];

export function getBusinessMetrics() {
  return mockBusinessMetrics;
}

export function getRetentionData() {
  return mockRetentionData;
}

export function getCityActivity() {
  return mockCityActivity;
}

export function getModerationMetrics() {
  return mockModerationMetrics;
}

export function getSystemSettings() {
  return mockSystemSettings;
}

export function getModerationRules() {
  return mockModerationRules;
}
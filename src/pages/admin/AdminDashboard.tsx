import { useNavigate } from 'react-router';
import {
  Users,
  Home,
  Flag,
  TrendingUp,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  DoorOpen,
  DoorClosed,
  FileText,
  AlertTriangle,
  Activity,
  BedDouble,
  Calendar,
  ShieldAlert,
  UserX,
  Eye,
  PauseCircle,
  FilePen,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { useProperties } from '../../context/PropertiesContext';
import { mockUsers } from '../../data/mockUsers';
import { getAllApplications } from '../../data/mockLandlordCandidates';
import { getAllReports, getCriticalReportsCount, getOpenReportsCount } from '../../data/mockAdminReports';
import { getAuditLog } from '../../data/mockAdminAudit';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { properties, rooms } = useProperties();

  // ── Real metrics from data sources ────────────────────────────────────────
  const allProperties = properties.filter(p => p.status !== 'archived');
  const activeProperties = allProperties.filter(p => p.status === 'active');
  const draftProperties = allProperties.filter(p => p.status === 'draft');
  const pausedProperties = allProperties.filter(p => p.status === 'paused');

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const reservedRooms = rooms.filter(r => r.status === 'reserved').length;
  const draftRooms = rooms.filter(r => r.status === 'draft').length;
  const occupancyRate = totalRooms > 0
    ? Math.round(((occupiedRooms + reservedRooms) / totalRooms) * 100)
    : 0;

  const allStudents = mockUsers.filter(u => u.type === 'student');
  const allLandlords = mockUsers.filter(u => u.type === 'landlord');
  const verifiedLandlords = allLandlords.filter(u => u.verified);

  const allApplications = getAllApplications();
  const pendingApplications = allApplications.filter(a => a.status === 'pending' || a.status === 'under_review').length;
  const acceptedApplications = allApplications.filter(a => a.status === 'accepted').length;

  const openReports = getOpenReportsCount();
  const criticalReports = getCriticalReportsCount();
  const allReports = getAllReports();
  const recentAudit = getAuditLog().slice(0, 5);

  // ── Mock growth data (would come from backend) ─────────────────────────────
  const monthlyGrowth = [
    { month: 'Jan', users: 245, properties: 32, applications: 156 },
    { month: 'Fev', users: 298, properties: 41, applications: 189 },
    { month: 'Mar', users: 356, properties: 48, applications: 234 },
    { month: 'Abr', users: 412, properties: 56, applications: 298 },
    { month: 'Mai', users: 478, properties: allProperties.length + 60, applications: allApplications.length + 330 },
  ];
  const maxUsers = Math.max(...monthlyGrowth.map(m => m.users));

  const criticalAlerts = allReports.filter(r => r.priority === 'critica' && r.status !== 'resolvida' && r.status !== 'rejeitada');

  const auditActionLabels: Record<string, string> = {
    property_suspended: 'Anúncio suspenso',
    property_reactivated: 'Anúncio reativado',
    ad_reactivated: 'Anúncio reativado',
    report_resolved: 'Denúncia resolvida',
    report_rejected: 'Denúncia rejeitada',
    landlord_suspended: 'Senhorio suspenso',
    landlord_blocked: 'Senhorio bloqueado',
    landlord_unblocked: 'Senhorio desbloqueado',
    verification_requested: 'Verificação pedida',
    verification_approved: 'Verificação aprovada',
    note_added: 'Nota adicionada',
  };

  const auditActionColors: Record<string, string> = {
    property_suspended: 'bg-red-100 text-red-600',
    property_reactivated: 'bg-green-100 text-green-600',
    ad_reactivated: 'bg-green-100 text-green-600',
    report_resolved: 'bg-green-100 text-green-600',
    report_rejected: 'bg-gray-100 text-gray-600',
    landlord_suspended: 'bg-red-100 text-red-600',
    landlord_blocked: 'bg-red-100 text-red-600',
    landlord_unblocked: 'bg-blue-100 text-blue-600',
    verification_requested: 'bg-amber-100 text-amber-600',
    verification_approved: 'bg-green-100 text-green-600',
    note_added: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard de Operações</h1>
          <p className="text-sm text-gray-500">Métricas em tempo real da plataforma UniRoom</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
          <Activity className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500">23 Mai 2026</span>
        </div>
      </div>

      {/* Critical alerts banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {criticalAlerts.length} denúncia{criticalAlerts.length > 1 ? 's' : ''} crítica{criticalAlerts.length > 1 ? 's' : ''} pendente{criticalAlerts.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              {criticalAlerts.map(r => r.landlordName).join(', ')} — requerem ação imediata
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/reports')}
            className="text-xs font-semibold text-red-700 hover:text-red-900 whitespace-nowrap"
          >
            Ver agora →
          </button>
        </div>
      )}

      {/* Primary stats — 4 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Alojamentos Ativos',
            value: activeProperties.length,
            sub: `${draftProperties.length} rascunhos · ${pausedProperties.length} pausados`,
            icon: Home,
            color: 'bg-blue-100 text-blue-600',
          },
          {
            label: 'Taxa de Ocupação',
            value: `${occupancyRate}%`,
            sub: `${occupiedRooms + reservedRooms} de ${totalRooms} quartos`,
            icon: TrendingUp,
            color: 'bg-green-100 text-green-600',
          },
          {
            label: 'Candidaturas Pendentes',
            value: pendingApplications,
            sub: `${acceptedApplications} aceites no total`,
            icon: FileText,
            color: 'bg-purple-100 text-purple-600',
          },
          {
            label: 'Denúncias Abertas',
            value: openReports,
            sub: criticalReports > 0 ? `${criticalReports} críticas` : 'Nenhuma crítica',
            icon: Flag,
            color: criticalReports > 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600',
          },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-xs font-medium text-gray-700 mb-0.5">{stat.label}</p>
              <p className="text-xs text-gray-500">{stat.sub}</p>
            </Card>
          );
        })}
      </div>

      {/* Room breakdown + User stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rooms */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BedDouble className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Estado dos Quartos</h2>
            <span className="ml-auto text-xs text-gray-500">{totalRooms} total</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Disponíveis', value: availableRooms, color: 'bg-green-500', textColor: 'text-green-700', pct: totalRooms > 0 ? (availableRooms / totalRooms) * 100 : 0 },
              { label: 'Ocupados', value: occupiedRooms, color: 'bg-blue-500', textColor: 'text-blue-700', pct: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0 },
              { label: 'Reservados', value: reservedRooms, color: 'bg-purple-500', textColor: 'text-purple-700', pct: totalRooms > 0 ? (reservedRooms / totalRooms) * 100 : 0 },
              { label: 'Rascunhos', value: draftRooms, color: 'bg-gray-400', textColor: 'text-gray-600', pct: totalRooms > 0 ? (draftRooms / totalRooms) * 100 : 0 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className={`font-semibold ${item.textColor}`}>{item.value}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Users */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Utilizadores da Plataforma</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Estudantes', value: allStudents.length, icon: Users, color: 'bg-blue-100 text-blue-600' },
              { label: 'Senhorios', value: allLandlords.length, icon: UserCheck, color: 'bg-purple-100 text-purple-600' },
              { label: 'Senhorios verificados', value: verifiedLandlords.length, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
              { label: 'Por verificar', value: allLandlords.length - verifiedLandlords.length, icon: AlertCircle, color: 'bg-amber-100 text-amber-600' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-semibold text-gray-700">Alojamentos por estado</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Ativos', value: activeProperties.length, cls: 'bg-green-50 text-green-700 border-green-200' },
                { label: 'Rascunhos', value: draftProperties.length, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                { label: 'Pausados', value: pausedProperties.length, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
              ].map(item => (
                <div key={item.label} className={`rounded-lg border p-2 text-center ${item.cls}`}>
                  <p className="text-lg font-bold">{item.value}</p>
                  <p className="text-[10px] font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Reports summary */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flag className="w-4 h-4 text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">Denúncias por Estado</h2>
          <button
            onClick={() => navigate('/admin/reports')}
            className="ml-auto text-xs text-blue-600 hover:underline font-medium"
          >
            Ver todas →
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Abertas', value: allReports.filter(r => r.status === 'aberta').length, cls: 'bg-red-50 border-red-200 text-red-700' },
            { label: 'Em Análise', value: allReports.filter(r => r.status === 'em_analise').length, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Resolvidas', value: allReports.filter(r => r.status === 'resolvida').length, cls: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Rejeitadas', value: allReports.filter(r => r.status === 'rejeitada').length, cls: 'bg-gray-50 border-gray-200 text-gray-600' },
          ].map(item => (
            <div key={item.label} className={`border rounded-xl p-3 text-center ${item.cls}`}>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs font-medium mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        {criticalAlerts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-2">Denúncias críticas em aberto</p>
            <div className="space-y-2">
              {criticalAlerts.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <span className="text-gray-700 flex-1 truncate">{r.reportedByStudentName} → {r.landlordName}</span>
                  <span className="text-gray-500 whitespace-nowrap">{r.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly growth */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Crescimento Mensal</h2>
          </div>
          <div className="space-y-3">
            {monthlyGrowth.map((month) => (
              <div key={month.month}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700 w-8">{month.month}</span>
                  <div className="flex items-center gap-4 text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {month.users}
                    </span>
                    <span className="flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      {month.properties}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {month.applications}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    style={{ width: `${(month.users / maxUsers) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Utilizadores</span>
            <span className="flex items-center gap-1"><Home className="w-3 h-3" /> Alojamentos</span>
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Candidaturas</span>
          </div>
        </Card>

        {/* Recent audit */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Ações Recentes</h2>
            <button
              onClick={() => navigate('/admin/audit')}
              className="ml-auto text-xs text-blue-600 hover:underline font-medium"
            >
              Ver auditoria →
            </button>
          </div>
          {recentAudit.length === 0 ? (
            <div className="py-6 text-center">
              <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhuma ação registada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAudit.map(entry => (
                <div key={entry.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${auditActionColors[entry.action] || 'bg-gray-100 text-gray-500'}`}>
                    <FilePen className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800">{auditActionLabels[entry.action]}</p>
                    <p className="text-xs text-gray-500 truncate">{entry.entityName}</p>
                    {entry.note && (
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">"{entry.note}"</p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

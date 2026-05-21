import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  BedDouble,
  Clock,
  FileText,
  Home,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  getActivityLog,
  getAdminMetrics,
  getAlerts,
  getGrowthData,
  getPlatformStats,
  getSuspiciousActivity,
} from '../data/mockAdmin';
import { useProperties } from '../context/PropertiesContext';

export function AdminDashboard() {
  const metrics = getAdminMetrics();
  const growthData = getGrowthData();
  const alerts = getAlerts();
  const activityLog = getActivityLog();
  const suspiciousActivity = getSuspiciousActivity();
  const platformStats = getPlatformStats();
  const { properties, rooms } = useProperties();

  const activeProperties = properties.filter(property => property.status === 'active');
  const activeRooms = rooms.filter(room =>
    activeProperties.some(property => property.id === room.propertyId)
  );
  const occupiedRooms = rooms.filter(
    room => room.status === 'occupied' || room.status === 'reserved'
  );
  const availableRooms = rooms.filter(room => room.status === 'available');
  const pendingReports = metrics.pendingReports;
  const totalApplications = growthData[growthData.length - 1]?.applications || 0;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms.length / rooms.length) * 100) : 0;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Agora mesmo';
    if (hours < 24) return `Há ${hours}h`;
    if (days === 1) return 'Ontem';
    return `Há ${days} dias`;
  };

  const operationalCards = [
    {
      label: 'Estudantes',
      value: metrics.totalStudents.toLocaleString('pt-PT'),
      detail: `${metrics.newUsersToday} novos utilizadores hoje`,
      icon: Users,
      tone: 'bg-primary/10 text-primary',
    },
    {
      label: 'Senhorios',
      value: metrics.totalLandlords.toLocaleString('pt-PT'),
      detail: 'Contas com área de gestão',
      icon: User,
      tone: 'bg-secondary/10 text-secondary',
    },
    {
      label: 'Casas ativas',
      value: activeProperties.length,
      detail: `${activeRooms.length} quartos publicados`,
      icon: Home,
      tone: 'bg-accent/10 text-accent',
    },
    {
      label: 'Candidaturas',
      value: totalApplications.toLocaleString('pt-PT'),
      detail: 'Total acumulado nos mocks',
      icon: FileText,
      tone: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Quartos arrendados',
      value: occupiedRooms.length,
      detail: `${availableRooms.length} quartos disponíveis`,
      icon: BedDouble,
      tone: 'bg-green-100 text-green-700',
    },
    {
      label: 'Denúncias pendentes',
      value: pendingReports,
      detail: pendingReports > 0 ? 'Requer moderação' : 'Sem pendências',
      icon: AlertTriangle,
      tone: 'bg-red-100 text-red-700',
    },
    {
      label: 'Taxa de ocupação',
      value: `${occupancyRate}%`,
      detail: `${platformStats.activeListingsRate}% anúncios ativos`,
      icon: BarChart3,
      tone: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Crescimento mensal',
      value: `+${metrics.monthlyGrowth}%`,
      detail: 'Comparado com o mês anterior',
      icon: TrendingUp,
      tone: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <Badge className="bg-primary/10 text-primary mb-3">Backoffice UniRoom</Badge>
            <h1 className="text-3xl font-bold text-foreground">Estado da plataforma</h1>
            <p className="text-muted-foreground mt-2">
              Métricas, confiança, moderação e atividade operacional num só painel.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Dados mock locais. Sem backend real.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {operationalCards.map(card => {
          const Icon = card.icon;

          return (
            <Card key={card.label} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                  <p className="text-3xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">{card.detail}</p>
                </div>

                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Crescimento da plataforma</h2>
              <p className="text-sm text-muted-foreground">
                Utilizadores, anúncios e candidaturas por mês
              </p>
            </div>
            <Badge variant="outline">Últimos 7 meses</Badge>
          </div>

          <div className="space-y-5">
            {growthData.map(data => {
              const max = Math.max(...growthData.map(item => item.users));
              const userWidth = (data.users / max) * 100;
              const listingWidth = (data.listings / max) * 100;
              const applicationWidth = (data.applications / max) * 100;

              return (
                <div key={data.month} className="grid grid-cols-[80px_1fr] gap-4 items-center">
                  <span className="text-xs font-medium text-muted-foreground">{data.month}</span>

                  <div className="space-y-1.5">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${userWidth}%` }} />
                    </div>

                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-secondary" style={{ width: `${listingWidth}%` }} />
                    </div>

                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${applicationWidth}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 pt-5 mt-5 border-t border-border text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              Utilizadores
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              Casas/quartos
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              Candidaturas
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Prioridades de moderação</h2>
              <p className="text-sm text-muted-foreground">Itens que merecem atenção do gestor</p>
            </div>
          </div>

          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{alert.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                  </div>

                  <Badge
                    className={
                      alert.type === 'danger'
                        ? 'bg-red-100 text-red-800'
                        : alert.type === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {alert.type === 'danger' ? 'Crítico' : alert.type === 'warning' ? 'Atenção' : 'Info'}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mt-3">{formatTime(alert.timestamp)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Atividade recente</h2>
          </div>

          <div className="space-y-3">
            {activityLog.map(activity => (
              <div key={activity.id} className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
                <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.userName} · {formatTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-bold text-foreground">Atividade suspeita</h2>
          </div>

          <div className="space-y-3">
            {suspiciousActivity.map(item => (
              <div key={item.id} className="rounded-lg border border-red-200 bg-red-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-red-950">{item.targetName}</p>
                    <p className="text-xs text-red-800 mt-1">{item.reason}</p>
                  </div>

                  <Badge
                    className={
                      item.severity === 'high'
                        ? 'bg-red-600 text-white'
                        : item.severity === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {item.severity === 'high' ? 'Alta' : item.severity === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
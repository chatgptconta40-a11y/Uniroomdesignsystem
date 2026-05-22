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
  Calendar
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';

export function AdminDashboard() {
  const primaryStats = [
    { label: 'Total Estudantes', value: '1.847', change: '+15%', icon: Users, color: 'blue', subtitle: 'vs. mês anterior' },
    { label: 'Total Senhorios', value: '1.000', change: '+8%', icon: UserCheck, color: 'purple', subtitle: 'vs. mês anterior' },
    { label: 'Casas Ativas', value: '356', change: '+8%', icon: Home, color: 'green', subtitle: '12 pendentes aprovação' },
    { label: 'Taxa de Ocupação', value: '87%', change: '+5%', icon: TrendingUp, color: 'orange', subtitle: 'média da plataforma' },
  ];

  const secondaryStats = [
    { label: 'Quartos Disponíveis', value: '89', icon: DoorOpen, color: 'blue' },
    { label: 'Quartos Arrendados', value: '687', icon: DoorClosed, color: 'green' },
    { label: 'Candidaturas (30d)', value: '423', icon: FileText, color: 'purple' },
    { label: 'Denúncias Pendentes', value: '12', icon: Flag, color: 'red' },
  ];

  const alerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Denúncias acima da média',
      description: '12 denúncias pendentes requerem atenção',
      action: 'Ver denúncias',
      date: '2026-05-22'
    },
    {
      id: 2,
      type: 'info',
      title: '12 casas aguardam aprovação',
      description: 'Novas propriedades submetidas nas últimas 48h',
      action: 'Rever casas',
      date: '2026-05-22'
    },
    {
      id: 3,
      type: 'success',
      title: 'Taxa de ocupação em alta',
      description: 'Crescimento de 5% face ao mês anterior',
      action: 'Ver analytics',
      date: '2026-05-21'
    },
  ];

  const recentActivity = [
    { id: 1, type: 'user', action: 'Ana Costa registou-se como estudante', time: 'Há 5 minutos', icon: Users, color: 'blue' },
    { id: 2, type: 'property', action: 'Nova casa submetida em Lisboa', time: 'Há 12 minutos', icon: Home, color: 'green' },
    { id: 3, type: 'report', action: 'Denúncia resolvida: Anúncio suspeito', time: 'Há 25 minutos', icon: CheckCircle, color: 'green' },
    { id: 4, type: 'application', action: '3 novas candidaturas recebidas', time: 'Há 1 hora', icon: FileText, color: 'purple' },
    { id: 5, type: 'user', action: 'Pedro Santos verificado como senhorio', time: 'Há 2 horas', icon: UserCheck, color: 'blue' },
  ];

  const monthlyGrowth = [
    { month: 'Janeiro', users: 245, properties: 32, applications: 156 },
    { month: 'Fevereiro', users: 298, properties: 41, applications: 189 },
    { month: 'Março', users: 356, properties: 48, applications: 234 },
    { month: 'Abril', users: 412, properties: 56, applications: 298 },
    { month: 'Maio', users: 478, properties: 67, applications: 345 },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      yellow: 'bg-yellow-100 text-yellow-600',
    };
    return colors[color] || colors.blue;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Visão geral da plataforma UniRoom</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          <Activity className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">Última atualização: Há 2 minutos</span>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {primaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${getColorClasses(stat.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <Badge variant={stat.change.startsWith('+') ? 'success' : 'default'}>
                  {stat.change}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {secondaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${getColorClasses(stat.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Alerts */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Alertas Importantes</h2>
        </div>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border rounded-lg ${getAlertColors(alert.type)}`}
            >
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h3 className="font-bold text-gray-900">{alert.title}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{alert.date}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                  <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                    {alert.action} →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Atividade Recente</h2>
          </div>

          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getColorClasses(activity.color)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Monthly Growth */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Crescimento Mensal</h2>
          </div>

          <div className="space-y-4">
            {monthlyGrowth.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{month.month}</span>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
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
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${(month.users / 500) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Média de crescimento</span>
              <Badge variant="success">+16% mensal</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

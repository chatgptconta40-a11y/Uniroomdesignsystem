import {
  BarChart3,
  TrendingUp,
  Users,
  Home,
  DoorOpen,
  DoorClosed,
  FileText,
  CheckCircle,
  Shield,
  MapPin,
  Calendar,
  TrendingDown,
  Activity
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';

export function AdminAnalytics() {
  const monthlyGrowth = [
    { month: 'Jan', students: 245, landlords: 89, properties: 32, rooms: 128, applications: 156, occupancy: 72 },
    { month: 'Fev', students: 298, landlords: 102, properties: 41, rooms: 164, applications: 189, occupancy: 75 },
    { month: 'Mar', students: 356, landlords: 118, properties: 48, rooms: 192, applications: 234, occupancy: 78 },
    { month: 'Abr', students: 412, landlords: 134, properties: 56, rooms: 224, applications: 298, occupancy: 81 },
    { month: 'Mai', students: 478, landlords: 156, properties: 67, rooms: 268, applications: 345, occupancy: 87 },
  ];

  const topCities = [
    { city: 'Lisboa', students: 1245, properties: 189, occupancyRate: 92, applications: 456 },
    { city: 'Porto', students: 987, properties: 156, occupancyRate: 89, applications: 378 },
    { city: 'Coimbra', students: 756, properties: 98, occupancyRate: 85, applications: 289 },
    { city: 'Braga', students: 543, properties: 67, occupancyRate: 81, applications: 198 },
    { city: 'Aveiro', students: 432, properties: 54, occupancyRate: 78, applications: 167 },
    { city: 'Viseu', students: 324, properties: 42, occupancyRate: 74, applications: 134 },
    { city: 'Faro', students: 289, properties: 38, occupancyRate: 70, applications: 112 },
  ];

  const qualityMetrics = [
    { label: 'Denúncias Resolvidas (30d)', value: 47, total: 52, percentage: 90 },
    { label: 'Tempo Médio Resolução', value: '2.3 dias', trend: 'down', trendValue: '-15%' },
    { label: 'Trust Score Médio Estudantes', value: 78, total: 100, percentage: 78 },
    { label: 'Trust Score Médio Senhorios', value: 85, total: 100, percentage: 85 },
  ];

  const currentMonth = monthlyGrowth[monthlyGrowth.length - 1];
  const previousMonth = monthlyGrowth[monthlyGrowth.length - 2];

  const calculateGrowth = (current: number, previous: number) => {
    const growth = ((current - previous) / previous) * 100;
    return growth.toFixed(1);
  };

  const maxValue = Math.max(...monthlyGrowth.map(m => Math.max(m.students, m.landlords, m.properties * 5)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Métricas estratégicas da plataforma UniRoom</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          <Calendar className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">Maio 2026</span>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <Badge variant="success">+{calculateGrowth(currentMonth.students, previousMonth.students)}%</Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">Estudantes (Total)</p>
          <p className="text-3xl font-bold text-gray-900">{currentMonth.students}</p>
          <p className="text-xs text-gray-500 mt-2">vs. mês anterior: {previousMonth.students}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <Badge variant="success">+{calculateGrowth(currentMonth.landlords, previousMonth.landlords)}%</Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">Senhorios (Total)</p>
          <p className="text-3xl font-bold text-gray-900">{currentMonth.landlords}</p>
          <p className="text-xs text-gray-500 mt-2">vs. mês anterior: {previousMonth.landlords}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Home className="w-6 h-6 text-green-600" />
            </div>
            <Badge variant="success">+{calculateGrowth(currentMonth.properties, previousMonth.properties)}%</Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">Casas Publicadas</p>
          <p className="text-3xl font-bold text-gray-900">{currentMonth.properties}</p>
          <p className="text-xs text-gray-500 mt-2">{currentMonth.rooms} quartos totais</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <Badge variant="success">+{calculateGrowth(currentMonth.occupancy, previousMonth.occupancy)}%</Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">Taxa de Ocupação</p>
          <p className="text-3xl font-bold text-gray-900">{currentMonth.occupancy}%</p>
          <p className="text-xs text-gray-500 mt-2">{Math.round(currentMonth.rooms * currentMonth.occupancy / 100)} quartos ocupados</p>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Candidaturas (Mai)</p>
              <p className="text-2xl font-bold text-gray-900">{currentMonth.applications}</p>
            </div>
            <Badge variant="success">+{calculateGrowth(currentMonth.applications, previousMonth.applications)}%</Badge>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentMonth.applications / 400) * 100}%` }}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <DoorClosed className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Quartos Arrendados</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(currentMonth.rooms * currentMonth.occupancy / 100)}</p>
            </div>
            <span className="text-xs text-gray-500">de {currentMonth.rooms}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${currentMonth.occupancy}%` }}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <DoorOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Quartos Disponíveis</p>
              <p className="text-2xl font-bold text-gray-900">{currentMonth.rooms - Math.round(currentMonth.rooms * currentMonth.occupancy / 100)}</p>
            </div>
            <span className="text-xs text-gray-500">{100 - currentMonth.occupancy}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${100 - currentMonth.occupancy}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Crescimento de Utilizadores</h2>
            <Badge variant="outline">Últimos 5 meses</Badge>
          </div>
          <div className="space-y-4">
            {monthlyGrowth.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{month.month}</span>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      {month.students} est.
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      {month.landlords} senh.
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 h-8">
                  <div className="relative flex-1">
                    <div
                      className="absolute inset-0 bg-blue-500 rounded transition-all duration-500"
                      style={{ width: `${(month.students / maxValue) * 100}%` }}
                    />
                  </div>
                  <div className="relative flex-1">
                    <div
                      className="absolute inset-0 bg-purple-500 rounded transition-all duration-500"
                      style={{ width: `${(month.landlords / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Evolução de Casas e Ocupação</h2>
            <Badge variant="outline">Últimos 5 meses</Badge>
          </div>
          <div className="space-y-4">
            {monthlyGrowth.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{month.month}</span>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      {month.properties} casas
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {month.occupancy}% ocup.
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-8 bg-gray-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded transition-all duration-500"
                      style={{ width: `${(month.properties / 80) * 100}%` }}
                    />
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded transition-all duration-500 flex items-center justify-center text-xs font-bold text-white"
                      style={{ width: `${month.occupancy}%` }}
                    >
                      {month.occupancy}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Cities */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Cidades Mais Ativas</h2>
          <Badge variant="outline">{topCities.length} cidades</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Posição</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cidade</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Estudantes</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Propriedades</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Taxa de Ocupação</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Candidaturas</th>
              </tr>
            </thead>
            <tbody>
              {topCities.map((city, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{city.city}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{city.students}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">{city.properties}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                        <div
                          className={`h-full rounded-full ${
                            city.occupancyRate >= 85
                              ? 'bg-green-500'
                              : city.occupancyRate >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${city.occupancyRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-10">{city.occupancyRate}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-900">{city.applications}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quality Metrics */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Métricas de Qualidade</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {qualityMetrics.map((metric, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">{metric.label}</p>
                {metric.trend && (
                  <Badge variant={metric.trend === 'down' ? 'success' : 'default'}>
                    {metric.trend === 'down' ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                    {metric.trendValue}
                  </Badge>
                )}
              </div>
              {typeof metric.value === 'number' && metric.total ? (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                    <span className="text-sm text-gray-500">/ {metric.total}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        metric.percentage >= 80
                          ? 'bg-green-500'
                          : metric.percentage >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${metric.percentage}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-blue-50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Resumo do Desempenho</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Crescimento Geral</p>
                <p className="font-bold text-gray-900 text-lg">+16% mensal</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Área Crítica</p>
                <p className="font-bold text-orange-600 text-lg">Ocupação Faro (70%)</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Melhor Performance</p>
                <p className="font-bold text-green-600 text-lg">Lisboa (92% ocupação)</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

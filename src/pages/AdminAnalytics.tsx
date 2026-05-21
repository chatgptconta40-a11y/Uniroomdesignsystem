import { TrendingUp, TrendingDown, DollarSign, Users, Target, MapPin, Shield, Clock } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  getBusinessMetrics,
  getRetentionData,
  getCityActivity,
  getModerationMetrics,
  getAdminMetrics
} from '../data/mockAdmin';

export function AdminAnalytics() {
  const businessMetrics = getBusinessMetrics();
  const retentionData = getRetentionData();
  const cityActivity = getCityActivity();
  const moderationMetrics = getModerationMetrics();
  const adminMetrics = getAdminMetrics();

  const averageTrustScore = 73.5;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const maxCityListings = Math.max(...cityActivity.map(c => c.activeListings));

  return (
    <AdminLayout>
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Métricas de Negócio</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-green-600 text-white">Total</Badge>
            </div>
            <h4 className="text-3xl font-bold text-slate-900 mb-1">
              {formatCurrency(businessMetrics.totalRevenue)}
            </h4>
            <p className="text-sm text-slate-600">Receita Total</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-green-700">
              <TrendingUp className="w-3 h-3" />
              <span>+{businessMetrics.monthlyRevenue.toLocaleString('pt-PT')}€ este mês</span>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-blue-600 text-white">Conversão</Badge>
            </div>
            <h4 className="text-3xl font-bold text-slate-900 mb-1">
              {businessMetrics.conversionRate}%
            </h4>
            <p className="text-sm text-slate-600">Taxa de Conversão</p>
            <div className="mt-3 text-xs text-slate-500">
              {businessMetrics.successfulMatches.toLocaleString('pt-PT')} matches bem-sucedidos
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-primary text-white">Média</Badge>
            </div>
            <h4 className="text-3xl font-bold text-slate-900 mb-1">
              {formatCurrency(businessMetrics.averageBookingValue)}
            </h4>
            <p className="text-sm text-slate-600">Valor Médio de Reserva</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-red-600 text-white">Churn</Badge>
            </div>
            <h4 className="text-3xl font-bold text-slate-900 mb-1">
              {businessMetrics.churnRate}%
            </h4>
            <p className="text-sm text-slate-600">Taxa de Churn</p>
            <div className="mt-3 text-xs text-red-700">
              Requer atenção - meta &lt; 5%
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-primary text-white">Confiança</Badge>
            </div>
            <h4 className="text-3xl font-bold text-slate-900 mb-1">
              {averageTrustScore}
            </h4>
            <p className="text-sm text-slate-600">Trust Score Médio</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-green-700">
              <TrendingUp className="w-3 h-3" />
              <span>+2.3 vs mês anterior</span>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-yellow-600 text-white">Ativo</Badge>
            </div>
            <h4 className="text-3xl font-bold text-slate-900 mb-1">
              {adminMetrics.totalUsers.toLocaleString('pt-PT')}
            </h4>
            <p className="text-sm text-slate-600">Utilizadores Totais</p>
            <div className="mt-3 text-xs text-slate-500">
              {adminMetrics.totalStudents.toLocaleString('pt-PT')} estudantes · {adminMetrics.totalLandlords.toLocaleString('pt-PT')} senhorios
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Taxa de Retenção
            </h3>
            <p className="text-xs text-slate-500 mt-1">Percentagem de utilizadores retidos ao longo do tempo</p>
          </div>

          <div className="space-y-4">
            {retentionData.map((data, index) => {
              const studentRetentionRate = (data.studentsRetained / data.studentsTotal) * 100;
              const landlordRetentionRate = (data.landlordsRetained / data.landlordsTotal) * 100;

              return (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">{data.period}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-blue-600 font-semibold">
                        Estudantes: {studentRetentionRate.toFixed(0)}%
                      </span>
                      <span className="text-green-600 font-semibold">
                        Senhorios: {landlordRetentionRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${studentRetentionRate}%` }}
                    />
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${landlordRetentionRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-slate-600">Estudantes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-slate-600">Senhorios</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Cidades Mais Ativas
            </h3>
            <p className="text-xs text-slate-500 mt-1">Atividade por localização geográfica</p>
          </div>

          <div className="space-y-4">
            {cityActivity.map((city, index) => {
              const percentage = (city.activeListings / maxCityListings) * 100;
              const isGrowing = city.growth > 15;

              return (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-slate-400">#{index + 1}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{city.city}</p>
                        <p className="text-xs text-slate-500">
                          {city.activeListings} alojamentos · {city.activeUsers} utilizadores
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1 text-sm font-semibold ${
                        isGrowing ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {isGrowing ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                        <span>{city.growth}%</span>
                      </div>
                      <p className="text-xs text-slate-500">{city.applications} candidaturas</p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Eficácia da Moderação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <Badge className="bg-blue-600 text-white">
                {((moderationMetrics.resolvedReports / moderationMetrics.totalReports) * 100).toFixed(0)}%
              </Badge>
            </div>
            <h4 className="text-3xl font-bold text-slate-900 mb-1">
              {moderationMetrics.resolvedReports}/{moderationMetrics.totalReports}
            </h4>
            <p className="text-sm text-slate-600">Denúncias Resolvidas</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <Badge className="bg-green-600 text-white">Média</Badge>
            </div>
            <h4 className="text-3xl font-bold text-slate-900 mb-1">
              {moderationMetrics.averageResolutionTime}h
            </h4>
            <p className="text-sm text-slate-600">Tempo Médio de Resolução</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-green-700">
              <TrendingDown className="w-3 h-3" />
              <span>-1.2h vs mês anterior</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <Badge className="bg-primary text-white">Precisão</Badge>
            </div>
            <h4 className="text-3xl font-bold text-slate-900 mb-1">
              {moderationMetrics.accuracyRate}%
            </h4>
            <p className="text-sm text-slate-600">Taxa de Precisão</p>
            <div className="mt-3 text-xs text-slate-500">
              {moderationMetrics.falsePositives} falsos positivos
            </div>
          </Card>

          <Card className="p-6 lg:col-span-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Ações Automatizadas</h4>
                <p className="text-sm text-slate-600">
                  {moderationMetrics.automatedActions} ações executadas automaticamente pelas regras de moderação
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900">{moderationMetrics.automatedActions}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {((moderationMetrics.automatedActions / moderationMetrics.totalReports) * 100).toFixed(0)}% do total
                </p>
              </div>
            </div>

            <div className="mt-4 w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${(moderationMetrics.automatedActions / moderationMetrics.totalReports) * 100}%` }}
              />
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Resumo Executivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-3">Crescimento Mensal</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <p className="text-2xl font-bold text-slate-900">+{adminMetrics.monthlyGrowth}%</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-3">Novos Utilizadores Hoje</p>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <p className="text-2xl font-bold text-slate-900">{adminMetrics.newUsersToday}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-3">Novos Anúncios Hoje</p>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <p className="text-2xl font-bold text-slate-900">{adminMetrics.newListingsToday}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-3">Denúncias Pendentes</p>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              <p className="text-2xl font-bold text-slate-900">{adminMetrics.pendingReports}</p>
            </div>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}
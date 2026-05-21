import { useNavigate } from 'react-router';
import { Home, FileText, MessageCircle, Star, TrendingUp, Eye, Heart, PlusCircle, Clock, User, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLandlordMetrics, getDashboardActivity, getPerformanceData } from '../data/mockLandlord';
import { getMaintenanceStats } from '../data/mockMaintenance';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export function LandlordDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const metrics = getLandlordMetrics(user?.id || '');
  const activities = getDashboardActivity(user?.id || '');
  const performanceData = getPerformanceData(user?.id || '', 30);
  const maintenanceStats = getMaintenanceStats(user?.id || '');

  const recentActivities = activities.slice(0, 5);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'favorite':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'view':
        return <Eye className="w-5 h-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'application':
        return 'Nova candidatura';
      case 'message':
        return 'Nova mensagem';
      case 'favorite':
        return 'Adicionado aos favoritos';
      case 'view':
        return 'Visualização';
      default:
        return type;
    }
  };

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

  const chartData = performanceData.slice(-7);
  const maxViews = Math.max(...chartData.map(d => d.views));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Olá, {user?.name}! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Aqui está um resumo da tua atividade como senhorio
          </p>
        </div>

        {metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="p-6 cursor-pointer" hover onClick={() => navigate('/landlord/listings')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Home className="w-7 h-7 text-primary" />
                  </div>
                  <Badge variant="default">Ativos</Badge>
                </div>
                <h3 className="text-4xl font-bold text-foreground mb-3">{metrics.activeListings}</h3>
                <p className="text-sm font-medium text-muted-foreground">Alojamentos Ativos</p>
              </Card>

              <Card className="p-6 cursor-pointer" hover onClick={() => navigate('/landlord/applications')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <FileText className="w-7 h-7 text-secondary" />
                  </div>
                  {metrics.pendingApplications > 0 && (
                    <Badge variant="success">{metrics.pendingApplications}</Badge>
                  )}
                </div>
                <h3 className="text-4xl font-bold text-foreground mb-3">{metrics.pendingApplications}</h3>
                <p className="text-sm font-medium text-muted-foreground">Candidaturas Pendentes</p>
              </Card>

              <Card className="p-6 cursor-pointer" hover onClick={() => navigate('/messages')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-accent-foreground" />
                  </div>
                  {metrics.unreadMessages > 0 && (
                    <Badge variant="warning">{metrics.unreadMessages}</Badge>
                  )}
                </div>
                <h3 className="text-4xl font-bold text-foreground mb-3">{metrics.unreadMessages}</h3>
                <p className="text-sm font-medium text-muted-foreground">Mensagens Novas</p>
              </Card>

              <Card className="p-6" hover>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
                    <Star className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <Badge variant="warning">★ {metrics.averageRating}</Badge>
                </div>
                <h3 className="text-4xl font-bold text-foreground mb-3">{metrics.averageRating.toFixed(1)}</h3>
                <p className="text-sm font-medium text-muted-foreground">Avaliação Média</p>
              </Card>
            </div>

            <Card className="p-8 mb-10 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 cursor-pointer" hover onClick={() => navigate('/landlord/maintenance')}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center shadow-md">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">Pedidos de Manutenção</h3>
                  <p className="text-sm text-muted-foreground mb-4">Acompanha e gere problemas reportados pelos estudantes</p>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-2xl font-bold text-accent">{maintenanceStats.pending}</p>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{maintenanceStats.inProgress}</p>
                      <p className="text-xs text-muted-foreground">Em resolução</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary">{maintenanceStats.resolved}</p>
                      <p className="text-xs text-muted-foreground">Resolvidos</p>
                    </div>
                    {maintenanceStats.highUrgency > 0 && (
                      <div>
                        <Badge variant="destructive" className="text-lg px-3 py-1">
                          {maintenanceStats.highUrgency} urgentes
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="primary" onClick={(e) => { e.stopPropagation(); navigate('/landlord/maintenance'); }}>
                  Ver pedidos
                </Button>
              </div>
            </Card>
          </>
        )}

        <div className="mb-10 flex flex-wrap gap-4">
          <Button size="lg" variant="primary" onClick={() => navigate('/landlord/new-listing')}>
            <PlusCircle className="w-5 h-5" />
            Publicar Novo Alojamento
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/landlord/analytics')}>
            <TrendingUp className="w-5 h-5" />
            Ver Analytics Detalhadas
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Desempenho</h2>
                <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>

            <div className="space-y-4">
              {chartData.map((data, index) => {
                const percentage = (data.views / maxViews) * 100;
                const date = new Date(data.date);
                const dayName = date.toLocaleDateString('pt-PT', { weekday: 'short' });

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium capitalize">{dayName}</span>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {data.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {data.applications}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {data.messages}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Visualizações</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Candidaturas</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Mensagens</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Atividade Recente</h2>
                <p className="text-sm text-muted-foreground">Últimas ações</p>
              </div>
              <Clock className="w-6 h-6 text-gray-400" />
            </div>

            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-4 p-3 rounded-lg transition-colors hover:bg-muted cursor-pointer ${
                    !activity.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {getActivityLabel(activity.type)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{activity.listingTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-muted-foreground">{activity.userName}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4" size="sm">
              Ver Todas
            </Button>
          </Card>
        </div>

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Visualizações</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.totalViews}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Favoritos</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.totalFavorites}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.responseRate}%</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
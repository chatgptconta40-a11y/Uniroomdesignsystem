import { useNavigate } from 'react-router';
import {
  Home, FileText, MessageCircle, Star, TrendingUp, Eye, Heart, PlusCircle,
  Clock, User, Wrench, AlertCircle, PauseCircle, Camera, BarChart2,
  ChevronRight, BedDouble, Users, RefreshCw, CalendarDays, Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { getLandlordMetrics, getDashboardActivity, getPerformanceData, getLandlordListings } from '../data/mockLandlord';
import { getMaintenanceStats } from '../data/mockMaintenance';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export function LandlordDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { properties, rooms } = useProperties();

  const metrics = getLandlordMetrics(user?.id || '');
  const activities = getDashboardActivity(user?.id || '');
  const performanceData = getPerformanceData(user?.id || '', 30);
  const maintenanceStats = getMaintenanceStats(user?.id || '');
  const allListings = getLandlordListings(user?.id || '');

  const pausedListings = allListings.filter(l => l.status === 'paused');
  const lowViewListings = allListings.filter(l => l.status === 'active' && l.views < 50);
  const fewPhotosListings = allListings.filter(l => l.status !== 'draft' && l.applications === 0 && l.views > 0);

  // Room-level stats from context
  const myProperties = properties.filter(p => p.landlordId === user?.id && p.status !== 'archived');
  const myPropertyIds = new Set(myProperties.map(p => p.id));
  const myRooms = rooms.filter(r => myPropertyIds.has(r.propertyId));

  const roomStats = {
    total: myRooms.length,
    available: myRooms.filter(r => r.status === 'available').length,
    occupied: myRooms.filter(r => r.status === 'occupied').length,
    reserved: myRooms.filter(r => r.status === 'reserved').length,
    draft: myRooms.filter(r => r.status === 'draft').length,
    paused: myRooms.filter(r => r.status === 'paused').length,
  };

  // Upcoming vacancies: occupied rooms with move-in date in the past (will be free soon)
  // or rooms available in next 60 days
  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const upcomingVacancies = myRooms.filter(r => {
    if (r.status === 'available') {
      const avail = new Date(r.availableFrom);
      return avail > now && avail <= in60Days;
    }
    return false;
  });

  // Draft rooms that haven't been published yet
  const draftRooms = myRooms.filter(r => r.status === 'draft');

  // Mock late rents: occupied rooms whose move-in date was > 30 days ago (simulate overdue)
  const lateRentRooms = myRooms.filter(r => {
    if (r.status !== 'occupied' || !r.moveInDate) return false;
    const moveIn = new Date(r.moveInDate);
    const daysSince = (now.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24);
    // Simulate: rooms occupied > 60 days have a "late" flag for demo purposes
    return daysSince > 60;
  });

  // July reminder (it's May 2026, July is 2 months away)
  const showJulyReminder = new Date().getMonth() < 6; // before July

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

        {/* July republication reminder */}
        {showJulyReminder && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Lembrete: novo ano letivo em setembro</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Julho é a altura certa para republicar quartos para o ano letivo 2026/27. Estudantes começam a procurar com antecedência.
              </p>
            </div>
            <button
              onClick={() => navigate('/landlord/listings')}
              className="flex items-center gap-1.5 text-xs font-medium text-amber-800 hover:text-amber-900 whitespace-nowrap"
            >
              Ver alojamentos
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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

        {/* Room-level stats */}
        {myRooms.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Estado dos Quartos</h2>
                <span className="text-sm text-muted-foreground">· {roomStats.total} no total</span>
              </div>
              <button
                onClick={() => navigate('/landlord/listings')}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Gerir quartos <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Publicados', value: roomStats.available, color: 'bg-green-50 border-green-200 text-green-700', dot: 'bg-green-500' },
                { label: 'Ocupados', value: roomStats.occupied, color: 'bg-purple-50 border-purple-200 text-purple-700', dot: 'bg-purple-500' },
                { label: 'Reservados', value: roomStats.reserved, color: 'bg-blue-50 border-blue-200 text-blue-700', dot: 'bg-blue-500' },
                { label: 'Rascunho', value: roomStats.draft, color: 'bg-muted border-border text-muted-foreground', dot: 'bg-muted-foreground/40' },
                { label: 'Pausados', value: roomStats.paused, color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-400' },
                { label: 'Propriedades', value: myProperties.length, color: 'bg-primary/5 border-primary/20 text-primary', dot: 'bg-primary' },
              ].map(stat => (
                <div
                  key={stat.label}
                  className={`border rounded-xl p-3 text-center cursor-pointer hover:shadow-sm transition-shadow ${stat.color}`}
                  onClick={() => navigate('/landlord/listings')}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${stat.dot}`} />
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                  <p className="text-xs opacity-80">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming vacancies */}
        {upcomingVacancies.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Quartos a libertar nos próximos 60 dias</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingVacancies.map(room => {
                const prop = myProperties.find(p => p.id === room.propertyId);
                const daysUntil = Math.ceil((new Date(room.availableFrom).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div
                    key={room.id}
                    className="flex items-center gap-3 p-3 border border-border rounded-xl bg-card hover:border-primary/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/landlord/property/${room.propertyId}`)}
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{room.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{prop?.title}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-amber-600">{daysUntil}d</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(room.availableFrom).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Draft rooms quick publish */}
        {draftRooms.length > 0 && (
          <div className="mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BedDouble className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    {draftRooms.length} quarto{draftRooms.length > 1 ? 's' : ''} em rascunho
                  </p>
                  <p className="text-xs text-blue-700 mb-3">
                    {draftRooms.map(r => r.title).join(', ')} — prontos para publicar para estudantes.
                  </p>
                  <Button size="sm" onClick={() => navigate('/landlord/listings')}>
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    Publicar quartos em rascunho
                  </Button>
                </div>
              </div>
            </div>
          </div>
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

        {/* Ações Importantes */}
        {(() => {
          const actions: {
            key: string;
            icon: React.ReactNode;
            iconBg: string;
            title: string;
            description: string;
            actionLabel: string;
            route: string;
            badge?: number;
          }[] = [];

          if (metrics && metrics.pendingApplications > 0) {
            actions.push({
              key: 'applications',
              icon: <FileText className="w-5 h-5 text-blue-600" />,
              iconBg: 'bg-blue-50',
              title: `${metrics.pendingApplications} candidatura${metrics.pendingApplications > 1 ? 's' : ''} pendente${metrics.pendingApplications > 1 ? 's' : ''}`,
              description: 'Estudantes à espera de uma resposta tua.',
              actionLabel: 'Ver candidaturas',
              route: '/landlord/applications',
              badge: metrics.pendingApplications,
            });
          }

          if (metrics && metrics.unreadMessages > 0) {
            actions.push({
              key: 'messages',
              icon: <MessageCircle className="w-5 h-5 text-emerald-600" />,
              iconBg: 'bg-emerald-50',
              title: `${metrics.unreadMessages} mensagem${metrics.unreadMessages > 1 ? 'ns' : ''} não lida${metrics.unreadMessages > 1 ? 's' : ''}`,
              description: 'Há conversas que ainda não respondeste.',
              actionLabel: 'Ver mensagens',
              route: '/messages',
              badge: metrics.unreadMessages,
            });
          }

          if (pausedListings.length > 0) {
            actions.push({
              key: 'paused',
              icon: <PauseCircle className="w-5 h-5 text-amber-600" />,
              iconBg: 'bg-amber-50',
              title: `${pausedListings.length} anúncio${pausedListings.length > 1 ? 's' : ''} pausado${pausedListings.length > 1 ? 's' : ''}`,
              description: pausedListings.map(l => l.title).join(', '),
              actionLabel: 'Reativar ou rever',
              route: '/landlord/listings',
            });
          }

          if (lowViewListings.length > 0) {
            actions.push({
              key: 'lowviews',
              icon: <BarChart2 className="w-5 h-5 text-purple-600" />,
              iconBg: 'bg-purple-50',
              title: `${lowViewListings.length} anúncio${lowViewListings.length > 1 ? 's' : ''} com poucas visualizações`,
              description: 'Alguns anúncios ativos têm menos de 50 visitas. Considera melhorar o título ou as fotos.',
              actionLabel: 'Ver analytics',
              route: '/landlord/analytics',
            });
          }

          if (fewPhotosListings.length > 0) {
            actions.push({
              key: 'photos',
              icon: <Camera className="w-5 h-5 text-rose-600" />,
              iconBg: 'bg-rose-50',
              title: `${fewPhotosListings.length} anúncio${fewPhotosListings.length > 1 ? 's' : ''} sem candidaturas`,
              description: 'Anúncios com visitas mas sem candidaturas podem beneficiar de mais fotos ou melhor descrição.',
              actionLabel: 'Editar anúncios',
              route: '/landlord/listings',
            });
          }

          if (draftRooms.length > 0) {
            actions.push({
              key: 'drafts',
              icon: <BedDouble className="w-5 h-5 text-blue-600" />,
              iconBg: 'bg-blue-50',
              title: `${draftRooms.length} quarto${draftRooms.length > 1 ? 's' : ''} em rascunho`,
              description: `${draftRooms.map(r => r.title).join(', ')} — prontos para publicar.`,
              actionLabel: 'Publicar quartos',
              route: '/landlord/listings',
              badge: draftRooms.length,
            });
          }

          if (lateRentRooms.length > 0) {
            actions.push({
              key: 'lateRent',
              icon: <AlertCircle className="w-5 h-5 text-red-600" />,
              iconBg: 'bg-red-50',
              title: `${lateRentRooms.length} renda${lateRentRooms.length > 1 ? 's' : ''} com atraso`,
              description: 'Existem quartos ocupados com rendas não confirmadas. Contacta os inquilinos.',
              actionLabel: 'Ver detalhes',
              route: '/landlord/properties',
              badge: lateRentRooms.length,
            });
          }

          if (actions.length === 0) return null;

          return (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-foreground">Ações Importantes</h2>
                <span className="text-sm text-muted-foreground">· {actions.length} item{actions.length > 1 ? 'ns' : ''} a tratar</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {actions.map(action => (
                  <Card
                    key={action.key}
                    className="p-5 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary"
                    onClick={() => navigate(action.route)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 ${action.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground text-sm leading-snug">{action.title}</p>
                          {action.badge !== undefined && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex-shrink-0">
                              {action.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{action.description}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                          {action.actionLabel}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })()}

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
                  onClick={() => {
                    if (activity.type === 'application') {
                      navigate('/landlord/applications');
                    } else if (activity.type === 'message') {
                      navigate('/messages');
                    } else if (activity.type === 'view' || activity.type === 'favorite') {
                      navigate('/landlord/analytics');
                    }
                  }}
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

            <Button variant="outline" className="w-full mt-4" size="sm" onClick={() => navigate('/landlord/analytics')}>
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
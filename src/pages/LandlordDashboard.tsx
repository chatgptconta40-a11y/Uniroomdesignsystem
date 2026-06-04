import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart2,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Heart,
  Home,
  MessageCircle,
  PauseCircle,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { TrustBadge } from '../components/TrustBadge';
import { useMaintenance, useLandlordApplications } from '../hooks/useDb';
import { useLandlordAnalytics } from '../hooks/useLandlordAnalytics';
import { formatCurrency } from '../utils/format';
import { useUserRestrictions } from '../hooks/useUserRestrictions';
import { useTrustScore, useVerificationStatus } from '../hooks/useTrust';
import { useVisitRequests } from '../hooks/useVisitRequests';

function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return 'Agora mesmo';
  if (hours < 24) return `Há ${hours}h`;
  if (days === 1) return 'Ontem';
  return `Há ${days} dias`;
}

function getActivityIcon(type: string) {
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
      return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
  }
}

function getActivityLabel(type: string) {
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
}

export function LandlordDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { properties, rooms } = useProperties();
  const userId = user?.id || '';

  const { overview: analyticsOverview, recentActivity: analyticsActivity } = useLandlordAnalytics(userId);
  const unreadMessages = analyticsOverview.unreadMessages;
  const { requests: maintenanceRequests } = useMaintenance({ scope: 'landlord' });
  const { getPendingCount: getPendingApplicationsCount } = useLandlordApplications(userId);
  const { visitRequests } = useVisitRequests();
  const pendingVisitCount = visitRequests.filter(r => r.status === 'pending').length;
  const maintenanceStats = useMemo(() => ({
    total: maintenanceRequests.length,
    pending: maintenanceRequests.filter(r => r.status === 'pending').length,
    inProgress: maintenanceRequests.filter(r => r.status === 'in_progress').length,
    resolved: maintenanceRequests.filter(r => r.status === 'resolved').length,
    highUrgency: maintenanceRequests.filter(
      r => r.urgency === 'high' && r.status !== 'resolved' && r.status !== 'closed',
    ).length,
  }), [maintenanceRequests]);

  const myProperties = useMemo(
    () => properties.filter(property => property.landlordId === userId && property.status !== 'archived'),
    [properties, userId],
  );

  const myPropertyIds = useMemo(
    () => new Set(myProperties.map(property => property.id)),
    [myProperties],
  );

  const myRooms = useMemo(
    () => rooms.filter(room => myPropertyIds.has(room.propertyId)),
    [rooms, myPropertyIds],
  );

  const activeProperties = myProperties.filter(property => property.status === 'active');
  const pausedProperties = myProperties.filter(property => property.status === 'paused');
  const draftProperties = myProperties.filter(property => property.status === 'draft');
  const hasPhotos = myProperties.length > 0 && myProperties.some(p => Array.isArray(p.images) && p.images.length > 0);
  const totalViews = myProperties.reduce((acc, property) => acc + property.views, 0);
  const hasGoodVisibility = myProperties.length > 0 && totalViews > 0;

  const roomStats = {
    total: myRooms.length,
    available: myRooms.filter(room => room.status === 'available').length,
    occupied: myRooms.filter(room => room.status === 'occupied').length,
    reserved: myRooms.filter(room => room.status === 'reserved').length,
    draft: myRooms.filter(room => room.status === 'draft').length,
    paused: myRooms.filter(room => room.status === 'paused').length,
  };

  const draftRooms = myRooms.filter(room => room.status === 'draft');

  const pendingApplicationsCount = getPendingApplicationsCount();

  const {
    isSuspended: isAccountSuspended,
    isBlockedFromPublishing,
    reason: suspensionReason,
  } = useUserRestrictions(user?.id);

  const { status: verificationStatus } = useVerificationStatus(userId || undefined);
  const { score: trustScore } = useTrustScore(userId || undefined);
  const isVerifiedLandlord = verificationStatus?.level === 'gold' || verificationStatus?.documentVerified;

  const occupiedOrReservedRooms = roomStats.occupied + roomStats.reserved;
  const occupancyRate = roomStats.total > 0
    ? Math.round((occupiedOrReservedRooms / roomStats.total) * 100)
    : 0;

  const monthlyPotential = myRooms.reduce((total, room) => total + room.price + (room.utilities ?? 0), 0);

  const openWorkCount =
    pendingApplicationsCount +
    (unreadMessages) +
    maintenanceStats.pending +
    maintenanceStats.highUrgency +
    draftRooms.length +
    draftProperties.length;

  const portfolioScore = [
    activeProperties.length > 0,
    roomStats.available > 0 || roomStats.occupied > 0 || roomStats.reserved > 0,
    hasPhotos,
    hasGoodVisibility,
    isVerifiedLandlord,
  ].filter(Boolean).length;

  const portfolioScorePercent = Math.round((portfolioScore / 5) * 100);

  const priorityTasks = [
    pendingApplicationsCount > 0 && {
      label: `${pendingApplicationsCount} candidatura${pendingApplicationsCount > 1 ? 's' : ''} por responder`,
      route: '/landlord/applications',
      tone: 'text-blue-700 bg-blue-50 border-blue-100',
    },
    pendingVisitCount > 0 && {
      label: `${pendingVisitCount} pedido${pendingVisitCount > 1 ? 's' : ''} de visita por responder`,
      route: '/landlord/visit-requests',
      tone: 'text-violet-700 bg-violet-50 border-violet-100',
    },
    (unreadMessages) > 0 && {
      label: `${unreadMessages} mensagem${(unreadMessages) > 1 ? 'ns' : ''} não lida${(unreadMessages) > 1 ? 's' : ''}`,
      route: '/messages',
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    maintenanceStats.highUrgency > 0 && {
      label: `${maintenanceStats.highUrgency} pedido${maintenanceStats.highUrgency > 1 ? 's' : ''} urgente${maintenanceStats.highUrgency > 1 ? 's' : ''}`,
      route: '/landlord/maintenance',
      tone: 'text-red-700 bg-red-50 border-red-100',
    },
    draftRooms.length > 0 && {
      label: `${draftRooms.length} quarto${draftRooms.length > 1 ? 's' : ''} em rascunho`,
      route: '/landlord/listings',
      tone: 'text-amber-700 bg-amber-50 border-amber-100',
    },
    !isVerifiedLandlord && {
      label: 'Completar verificação de senhorio',
      route: '/verification',
      tone: 'text-primary bg-primary/5 border-primary/10',
    },
  ].filter(Boolean) as { label: string; route: string; tone: string }[];

  const recentActivities = analyticsActivity.slice(0, 5);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="p-8 max-w-md text-center">
          <Home className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sessão necessária</h1>
          <p className="text-muted-foreground mb-6">
            Inicia sessão como senhorio para veres o dashboard.
          </p>
          <Button onClick={() => navigate('/login')}>Iniciar sessão</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-primary mb-2">Área do senhorio</p>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Dashboard de gestão
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              Acompanha alojamentos, candidaturas, mensagens, visitas e manutenção num único painel operacional.
            </p>
          </div>

          <Card className="w-full xl:w-[420px] p-5 border-border/80 bg-card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">Conta de senhorio</p>
              </div>
              <TrustBadge userId={user.id} size="sm" showLabel />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Estado</p>
                <p className="text-sm font-semibold text-foreground">
                  {isAccountSuspended ? 'Suspensa' : isBlockedFromPublishing ? 'Limitada' : 'Ativa'}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="text-sm font-semibold text-foreground">{trustScore?.score ?? 0}/100</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Tarefas</p>
                <p className="text-sm font-semibold text-foreground">{openWorkCount}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => navigate('/landlord/new-listing')}
                disabled={isAccountSuspended || isBlockedFromPublishing}
              >
                <PlusCircle className="w-4 h-4" />
                Novo alojamento
              </Button>

              <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate('/verification')}>
                <ShieldCheck className="w-4 h-4" />
                Verificação
              </Button>
            </div>
          </Card>
        </div>

        {isAccountSuspended && (
          <Card className="p-5 mb-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-800">Conta suspensa</h3>
                <p className="text-sm text-red-700 mt-1">
                  {suspensionReason || 'A tua conta está suspensa pela equipa UniRoom.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="p-6 cursor-pointer" hover onClick={() => navigate('/landlord/listings')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Home className="w-7 h-7 text-primary" />
              </div>
              <Badge variant="outline">{activeProperties.length} ativos</Badge>
            </div>
            <h3 className="text-4xl font-bold text-foreground mb-3">{myProperties.length}</h3>
            <p className="text-sm font-medium text-gray-600">Alojamentos</p>
          </Card>

          <Card className="p-6 cursor-pointer" hover onClick={() => navigate('/landlord/listings')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center">
                <BedDouble className="w-7 h-7 text-secondary" />
              </div>
              <Badge variant="success">{roomStats.available} disponíveis</Badge>
            </div>
            <h3 className="text-4xl font-bold text-foreground mb-3">{roomStats.total}</h3>
            <p className="text-sm font-medium text-gray-600">Quartos</p>
          </Card>

          <Card className="p-6 cursor-pointer" hover onClick={() => navigate('/landlord/applications')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
              {pendingApplicationsCount > 0 && <Badge variant="warning">{pendingApplicationsCount}</Badge>}
            </div>
            <h3 className="text-4xl font-bold text-foreground mb-3">{pendingApplicationsCount}</h3>
            <p className="text-sm font-medium text-gray-600">Candidaturas pendentes</p>
          </Card>

          <Card className="p-6 cursor-pointer" hover onClick={() => navigate('/landlord/visit-requests')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-violet-50 rounded-xl flex items-center justify-center">
                <CalendarCheck className="w-7 h-7 text-violet-600" />
              </div>
              {pendingVisitCount > 0 && <Badge variant="warning">{pendingVisitCount}</Badge>}
            </div>
            <h3 className="text-4xl font-bold text-foreground mb-3">{pendingVisitCount}</h3>
            <p className="text-sm font-medium text-gray-600">Visitas pendentes</p>
          </Card>

          <Card className="p-6 cursor-pointer" hover onClick={() => navigate('/messages')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-accent-foreground" />
              </div>
              {unreadMessages > 0 && <Badge variant="warning">{unreadMessages}</Badge>}
            </div>
            <h3 className="text-4xl font-bold text-foreground mb-3">{unreadMessages}</h3>
            <p className="text-sm font-medium text-gray-600">Mensagens novas</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mb-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Resumo operacional</h2>
                <p className="text-sm text-muted-foreground">
                  Visão rápida do estado do teu portefólio.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/landlord/analytics')}>
                <BarChart2 className="w-4 h-4 mr-1.5" />
                Ver analytics
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground mb-1">Ocupação</p>
                <p className="text-2xl font-bold text-foreground">{occupancyRate}%</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground mb-1">Views</p>
                <p className="text-2xl font-bold text-foreground">{totalViews}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground mb-1">Receita potencial</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(monthlyPotential)}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground mb-1">Saúde do perfil</p>
                <p className="text-2xl font-bold text-foreground">{portfolioScorePercent}%</p>
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <div className="rounded-xl bg-muted/30 border border-border p-6 text-center">
                <BarChart2 className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">Dados históricos ainda insuficientes</p>
                <p className="text-xs text-muted-foreground mt-1">
                  À medida que houver mais visualizações e candidaturas, surgirão tendências aqui.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Prioridades</h2>
                <p className="text-sm text-muted-foreground">O que precisa de atenção.</p>
              </div>
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
            </div>

            {priorityTasks.length === 0 ? (
              <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                <p className="text-sm font-semibold text-green-800">Tudo em ordem</p>
                <p className="text-xs text-green-700 mt-1">
                  Não há tarefas urgentes neste momento.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {priorityTasks.slice(0, 7).map(task => (
                  <button
                    key={task.label}
                    onClick={() => navigate(task.route)}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left text-sm font-medium ${task.tone}`}
                  >
                    <span>{task.label}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-5 md:p-6 mb-8 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 cursor-pointer" hover onClick={() => navigate('/landlord/maintenance')}>
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Pedidos de Manutenção</h3>
                  <p className="text-sm text-muted-foreground">Problemas reportados pelos estudantes e estado de resolução.</p>
                </div>
                {maintenanceStats.highUrgency > 0 && (
                  <Badge variant="outline" className="w-fit bg-red-50 text-red-700 border-red-300">
                    {maintenanceStats.highUrgency} urgente{maintenanceStats.highUrgency > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
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
              </div>
            </div>
            <Button className="w-full md:w-auto" variant="primary" onClick={(event) => { event.stopPropagation(); navigate('/landlord/maintenance'); }}>
              Ver pedidos
            </Button>
          </div>
        </Card>

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
                { label: 'Alojamentos', value: myProperties.length, color: 'bg-primary/5 border-primary/20 text-primary', dot: 'bg-primary' },
              ].map(stat => (
                <div
                  key={stat.label}
                  className={`border rounded-xl p-3 text-center cursor-pointer hover:shadow-sm transition-shadow ${stat.color}`}
                  onClick={() => navigate('/landlord/listings')}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${stat.dot}`} />
                    <span className="text-xs font-medium">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">Atividade recente</h2>
                <p className="text-sm text-muted-foreground">Últimos movimentos no teu portefólio.</p>
              </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                Ainda não há atividade recente.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-foreground">{getActivityLabel(activity.type)}</p>
                        <span className="text-xs text-muted-foreground">{formatTime(activity.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Qualidade dos anúncios</h2>
                  <p className="text-sm text-muted-foreground">Checklist rápida.</p>
                </div>
                <Star className="w-5 h-5 text-amber-500" />
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Tem alojamentos ativos', done: activeProperties.length > 0 },
                  { label: 'Tem quartos publicados', done: roomStats.available > 0 || roomStats.occupied > 0 || roomStats.reserved > 0 },
                  { label: 'Fotos adicionadas', done: hasPhotos },
                  { label: 'Boa visibilidade', done: hasGoodVisibility },
                  { label: 'Senhorio verificado', done: Boolean(isVerifiedLandlord) },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <CheckCircle2 className={`w-5 h-5 ${item.done ? 'text-secondary' : 'text-muted-foreground/40'}`} />
                    <span className={`text-sm ${item.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-muted/40 p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Pontuação</span>
                  <span className="font-bold text-foreground">{portfolioScorePercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${portfolioScorePercent}%` }} />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Ações rápidas</h2>
              <div className="space-y-2">
                <Button className="w-full justify-start" onClick={() => navigate('/landlord/new-listing')} disabled={isAccountSuspended || isBlockedFromPublishing}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Criar alojamento
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/landlord/listings')}>
                  <Home className="w-4 h-4 mr-2" />
                  Anúncios
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/landlord/applications')}>
                  <Users className="w-4 h-4 mr-2" />
                  Candidaturas
                  {pendingApplicationsCount > 0 && (
                    <span className="ml-auto text-xs font-bold text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">
                      {pendingApplicationsCount}
                    </span>
                  )}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/landlord/visit-requests')}>
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Pedidos de visita
                  {pendingVisitCount > 0 && (
                    <span className="ml-auto text-xs font-bold text-violet-700 bg-violet-100 rounded-full px-2 py-0.5">
                      {pendingVisitCount}
                    </span>
                  )}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/landlord/maintenance')}>
                  <Wrench className="w-4 h-4 mr-2" />
                  Manutenção
                  {maintenanceStats.highUrgency > 0 && (
                    <span className="ml-auto text-xs font-bold text-red-700 bg-red-100 rounded-full px-2 py-0.5">
                      {maintenanceStats.highUrgency} urgente{maintenanceStats.highUrgency !== 1 ? 's' : ''}
                    </span>
                  )}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/landlord/analytics')}>
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </Card>

            {(pausedProperties.length > 0 || draftProperties.length > 0) && (
              <Card className="p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Estados especiais</h2>
                <div className="space-y-3">
                  {draftProperties.length > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Rascunhos</span>
                      </div>
                      <Badge variant="outline">{draftProperties.length}</Badge>
                    </div>
                  )}
                  {pausedProperties.length > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3">
                      <div className="flex items-center gap-2">
                        <PauseCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-amber-800">Pausados</span>
                      </div>
                      <Badge variant="warning">{pausedProperties.length}</Badge>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


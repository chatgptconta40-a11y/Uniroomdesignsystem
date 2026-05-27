import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  ArrowUpRight,
  Ban,
  BedDouble,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Eye,
  FileText,
  Heart,
  Home,
  MessageCircle,
  PlusCircle,
  Receipt,
  ShieldCheck,
  ShieldOff,
  Star,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { getLandlordMetrics, getDashboardActivity, getPerformanceData } from '../data/mockLandlord';
import { getPendingCountForLandlord } from '../data/mockLandlordCandidates';
import { getMaintenanceStats } from '../data/mockMaintenance';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { isUserSuspended, isUserBlockedFromPublishing, getUserState } from '../data/mockAdminUsersState';
import { TrustBadge } from '../components/TrustBadge';
import { getTrustScore, getVerificationStatus } from '../data/mockTrust';
import {
  formatCurrency,
  getLandlordFinanceSummary,
  getPaymentMethodLabel,
  getPaymentMethodMainValue,
  upsertDefaultPaymentMethod,
} from '../data/mockHousingFinance';

export function LandlordDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { properties, rooms } = useProperties();
  const [, setFinanceRefreshKey] = useState(0);

  const mockMetrics = getLandlordMetrics(user?.id || '');
  const activities = getDashboardActivity(user?.id || '');
  const performanceData = getPerformanceData(user?.id || '', 30);
  const maintenanceStats = getMaintenanceStats(user?.id || '');

  const myProperties = properties.filter(p => p.landlordId === user?.id && p.status !== 'archived');
  const myPropertyIds = new Set(myProperties.map(p => p.id));
  const myRooms = rooms.filter(r => myPropertyIds.has(r.propertyId));

  const activeProperties = myProperties.filter(p => p.status === 'active');
  const pausedProperties = myProperties.filter(p => p.status === 'paused');
  const draftProperties = myProperties.filter(p => p.status === 'draft');
  const lowViewProperties = myProperties.filter(p => p.status === 'active' && p.views < 50);
  const noImageProperties = myProperties.filter(p => p.status !== 'draft' && p.images.length === 0);
  const totalViews = myProperties.reduce((acc, p) => acc + p.views, 0);

  const roomStats = {
    total: myRooms.length,
    available: myRooms.filter(r => r.status === 'available').length,
    occupied: myRooms.filter(r => r.status === 'occupied').length,
    reserved: myRooms.filter(r => r.status === 'reserved').length,
    draft: myRooms.filter(r => r.status === 'draft').length,
    paused: myRooms.filter(r => r.status === 'paused').length,
  };

  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const upcomingVacancies = myRooms.filter(r => {
    if (r.status === 'available') {
      const availableFrom = new Date(r.availableFrom);
      return availableFrom > now && availableFrom <= in60Days;
    }

    return false;
  });

  const draftRooms = myRooms.filter(r => r.status === 'draft');

  const pendingApplicationsCount = getPendingCountForLandlord(
    user?.id || '',
    myProperties.map(p => p.id),
  );

  const lateRentRooms = myRooms.filter(r => {
    if (r.status !== 'occupied' || !r.moveInDate) return false;
    const daysSince = (now.getTime() - new Date(r.moveInDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 60;
  });

  const recentActivities = activities.slice(0, 5);
  const chartData = performanceData.slice(-7);
  const maxViews = Math.max(1, ...chartData.map(d => d.views));
  const showJulyReminder = now.getMonth() < 6;

  const isAccountSuspended = user ? isUserSuspended(user.id) : false;
  const isBlockedFromPublishing = user ? isUserBlockedFromPublishing(user.id) : false;
  const suspensionReason = user ? getUserState(user.id)?.reason : undefined;
  const verificationStatus = user ? getVerificationStatus(user.id) : null;
  const trustScore = user ? getTrustScore(user.id) : null;
  const isVerifiedLandlord = verificationStatus?.level === 'gold' || verificationStatus?.documentVerified;

  const occupiedOrReservedRooms = roomStats.occupied + roomStats.reserved;
  const occupancyRate = roomStats.total > 0 ? Math.round((occupiedOrReservedRooms / roomStats.total) * 100) : 0;
  const monthlyPotential = myRooms.reduce((total, room) => total + room.price + (room.utilities ?? 0), 0);

  const financeSummary = getLandlordFinanceSummary(user?.id || '', user?.name || 'Senhorio UniRoom');
  const defaultPaymentMethod = financeSummary.methods.find(method => method.isDefault) || financeSummary.methods[0];

  const openWorkCount =
    pendingApplicationsCount +
    (mockMetrics?.unreadMessages ?? 0) +
    maintenanceStats.pending +
    maintenanceStats.highUrgency +
    draftRooms.length +
    draftProperties.length +
    financeSummary.pendingPayments.length +
    financeSummary.latePayments.length +
    financeSummary.proofPayments.length;

  const portfolioScore = [
    activeProperties.length > 0,
    roomStats.available > 0 || roomStats.occupied > 0 || roomStats.reserved > 0,
    noImageProperties.length === 0,
    lowViewProperties.length === 0,
    isVerifiedLandlord,
  ].filter(Boolean).length;
  const portfolioScorePercent = Math.round((portfolioScore / 5) * 100);

  const priorityTasks = [
    pendingApplicationsCount > 0 && {
      label: `${pendingApplicationsCount} candidatura${pendingApplicationsCount > 1 ? 's' : ''} por responder`,
      route: '/landlord/applications',
      tone: 'text-blue-700 bg-blue-50 border-blue-100',
    },
    (mockMetrics?.unreadMessages ?? 0) > 0 && {
      label: `${mockMetrics?.unreadMessages ?? 0} mensagem${(mockMetrics?.unreadMessages ?? 0) > 1 ? 'ns' : ''} não lida${(mockMetrics?.unreadMessages ?? 0) > 1 ? 's' : ''}`,
      route: '/messages',
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    maintenanceStats.highUrgency > 0 && {
      label: `${maintenanceStats.highUrgency} pedido${maintenanceStats.highUrgency > 1 ? 's' : ''} urgente${maintenanceStats.highUrgency > 1 ? 's' : ''}`,
      route: '/landlord/maintenance',
      tone: 'text-red-700 bg-red-50 border-red-100',
    },
    financeSummary.proofPayments.length > 0 && {
      label: `${financeSummary.proofPayments.length} comprovativo${financeSummary.proofPayments.length > 1 ? 's' : ''} por validar`,
      route: '/landlord/dashboard',
      tone: 'text-purple-700 bg-purple-50 border-purple-100',
    },
    financeSummary.latePayments.length > 0 && {
      label: `${financeSummary.latePayments.length} renda${financeSummary.latePayments.length > 1 ? 's' : ''} em atraso`,
      route: '/landlord/dashboard',
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
        return <CheckCircle2 className="w-5 h-5 text-muted-foreground" />;
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
    const diff = new Date().getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Agora mesmo';
    if (hours < 24) return `Há ${hours}h`;
    if (days === 1) return 'Ontem';
    return `Há ${days} dias`;
  };

  const handleCreateDefaultPaymentMethod = () => {
    if (!user) return;

    upsertDefaultPaymentMethod(user.id, {
      methodType: 'mbway',
      label: 'MB WAY principal',
      holderName: user.name,
      mbwayPhone: '912 345 678',
      instructions: 'Pagamento por MB WAY. O estudante deve carregar o comprovativo na UniRoom.',
    });

    setFinanceRefreshKey(key => key + 1);
    alert('Método de pagamento principal configurado.');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-primary mb-2">Área do senhorio</p>
            <h1 className="text-3xl font-bold text-foreground mb-3">Dashboard de gestão</h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              Acompanha alojamentos, candidaturas, mensagens, manutenção, contratos e pagamentos num único painel operacional.
            </p>
          </div>

          <Card className="w-full xl:w-[420px] p-5 border-border/80 bg-card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Conta de senhorio</p>
              </div>
              <TrustBadge userId={user?.id || ''} size="sm" showLabel />
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
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-2xl flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Ban className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-800 mb-1">Conta suspensa temporariamente</p>
              <p className="text-sm text-red-700">
                A tua conta foi suspensa pela equipa UniRoom. Não podes publicar, reativar ou criar novos anúncios enquanto esta suspensão estiver ativa.
                {suspensionReason && <span> Motivo: <span className="font-medium">{suspensionReason}</span>.</span>}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Para resolver, contacta o suporte em <span className="font-medium">suporte@uniroom.pt</span>.
              </p>
            </div>
          </div>
        )}

        {!isAccountSuspended && isBlockedFromPublishing && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldOff className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-orange-800 mb-1">Publicação de novos anúncios bloqueada</p>
              <p className="text-sm text-orange-700">
                A tua conta está impedida de publicar novos anúncios pela equipa UniRoom. Podes continuar a gerir os teus anúncios existentes e responder a candidaturas.
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Contacta o suporte em <span className="font-medium">suporte@uniroom.pt</span> para mais informações.
              </p>
            </div>
          </div>
        )}

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

        <Card className="p-5 md:p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <div>
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Resumo operacional</h2>
                  <p className="text-sm text-muted-foreground">Leitura rápida do estado atual do teu portefólio.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/landlord/analytics')}>
                  Ver detalhe
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Ocupação</p>
                  <p className="text-2xl font-bold text-foreground">{occupancyRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{occupiedOrReservedRooms}/{roomStats.total || 0} quartos</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Receita potencial</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(monthlyPotential)}</p>
                  <p className="text-xs text-muted-foreground mt-1">rendas + despesas/mês</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Visibilidade</p>
                  <p className="text-2xl font-bold text-foreground">{totalViews}</p>
                  <p className="text-xs text-muted-foreground mt-1">visualizações totais</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Saúde</p>
                  <p className="text-2xl font-bold text-foreground">{portfolioScorePercent}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{portfolioScore}/5 critérios bons</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Prioridades</h3>
                  <p className="text-xs text-muted-foreground">O que merece atenção primeiro.</p>
                </div>
                {priorityTasks.length === 0 && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </div>

              {priorityTasks.length > 0 ? (
                <div className="space-y-2">
                  {priorityTasks.slice(0, 5).map(task => (
                    <button
                      key={task.label}
                      onClick={() => navigate(task.route)}
                      className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-white ${task.tone}`}
                    >
                      <span className="text-xs font-medium leading-snug">{task.label}</span>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3">
                  <p className="text-sm font-semibold text-emerald-800">Tudo controlado</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Não há candidaturas, mensagens, pagamentos ou alertas urgentes por tratar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h2 className="text-lg font-bold text-foreground">Estado da conta de senhorio</h2>
                  <TrustBadge userId={user?.id || ''} size="sm" showLabel />
                </div>

                <p className="text-sm text-muted-foreground max-w-2xl">
                  {isVerifiedLandlord
                    ? 'A tua conta já transmite sinais fortes de confiança aos estudantes. Mantém os dados dos alojamentos atualizados para reforçar a credibilidade.'
                    : 'Completa a verificação para aumentar a confiança dos estudantes antes das visitas e candidaturas.'}
                </p>
              </div>
            </div>

            <Button onClick={() => navigate('/verification')} className="w-full lg:w-auto">
              Gerir verificação
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 cursor-pointer" hover onClick={() => navigate('/landlord/listings')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Home className="w-7 h-7 text-primary" />
              </div>
              <Badge variant="default">Ativos</Badge>
            </div>
            <h3 className="text-4xl font-bold text-foreground mb-3">{activeProperties.length}</h3>
            <p className="text-sm font-medium text-gray-600">Alojamentos Ativos</p>
          </Card>

          <Card className="p-6 cursor-pointer" hover onClick={() => navigate('/landlord/applications')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-secondary" />
              </div>
              {pendingApplicationsCount > 0 && <Badge variant="success">{pendingApplicationsCount}</Badge>}
            </div>
            <h3 className="text-4xl font-bold text-foreground mb-3">{pendingApplicationsCount}</h3>
            <p className="text-sm font-medium text-gray-600">Candidaturas Pendentes</p>
          </Card>

          <Card className="p-6 cursor-pointer" hover onClick={() => navigate('/messages')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-accent-foreground" />
              </div>
              {(mockMetrics?.unreadMessages ?? 0) > 0 && <Badge variant="warning">{mockMetrics!.unreadMessages}</Badge>}
            </div>
            <h3 className="text-4xl font-bold text-foreground mb-3">{mockMetrics?.unreadMessages ?? 0}</h3>
            <p className="text-sm font-medium text-gray-600">Mensagens Novas</p>
          </Card>

          <Card className="p-6" hover>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center">
                <Star className="w-7 h-7 text-amber-500" />
              </div>
              {mockMetrics?.averageRating && mockMetrics.averageRating > 0 && <Badge variant="default">Avaliação</Badge>}
            </div>
            <h3 className="text-4xl font-bold text-foreground mb-3">
              {mockMetrics?.averageRating ? mockMetrics.averageRating.toFixed(1) : '—'}
            </h3>
            <p className="text-sm font-medium text-gray-600">Rating Médio</p>
          </Card>
        </div>

        <Card className="p-5 md:p-6 mb-6 border-primary/10 bg-gradient-to-br from-primary/5 to-white">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Contratos e pagamentos</h2>
              </div>

              <p className="text-sm text-muted-foreground max-w-2xl">
                Configura como os estudantes pagam a renda, acompanha comprovativos e identifica contratos ou pagamentos que precisam de atenção.
              </p>
            </div>

            <Button variant="outline" onClick={handleCreateDefaultPaymentMethod}>
              <CreditCard className="w-4 h-4 mr-2" />
              Configurar método
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs text-muted-foreground">Receita prevista</p>
                <Receipt className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(financeSummary.expectedThisMonth)}</p>
              <p className="text-xs text-muted-foreground mt-1">pagamentos registados este mês</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <ClockBadge />
              </div>
              <p className="text-2xl font-bold text-foreground">{financeSummary.pendingPayments.length}</p>
              <p className="text-xs text-muted-foreground mt-1">rendas por confirmar</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs text-muted-foreground">Em atraso</p>
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{financeSummary.latePayments.length}</p>
              <p className="text-xs text-muted-foreground mt-1">precisam de seguimento</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs text-muted-foreground">Contratos ativos</p>
                <FileText className="w-4 h-4 text-secondary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{financeSummary.activeContracts}</p>
              <p className="text-xs text-muted-foreground mt-1">associados a estudantes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Método de pagamento principal</h3>
                  <p className="text-xs text-muted-foreground">Estes dados aparecem ao estudante em “A Minha Casa”.</p>
                </div>

                <Badge variant={defaultPaymentMethod ? 'success' : 'outline'}>
                  {defaultPaymentMethod ? 'Configurado' : 'Em falta'}
                </Badge>
              </div>

              {defaultPaymentMethod ? (
                <div className="rounded-lg bg-muted/30 border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">{getPaymentMethodLabel(defaultPaymentMethod)}</p>
                  <p className="text-sm font-semibold text-foreground break-all">
                    {getPaymentMethodMainValue(defaultPaymentMethod)}
                  </p>
                  {defaultPaymentMethod.holderName && (
                    <p className="text-xs text-muted-foreground mt-1">Titular: {defaultPaymentMethod.holderName}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <p className="text-sm font-semibold text-amber-800">Nenhum método configurado</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Configura MB WAY, IBAN ou referência para os estudantes saberem como pagar.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Comprovativos por validar</h3>
                  <p className="text-xs text-muted-foreground">
                    Pagamentos enviados pelos estudantes que ainda não foram confirmados.
                  </p>
                </div>

                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>

              {financeSummary.proofPayments.length > 0 ? (
                <div className="space-y-2">
                  {financeSummary.proofPayments.slice(0, 3).map(payment => (
                    <div key={payment.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatCurrency(payment.totalAmount)}</p>
                        <p className="text-xs text-muted-foreground">{payment.proofFileName || 'Comprovativo enviado'}</p>
                      </div>

                      <Badge variant="warning">Validar</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                  <p className="text-sm font-semibold text-green-800">Sem comprovativos pendentes</p>
                  <p className="text-xs text-green-700 mt-1">
                    Quando um estudante carregar comprovativo, aparece aqui.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

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
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                  <p className="text-xs opacity-80">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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

        <div className="mb-10 flex flex-wrap gap-4">
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/landlord/new-listing')}
            disabled={isAccountSuspended || isBlockedFromPublishing}
          >
            <PlusCircle className="w-5 h-5" />
            Publicar Novo Alojamento
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/landlord/listings')}>
            <Home className="w-5 h-5" />
            Gerir Alojamentos
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/landlord/analytics')}>
            <TrendingUp className="w-5 h-5" />
            Ver Analytics
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Atividade recente</h2>
                <p className="text-sm text-muted-foreground">Últimos eventos relevantes na tua conta.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/landlord/analytics')}>
                Ver tudo
              </Button>
            </div>

            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3">
                    <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{getActivityLabel(activity.type)}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(activity.createdAt)}</p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">Sem atividade recente.</div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Desempenho 7 dias</h2>
                <p className="text-sm text-muted-foreground">Visualizações recentes.</p>
              </div>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>

            <div className="space-y-3">
              {chartData.map(day => (
                <div key={day.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{day.label}</span>
                    <span className="font-semibold text-foreground">{day.views}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(6, Math.round((day.views / maxViews) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {(pausedProperties.length > 0 || draftProperties.length > 0 || draftRooms.length > 0 || lowViewProperties.length > 0 || noImageProperties.length > 0 || lateRentRooms.length > 0) && (
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4">Ações importantes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pausedProperties.length > 0 && (
                <ActionRow
                  title={`${pausedProperties.length} alojamento${pausedProperties.length > 1 ? 's' : ''} pausado${pausedProperties.length > 1 ? 's' : ''}`}
                  description={pausedProperties.map(p => p.title).join(', ')}
                  label="Reativar ou rever"
                  onClick={() => navigate('/landlord/listings')}
                />
              )}
              {draftProperties.length > 0 && (
                <ActionRow
                  title={`${draftProperties.length} alojamento${draftProperties.length > 1 ? 's' : ''} em rascunho`}
                  description="Ainda não está visível para estudantes."
                  label="Publicar alojamentos"
                  onClick={() => navigate('/landlord/listings')}
                />
              )}
              {draftRooms.length > 0 && (
                <ActionRow
                  title={`${draftRooms.length} quarto${draftRooms.length > 1 ? 's' : ''} em rascunho`}
                  description={draftRooms.map(r => r.title).join(', ')}
                  label="Publicar quartos"
                  onClick={() => navigate('/landlord/listings')}
                />
              )}
              {lowViewProperties.length > 0 && (
                <ActionRow
                  title={`${lowViewProperties.length} alojamento${lowViewProperties.length > 1 ? 's' : ''} com poucas visitas`}
                  description="Melhora fotos, título ou descrição para aumentar o interesse."
                  label="Ver analytics"
                  onClick={() => navigate('/landlord/analytics')}
                />
              )}
              {noImageProperties.length > 0 && (
                <ActionRow
                  title={`${noImageProperties.length} alojamento${noImageProperties.length > 1 ? 's' : ''} sem fotos`}
                  description="Anúncios com fotos transmitem mais confiança aos estudantes."
                  label="Editar alojamentos"
                  onClick={() => navigate('/landlord/listings')}
                />
              )}
              {lateRentRooms.length > 0 && (
                <ActionRow
                  title={`${lateRentRooms.length} quarto${lateRentRooms.length > 1 ? 's' : ''} com possível renda por rever`}
                  description="Confirma se os pagamentos estão atualizados."
                  label="Ver contratos e pagamentos"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                />
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function ClockBadge() {
  return <Bell className="w-4 h-4 text-amber-600" />;
}

function ActionRow({
  title,
  description,
  label,
  onClick,
}: {
  title: string;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onClick}>
          {label}
        </Button>
      </div>
    </div>
  );
}

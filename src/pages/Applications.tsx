import { useEffect, useMemo, useState, type ElementType } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText,
  MapPin,
  MessageCircle,
  ExternalLink,
  XCircle,
  CheckCircle,
  Clock,
  Send,
  Home,
  Video,
  Users,
  ArrowRight,
  Sparkles,
  Search,
  CalendarDays,
  Euro,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { findOrCreateConversation } from '../hooks/useMessages';
import { supabase } from '../lib/supabase';
import { supabaseUrl, publicAnonKey } from '../lib/supabase';
import { dbToApplication } from '../hooks/useDb';
import { Application, ApplicationStatus } from '../types/accommodation';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ConfirmModal } from '../components/ConfirmModal';
import { toast } from 'sonner';

function fmt(date: Date | string | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function fmtMonth(date: Date | string | undefined): string {
  if (!date) return 'Sem data';
  return new Date(date).toLocaleDateString('pt-PT', {
    month: 'long',
    year: 'numeric',
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TimelineStep {
  key: string;
  icon: ElementType;
  label: string;
  sublabel?: string;
  date?: string;
  color: string;
  bgColor: string;
  done: boolean;
  pending?: boolean;
}

function buildTimeline(app: Application): TimelineStep[] {
  const steps: TimelineStep[] = [
    {
      key: 'sent',
      icon: Send,
      label: 'Candidatura enviada',
      date: fmt(app.createdAt),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      done: true,
    },
  ];

  const isReviewing = ['under_review', 'accepted', 'confirmed', 'rejected'].includes(app.status);

  steps.push({
    key: 'review',
    icon: Clock,
    label: isReviewing ? 'Em análise pelo senhorio' : 'A aguardar análise',
    date: isReviewing ? fmt(app.reviewedAt || app.updatedAt) : undefined,
    color: isReviewing ? 'text-amber-600' : 'text-gray-400',
    bgColor: isReviewing ? 'bg-amber-100' : 'bg-gray-100',
    done: isReviewing,
    pending: !isReviewing,
  });

  if (app.visitDate) {
    const visitDate = new Date(app.visitDate);
    const isPast = visitDate < new Date();

    steps.push({
      key: 'visit',
      icon: app.visitFormat === 'videochamada' ? Video : Users,
      label: isPast ? 'Visita realizada' : 'Visita agendada',
      sublabel: `${visitDate.toLocaleDateString('pt-PT', {
        day: 'numeric',
        month: 'long',
      })} às ${fmtTime(app.visitDate)} · ${
        app.visitFormat === 'videochamada' ? 'Videochamada' : 'Presencial'
      }${app.visitNote ? ` · ${app.visitNote}` : ''}`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      done: true,
    });
  }

  if (app.status === 'accepted' || app.status === 'confirmed') {
    steps.push({
      key: 'accepted',
      icon: CheckCircle,
      label: 'Aceite pelo senhorio',
      date: fmt(app.reviewedAt),
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      done: true,
    });
  } else if (app.status === 'rejected') {
    steps.push({
      key: 'rejected',
      icon: XCircle,
      label: 'Candidatura recusada',
      date: fmt(app.reviewedAt),
      color: 'text-red-500',
      bgColor: 'bg-red-100',
      done: true,
    });
  } else if (app.status === 'withdrawn') {
    steps.push({
      key: 'withdrawn',
      icon: XCircle,
      label: 'Candidatura cancelada',
      date: fmt(app.updatedAt),
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      done: true,
    });
  }

  if (app.status === 'confirmed' && app.confirmedAt) {
    steps.push({
      key: 'confirmed',
      icon: Sparkles,
      label: 'Estadia confirmada',
      date: fmt(app.confirmedAt),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      done: true,
    });
  } else if (app.status === 'accepted') {
    steps.push({
      key: 'confirm_pending',
      icon: ArrowRight,
      label: 'Confirma para garantir o quarto',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      done: false,
      pending: true,
    });
  }

  return steps;
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'Pendente',
  under_review: 'Em análise',
  accepted: 'Aceite',
  rejected: 'Recusada',
  withdrawn: 'Cancelada',
  confirmed: 'Confirmada',
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  under_review: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  withdrawn: 'bg-gray-50 text-gray-500 border-gray-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function getNextStepText(app: Application): string {
  if (app.status === 'pending') return 'Aguardar a análise do senhorio.';
  if (app.status === 'under_review') return 'O senhorio está a avaliar a candidatura.';
  if (app.status === 'accepted') return 'Confirma a estadia para garantir o quarto.';
  if (app.status === 'confirmed') return 'A estadia já está ativa. Consulta "A Minha Casa".';
  if (app.status === 'rejected') return 'Podes procurar quartos semelhantes.';
  return 'Candidatura cancelada.';
}

function getStatusBorder(status: ApplicationStatus): string {
  if (status === 'accepted') return 'ring-2 ring-green-300 border-green-200';
  if (status === 'confirmed') return 'ring-2 ring-emerald-300 border-emerald-200';
  if (status === 'rejected') return 'border-red-200';
  return '';
}

export function Applications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getRoom, getProperty, refreshProperties } = useProperties();

  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null);
  const [confirmStayApp, setConfirmStayApp] = useState<Application | null>(null);

  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setApplications([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error('[UniRoom] Applications fetch error:', error.message);
        toast.error(`Erro ao carregar candidaturas: ${error.message}`);
        setApplications([]);
        return;
      }
      setApplications((data ?? []).map(dbToApplication));
    })();
    return () => { cancelled = true; };
  }, [user?.id, refreshKey]);

  const filteredApplications = useMemo(() => {
    if (filter === 'all') return applications;
    return applications.filter(app => app.status === filter);
  }, [applications, filter]);

  const counts = {
    all: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    under_review: applications.filter(app => app.status === 'under_review').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    confirmed: applications.filter(app => app.status === 'confirmed').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    withdrawn: applications.filter(app => app.status === 'withdrawn').length,
  };

  const handleWithdraw = (applicationId: string) => {
    setConfirmWithdrawId(applicationId);
  };

  const handleWithdrawConfirm = async () => {
    if (!confirmWithdrawId) return;
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', confirmWithdrawId);
    if (error) {
      toast.error(`Erro ao cancelar candidatura: ${error.message}`);
      return;
    }
    toast.success('Candidatura cancelada.');
    setConfirmWithdrawId(null);
    setRefreshKey(key => key + 1);
    refreshProperties();
  };

  const handleConfirmStay = async () => {
    if (!confirmStayApp || !user) return;

    if (confirmStayApp.status !== 'accepted') {
      toast.error('Esta candidatura ainda não foi aceite.');
      setConfirmStayApp(null);
      return;
    }
    if (confirmStayApp.userId !== user.id) {
      toast.error('Apenas o estudante da candidatura pode confirmar a estadia.');
      setConfirmStayApp(null);
      return;
    }
    if (!confirmStayApp.propertyId || !confirmStayApp.landlordId) {
      toast.error('Candidatura sem imóvel ou senhorio associados.');
      setConfirmStayApp(null);
      return;
    }

    const { data: existing, error: dupError } = await supabase
      .from('active_homes')
      .select('id')
      .eq('student_id', user.id)
      .limit(1);
    if (dupError) {
      console.error('[ACTIVE_HOMES] dup check failed', dupError);
      toast.error('Não foi possível verificar a tua casa ativa.', { description: dupError.message });
      return;
    }
    if (existing && existing.length > 0) {
      toast.error('Já tens uma casa ativa.');
      setConfirmStayApp(null);
      setTimeout(() => navigate('/my-home'), 600);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token ?? publicAnonKey;
    const confirmRes = await fetch(
      `${supabaseUrl}/functions/v1/make-server-08c694dc/active-homes/confirm`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          applicationId: confirmStayApp.id,
          landlordId: confirmStayApp.landlordId,
          propertyId: confirmStayApp.propertyId,
          roomId: confirmStayApp.roomId || null,
          moveInDate: confirmStayApp.moveInDate
            ? new Date(confirmStayApp.moveInDate).toISOString().slice(0, 10)
            : null,
        }),
      }
    );
    const confirmData = await confirmRes.json();
    if (!confirmRes.ok) {
      if (confirmData?.error === 'already_has_active_home') {
        toast.error('Já tens uma casa ativa.');
        setConfirmStayApp(null);
        setTimeout(() => navigate('/my-home'), 600);
        return;
      }
      console.error('[ACTIVE_HOMES] confirm-stay failed', confirmData);
      toast.error('Não foi possível confirmar a estadia.', { description: confirmData?.error });
      return;
    }

    // Room status (occupied) and application status (confirmed) are both updated server-side
    // in /active-homes/confirm using the admin client, so no direct Supabase calls needed here.
    refreshProperties();
    toast.success('Estadia confirmada! Bem-vindo/a à tua nova casa.');
    setConfirmStayApp(null);
    setRefreshKey(key => key + 1);
    setTimeout(() => navigate('/my-home'), 900);
  };

  const handleContactLandlord = async (app: Application) => {
    const room = app.roomId ? getRoom(app.roomId) : undefined;
    const property = app.propertyId ? getProperty(app.propertyId) : undefined;

    if (!room || !property) {
      toast.info('Abre "Mensagens" para contactar o senhorio.');
      navigate('/messages');
      return;
    }

    const contextMsg =
      app.status === 'accepted'
        ? `Olá! A minha candidatura para ${room.title} foi aceite. Queria confirmar os próximos passos e a data de entrada.`
        : `Olá! Tenho uma candidatura ativa para ${room.title} e gostaria de esclarecer algumas dúvidas.`;

    try {
      const conversationId = await findOrCreateConversation({
        studentId: user?.id || '',
        studentName: user?.name || 'Estudante',
        landlordId: app.landlordId,
        landlordName: app.landlordName || 'Senhorio',
        roomId: room.id,
        propertyId: property.id,
        accommodationTitle: room.title,
        accommodationPrice: room.price,
        accommodationImage: room.images[0] || property.images[0] || '',
        initialMessage: contextMsg,
        initialSenderId: user?.id || '',
        initialSenderName: user?.name || 'Estudante',
      });
      navigate(`/messages?conversation=${conversationId}`);
    } catch (err) {
      console.error('[Applications] handleContactLandlord error', err);
      toast.error('Erro ao abrir conversa. Tenta novamente.');
    }
  };

  const handleViewTarget = (app: Application) => {
    if (app.roomId) {
      navigate(`/room/${app.roomId}`);
    } else {
      navigate(`/accommodation/${app.accommodationId}`);
    }
  };

  const handleViewProperty = (app: Application) => {
    if (app.propertyId) {
      navigate(`/property/${app.propertyId}`);
      return;
    }
    const room = app.roomId ? getRoom(app.roomId) : undefined;
    if (room) navigate(`/property/${room.propertyId}`);
  };

  const filterTabs: Array<{ key: 'all' | ApplicationStatus; label: string; count: number }> = [
    { key: 'all', label: 'Todas', count: counts.all },
    { key: 'pending', label: 'Pendentes', count: counts.pending },
    { key: 'under_review', label: 'Em análise', count: counts.under_review },
    { key: 'accepted', label: 'Aceites', count: counts.accepted },
    { key: 'confirmed', label: 'Confirmadas', count: counts.confirmed },
    { key: 'rejected', label: 'Recusadas', count: counts.rejected },
    { key: 'withdrawn', label: 'Canceladas', count: counts.withdrawn },
  ];

  const confirmRoom = confirmStayApp?.roomId ? getRoom(confirmStayApp.roomId) : undefined;
  const confirmProperty = confirmStayApp?.propertyId ? getProperty(confirmStayApp.propertyId) : undefined;

  const confirmDescription = confirmStayApp
    ? `Vais confirmar a estadia${
        confirmRoom ? ` no ${confirmRoom.title}` : ''
      }${
        confirmProperty ? ` em ${confirmProperty.title}` : ''
      }. O quarto passará para ocupado e a página "A Minha Casa" ficará ativa.`
    : '';

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">As Minhas Candidaturas</h1>
                  <p className="text-muted-foreground">
                    {applications.length === 0
                      ? 'Ainda não fizeste candidaturas'
                      : `${applications.length} ${applications.length === 1 ? 'candidatura' : 'candidaturas'}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 min-w-full lg:min-w-[420px]">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Ativas</p>
                <p className="text-2xl font-bold text-foreground">
                  {counts.pending + counts.under_review + counts.accepted}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Aceites</p>
                <p className="text-2xl font-bold text-green-700">{counts.accepted}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Confirmadas</p>
                <p className="text-2xl font-bold text-emerald-700">{counts.confirmed}</p>
              </Card>
            </div>
          </div>
        </div>

        {applications.length === 0 ? (
          <Card className="p-16 text-center">
            <Search className="w-14 h-14 text-gray-300 mx-auto mb-5" />
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Ainda não tens candidaturas
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Quando te candidatares a um quarto, poderás acompanhar o estado, falar com o senhorio e confirmar a estadia aqui.
            </p>
            <Button onClick={() => navigate('/search')}>
              <Search className="w-4 h-4 mr-2" />
              Procurar quartos
            </Button>
          </Card>
        ) : (
          <>
            <div className="mb-6 flex gap-1 border-b overflow-x-auto pb-px">
              {filterTabs
                .filter(tab => tab.count > 0 || tab.key === 'all')
                .map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap text-sm ${
                      filter === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                          filter === tab.key
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
            </div>

            {filteredApplications.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Nenhuma candidatura nesta categoria.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map(application => {
                  const room = application.roomId ? getRoom(application.roomId) : undefined;
                  const property = application.propertyId ? getProperty(application.propertyId) : room ? getProperty(room.propertyId) : undefined;
                  const images = room?.images.length ? room.images : property?.images || [];
                  const coverImage = images[0];
                  const title = room?.title || 'Quarto';
                  const propertyTitle = property?.title;
                  const city = property?.city || '';
                  const zone = property?.zone || '';
                  const price = room?.price || 0;
                  const utilities = room?.utilities || 0;
                  const totalPrice = price + utilities;
                  const timeline = buildTimeline(application);
                  const isAccepted = application.status === 'accepted';
                  const isConfirmed = application.status === 'confirmed';
                  const isCancelled = application.status === 'withdrawn' || application.status === 'rejected';
                  const nextStepText = getNextStepText(application);

                  return (
                    <Card
                      key={application.id}
                      className={`overflow-hidden transition-all ${getStatusBorder(application.status)}`}
                    >
                      {isAccepted && (
                        <div className="bg-green-50 border-b border-green-200 px-5 py-3 flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-semibold text-green-800">Candidatura aceite!</span>
                            <span className="text-sm text-green-700 ml-2">
                              Confirma a estadia para garantir o teu quarto.
                            </span>
                          </div>
                        </div>
                      )}

                      {isConfirmed && (
                        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-3 flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <span className="font-semibold text-emerald-800">
                            Estadia confirmada. Tens uma casa ativa!
                          </span>
                        </div>
                      )}

                      <div className={`grid grid-cols-1 ${coverImage ? 'md:grid-cols-[240px_1fr]' : ''}`}>
                        {coverImage && (
                          <button
                            type="button"
                            onClick={() => handleViewTarget(application)}
                            className="w-full h-56 md:h-full min-h-[260px] cursor-pointer overflow-hidden bg-muted text-left"
                          >
                            <img
                              src={coverImage}
                              alt={title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </button>
                        )}

                        <div className="p-5 min-w-0">
                          <div className="flex flex-row items-start justify-between gap-4 mb-4">
                            <div className="min-w-0 flex-1">
                              <button
                                onClick={() => handleViewTarget(application)}
                                className="text-xl font-bold text-foreground hover:text-primary text-left block line-clamp-1 mb-1"
                              >
                                {title}
                              </button>

                              {propertyTitle && (
                                <button
                                  type="button"
                                  onClick={() => handleViewProperty(application)}
                                  className="text-sm font-semibold text-primary hover:underline mb-1 block line-clamp-1"
                                >
                                  {propertyTitle}
                                </button>
                              )}

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                {(zone || city) && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    {zone}{zone && city ? ', ' : ''}{city}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays className="w-4 h-4" />
                                  Entrada: {fmtMonth(application.moveInDate)}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <Euro className="w-4 h-4" />
                                  €{totalPrice}/mês
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 w-fit ${
                                STATUS_COLOR[application.status]
                              }`}
                            >
                              {STATUS_LABEL[application.status]}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4 mb-4">
                            <div>
                              {application.message ? (
                                <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 mb-4">
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                                    Mensagem enviada
                                  </p>
                                  <p className="text-sm text-foreground italic line-clamp-3">
                                    "{application.message}"
                                  </p>
                                </div>
                              ) : (
                                <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 mb-4">
                                  <p className="text-sm text-muted-foreground">
                                    Não enviaste mensagem de apresentação nesta candidatura.
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl bg-muted/30 p-3">
                                  <p className="text-xs text-muted-foreground mb-1">Preço base</p>
                                  <p className="font-bold text-foreground">€{price}/mês</p>
                                </div>
                                <div className="rounded-xl bg-muted/30 p-3">
                                  <p className="text-xs text-muted-foreground mb-1">Despesas</p>
                                  <p className="font-bold text-foreground">
                                    {utilities > 0 ? `+€${utilities}` : 'Incluídas'}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-muted/30 p-3">
                                  <p className="text-xs text-muted-foreground mb-1">Próximo passo</p>
                                  <p className="font-bold text-foreground line-clamp-1">
                                    {application.status === 'accepted' ? 'Confirmar' : STATUS_LABEL[application.status]}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-4">
                              <p className="text-xs font-semibold text-muted-foreground mb-3">
                                Estado da candidatura
                              </p>
                              <div className="space-y-2">
                                {timeline.map((step, index) => {
                                  const Icon = step.icon;
                                  return (
                                    <div key={step.key} className="flex items-start gap-2.5">
                                      <div className="flex flex-col items-center flex-shrink-0">
                                        <div
                                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            step.done || step.pending ? step.bgColor : 'bg-gray-100'
                                          }`}
                                        >
                                          <Icon className={`w-3 h-3 ${step.color}`} />
                                        </div>
                                        {index < timeline.length - 1 && (
                                          <div
                                            className={`w-px flex-1 min-h-[12px] mt-0.5 ${
                                              step.done ? 'bg-border' : 'bg-gray-100'
                                            }`}
                                          />
                                        )}
                                      </div>
                                      <div className="pb-1.5 min-w-0">
                                        <span
                                          className={`text-xs font-medium ${
                                            step.pending ? 'text-gray-500' : 'text-foreground'
                                          }`}
                                        >
                                          {step.label}
                                        </span>
                                        {step.sublabel && (
                                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                            {step.sublabel}
                                          </p>
                                        )}
                                        {step.date && (
                                          <p className="text-[11px] text-muted-foreground">{step.date}</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 mb-4 flex items-start gap-3">
                            {application.status === 'accepted' ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : application.status === 'rejected' || application.status === 'withdrawn' ? (
                              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-sm font-semibold text-foreground">Próximo passo</p>
                              <p className="text-sm text-muted-foreground">{nextStepText}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {isAccepted && (
                              <Button
                                onClick={() => setConfirmStayApp(application)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Home className="w-4 h-4 mr-2" />
                                Confirmar estadia
                              </Button>
                            )}
                            {isConfirmed && (
                              <Button onClick={() => navigate('/my-home')} size="sm">
                                <Home className="w-4 h-4 mr-2" />
                                Ver a minha casa
                              </Button>
                            )}
                            {!isCancelled && !isConfirmed && (
                              <Button
                                onClick={() => void handleContactLandlord(application)}
                                variant="outline"
                                size="sm"
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Contactar senhorio
                              </Button>
                            )}
                            {room && (
                              <Button
                                onClick={() => handleViewTarget(application)}
                                variant="outline"
                                size="sm"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Ver quarto
                              </Button>
                            )}
                            {property && (
                              <Button
                                onClick={() => handleViewProperty(application)}
                                variant="outline"
                                size="sm"
                              >
                                <Building2 className="w-4 h-4 mr-2" />
                                Ver casa
                              </Button>
                            )}
                            {(application.status === 'pending' || application.status === 'under_review') && (
                              <Button
                                onClick={() => handleWithdraw(application.id)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar candidatura
                              </Button>
                            )}
                            {application.status === 'rejected' && (
                              <Button
                                onClick={() => navigate('/search')}
                                variant="outline"
                                size="sm"
                              >
                                <Search className="w-4 h-4 mr-2" />
                                Procurar similares
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmWithdrawId}
        onClose={() => setConfirmWithdrawId(null)}
        onConfirm={handleWithdrawConfirm}
        title="Cancelar candidatura?"
        description="Tens a certeza que queres cancelar esta candidatura? O senhorio deixará de a ver como ativa."
        cancelLabel="Manter candidatura"
        confirmLabel="Cancelar candidatura"
      />

      <ConfirmModal
        isOpen={!!confirmStayApp}
        onClose={() => setConfirmStayApp(null)}
        onConfirm={handleConfirmStay}
        title="Confirmar estadia?"
        description={confirmDescription}
        cancelLabel="Ainda não"
        confirmLabel="Confirmar estadia"
      />
    </div>
  );
}

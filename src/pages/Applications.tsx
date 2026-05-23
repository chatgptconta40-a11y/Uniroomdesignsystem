import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { getApplicationsForUser, confirmStay } from '../data/mockApplications';
import { cancelUnifiedApplication } from '../data/unifiedApplications';
import { findOrCreateRoomConversation } from '../data/mockMessages';
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

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TimelineStep {
  key: string;
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  date?: string;
  color: string;
  bgColor: string;
  done: boolean;
  pending?: boolean;
}

function buildTimeline(app: Application): TimelineStep[] {
  const steps: TimelineStep[] = [];

  steps.push({
    key: 'sent',
    icon: Send,
    label: 'Candidatura enviada',
    date: fmt(app.createdAt),
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    done: true,
  });

  const isReviewing = ['under_review', 'accepted', 'confirmed', 'rejected'].includes(app.status);

  steps.push({
    key: 'review',
    icon: Clock,
    label: isReviewing ? 'Em análise pelo senhorio' : 'Aguarda análise',
    date: isReviewing ? fmt(app.reviewedAt || app.updatedAt) : undefined,
    color: isReviewing ? 'text-amber-600' : 'text-gray-300',
    bgColor: isReviewing ? 'bg-amber-100' : 'bg-gray-100',
    done: isReviewing,
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
      label: 'Aceite pelo senhorio!',
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
      color: 'text-gray-400',
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
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      done: true,
    });
  } else if (app.status === 'accepted') {
    steps.push({
      key: 'confirm_pending',
      icon: ArrowRight,
      label: 'A aguardar a tua confirmação',
      color: 'text-gray-400',
      bgColor: 'bg-gray-100',
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
  pending: 'bg-gray-100 text-gray-600',
  under_review: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  withdrawn: 'bg-gray-100 text-gray-400',
  confirmed: 'bg-emerald-100 text-emerald-700',
};

export function Applications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getRoom, getProperty, refreshProperties } = useProperties();

  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null);
  const [confirmStayApp, setConfirmStayApp] = useState<Application | null>(null);

  const applications = useMemo(
    () =>
      getApplicationsForUser(user?.id || '').sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [user?.id, refreshKey],
  );

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

  const handleWithdrawConfirm = () => {
    if (!confirmWithdrawId) return;

    cancelUnifiedApplication(confirmWithdrawId);
    toast.success('Candidatura cancelada.');
    setConfirmWithdrawId(null);
    setRefreshKey(key => key + 1);
    refreshProperties();
  };

  const handleConfirmStay = () => {
    if (!confirmStayApp) return;

    const home = confirmStay(confirmStayApp.id);

    if (home) {
      toast.success('Estadia confirmada! Bem-vindo/a à tua nova casa.');
      setConfirmStayApp(null);
      setRefreshKey(key => key + 1);
      refreshProperties();
      setTimeout(() => navigate('/my-home'), 900);
    } else {
      toast.error('Não foi possível confirmar a estadia.');
      setConfirmStayApp(null);
      refreshProperties();
    }
  };

  const handleContactLandlord = (app: Application) => {
    const room = app.roomId ? getRoom(app.roomId) : undefined;
    const property = app.propertyId ? getProperty(app.propertyId) : undefined;

    if (!room || !property) {
      toast.info('Abre “Mensagens” para contactar o senhorio.');
      navigate('/messages');
      return;
    }

    const contextMsg =
      app.status === 'accepted'
        ? `Olá! A minha candidatura para ${room.title} foi aceite. Queria confirmar os próximos passos e a data de entrada.`
        : `Olá! Tenho uma candidatura ativa para ${room.title} e gostaria de esclarecer algumas dúvidas.`;

    const conversation = findOrCreateRoomConversation(
      user?.id || '',
      user?.name || 'Estudante',
      'student',
      app.landlordId,
      app.landlordName || 'Senhorio',
      room.id,
      property.id,
      room.title,
      room.price,
      room.images[0] || property.images[0] || '',
      contextMsg,
    );

    navigate(`/messages?conversation=${conversation.id}`);
  };

  const handleViewTarget = (app: Application) => {
    if (app.roomId) {
      navigate(`/room/${app.roomId}`);
    } else {
      navigate(`/accommodation/${app.accommodationId}`);
    }
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
      }. O quarto passará para ocupado e a página “A Minha Casa” ficará ativa.`
    : '';

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">As Minhas Candidaturas</h1>
          </div>
          <p className="text-muted-foreground">
            {applications.length === 0
              ? 'Ainda não fizeste candidaturas'
              : `${applications.length} ${applications.length === 1 ? 'candidatura' : 'candidaturas'}`}
          </p>
        </div>

        {applications.length === 0 ? (
          <Card className="p-16 text-center">
            <Search className="w-14 h-14 text-gray-300 mx-auto mb-5" />
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Ainda não tens candidaturas
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Quando te candidatares a um quarto, poderás acompanhar o estado e gerir tudo aqui.
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
              <div className="space-y-5">
                {filteredApplications.map(application => {
                  const room = application.roomId ? getRoom(application.roomId) : undefined;
                  const property = application.propertyId ? getProperty(application.propertyId) : undefined;
                  const images = room?.images.length ? room.images : property?.images || [];
                  const coverImage = images[0];
                  const title = room?.title || application.accommodationId || 'Quarto';
                  const propertyTitle = property?.title;
                  const city = property?.city || '';
                  const zone = property?.zone || '';
                  const price = room?.price || 0;
                  const timeline = buildTimeline(application);
                  const isAccepted = application.status === 'accepted';
                  const isConfirmed = application.status === 'confirmed';
                  const isCancelled = application.status === 'withdrawn' || application.status === 'rejected';

                  return (
                    <Card
                      key={application.id}
                      className={`overflow-hidden transition-all ${
                        isAccepted ? 'ring-2 ring-green-400 border-green-200' : ''
                      }`}
                    >
                      {isAccepted && (
                        <div className="bg-green-50 border-b border-green-200 px-6 py-3 flex items-center gap-3">
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
                        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <span className="font-semibold text-emerald-800">
                            Estadia confirmada. Tens uma casa ativa!
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col md:flex-row">
                        {coverImage && (
                          <div
                            onClick={() => handleViewTarget(application)}
                            className="w-full md:w-52 h-44 md:h-auto flex-shrink-0 cursor-pointer overflow-hidden bg-muted"
                          >
                            <img
                              src={coverImage}
                              alt={title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        )}

                        <div className="flex-1 p-5 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={() => handleViewTarget(application)}
                                className="font-semibold text-foreground hover:text-primary text-left block truncate mb-0.5"
                              >
                                {title}
                              </button>

                              {propertyTitle && (
                                <p className="text-xs font-medium text-primary mb-1 truncate">
                                  {propertyTitle}
                                </p>
                              )}

                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">
                                  {zone}
                                  {zone && city ? ', ' : ''}
                                  {city}
                                </span>
                              </div>

                              <div className="flex items-baseline gap-1.5 mt-1.5">
                                <span className="text-xl font-bold text-foreground">€{price}</span>
                                <span className="text-xs text-muted-foreground">/mês</span>
                                {application.moveInDate && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    · Entrada:{' '}
                                    {new Date(application.moveInDate).toLocaleDateString('pt-PT', {
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                                STATUS_COLOR[application.status]
                              }`}
                            >
                              {STATUS_LABEL[application.status]}
                            </span>
                          </div>

                          {application.message && (
                            <p className="text-xs text-muted-foreground italic line-clamp-2 mb-3 bg-muted/40 rounded-lg px-3 py-2">
                              “{application.message}”
                            </p>
                          )}

                          <div className="mb-4 space-y-2">
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
                                        className={`w-px flex-1 min-h-[8px] mt-0.5 ${
                                          step.done ? 'bg-border' : 'bg-gray-100'
                                        }`}
                                      />
                                    )}
                                  </div>

                                  <div className="pb-1.5 min-w-0">
                                    <span
                                      className={`text-xs font-medium ${
                                        step.pending ? 'text-gray-400' : 'text-foreground'
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
                                onClick={() => handleContactLandlord(application)}
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
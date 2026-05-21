import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { FileText, MapPin, Calendar, MessageCircle, ExternalLink, XCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApplicationsForUser, withdrawApplication } from '../data/mockApplications';
import { mockAccommodations } from '../data/mockAccommodations';
import { getRoom, getProperty } from '../data/mockProperties';
import { Application, ApplicationStatus } from '../types/accommodation';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { toast } from 'sonner';

export function Applications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');

  const applications = getApplicationsForUser(user?.id || '');

  const filteredApplications = useMemo(() => {
    if (filter === 'all') return applications;
    return applications.filter(app => app.status === filter);
  }, [applications, filter]);

  const counts = {
    all: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    under_review: applications.filter(app => app.status === 'under_review').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  const getStatusConfig = (status: ApplicationStatus) => {
    const configs = {
      pending: {
        label: 'Pendente',
        color: 'bg-muted text-muted-foreground',
        icon: Clock,
        iconColor: 'text-muted-foreground',
      },
      under_review: {
        label: 'Em Análise',
        color: 'bg-blue-100 text-blue-700',
        icon: AlertCircle,
        iconColor: 'text-blue-500',
      },
      accepted: {
        label: 'Aceite',
        color: 'bg-green-100 text-green-700',
        icon: CheckCircle,
        iconColor: 'text-green-500',
      },
      rejected: {
        label: 'Rejeitada',
        color: 'bg-red-100 text-red-700',
        icon: XCircle,
        iconColor: 'text-red-500',
      },
      withdrawn: {
        label: 'Cancelada',
        color: 'bg-muted text-muted-foreground',
        icon: XCircle,
        iconColor: 'text-muted-foreground',
      },
    };
    return configs[status];
  };

  const handleWithdraw = (applicationId: string) => {
    if (window.confirm('Tens a certeza que queres cancelar esta candidatura?')) {
      withdrawApplication(applicationId);
      toast.success('Candidatura cancelada');
    }
  };

  const handleViewAccommodation = (accommodationId: string) => {
    navigate(`/accommodation/${accommodationId}`);
  };

  const handleViewApplicationTarget = (application: Application) => {
    if (application.roomId) {
      navigate(`/room/${application.roomId}`);
      return;
    }
    handleViewAccommodation(application.accommodationId);
  };

  const handleContact = () => {
    toast.info('Funcionalidade de mensagens em breve!');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
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
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Ainda não tens candidaturas
            </h2>
            <p className="text-muted-foreground mb-6">
              Quando te candidatares a um alojamento, poderás acompanhar o estado aqui.
            </p>
            <Button onClick={() => navigate('/search')}>
              Procurar Alojamento
            </Button>
          </Card>
        ) : (
          <>
            <div className="mb-6 flex gap-2 border-b overflow-x-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
                  filter === 'all'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Todas
                <Badge variant="outline" className="ml-2">
                  {counts.all}
                </Badge>
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
                  filter === 'pending'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Pendentes
                <Badge variant="outline" className="ml-2">
                  {counts.pending}
                </Badge>
              </button>
              <button
                onClick={() => setFilter('under_review')}
                className={`px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
                  filter === 'under_review'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Em Análise
                <Badge variant="outline" className="ml-2">
                  {counts.under_review}
                </Badge>
              </button>
              <button
                onClick={() => setFilter('accepted')}
                className={`px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
                  filter === 'accepted'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Aceites
                <Badge variant="outline" className="ml-2">
                  {counts.accepted}
                </Badge>
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
                  filter === 'rejected'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Rejeitadas
                <Badge variant="outline" className="ml-2">
                  {counts.rejected}
                </Badge>
              </button>
            </div>

            {filteredApplications.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  Nenhuma candidatura nesta categoria.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map(application => {
                  const room = application.roomId ? getRoom(application.roomId) : null;
                  const property = room ? getProperty(room.propertyId) : null;
                  const accommodation = mockAccommodations.find(
                    acc => acc.id === application.accommodationId
                  );
                  const target = room && property
                    ? {
                        id: room.id,
                        title: room.title,
                        images: room.images.length > 0 ? room.images : property.images,
                        zone: property.zone,
                        city: property.city,
                        price: room.price,
                        isRoom: true,
                        propertyTitle: property.title,
                      }
                    : accommodation
                      ? {
                          id: accommodation.id,
                          title: accommodation.title,
                          images: accommodation.images,
                          zone: accommodation.zone,
                          city: accommodation.city,
                          price: accommodation.price,
                          isRoom: false,
                          propertyTitle: '',
                        }
                      : null;
                  if (!target) return null;

                  const statusConfig = getStatusConfig(application.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <Card key={application.id} hover className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div
                          onClick={() => handleViewApplicationTarget(application)}
                          className="w-full md:w-48 h-48 md:h-auto rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer group"
                        >
                          <img
                            src={target.images[0]}
                            alt={target.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3
                                onClick={() => handleViewApplicationTarget(application)}
                                className="font-semibold text-foreground mb-1 hover:text-primary cursor-pointer"
                              >
                                {target.title}
                              </h3>
                              {target.propertyTitle && (
                                <p className="text-xs font-medium text-primary mb-1">
                                  Casa: {target.propertyTitle}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                <MapPin className="w-4 h-4" />
                                <span>{target.zone}, {target.city}</span>
                              </div>
                              <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-2xl font-bold text-foreground">
                                  €{target.price}
                                </span>
                                <span className="text-sm text-muted-foreground">/mês</span>
                              </div>
                            </div>

                            <div className={`px-3 py-1 rounded-full font-medium text-sm flex items-center gap-2 ${statusConfig.color}`}>
                              <StatusIcon className={`w-4 h-4 ${statusConfig.iconColor}`} />
                              {statusConfig.label}
                            </div>
                          </div>

                          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Candidatura: {new Date(application.createdAt).toLocaleDateString('pt-PT')}
                                </span>
                              </div>
                              {application.reviewedAt && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-muted-foreground">
                                    Resposta: {new Date(application.reviewedAt).toLocaleDateString('pt-PT')}
                                  </span>
                                </>
                              )}
                              {application.moveInDate && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-muted-foreground">
                                    Entrada prevista: {new Date(application.moveInDate).toLocaleDateString('pt-PT')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {application.message && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground line-clamp-2 italic">
                                "{application.message}"
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => handleViewApplicationTarget(application)}
                              variant="outline"
                              size="sm"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Ver {target.isRoom ? 'Quarto' : 'Alojamento'}
                            </Button>

                            {application.status === 'accepted' && (
                              <Button onClick={handleContact} size="sm">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Contactar Senhorio
                              </Button>
                            )}

                            {(application.status === 'pending' || application.status === 'under_review') && (
                              <Button
                                onClick={() => handleWithdraw(application.id)}
                                variant="outline"
                                size="sm"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar Candidatura
                              </Button>
                            )}

                            {application.status === 'rejected' && (
                              <Button onClick={() => navigate('/search')} variant="outline" size="sm">
                                Procurar Similares
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
    </div>
  );
}
import { useState } from 'react';
import { Wrench, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getMaintenanceRequestsForLandlord,
  updateMaintenanceStatus,
  getMaintenanceStats,
} from '../data/mockMaintenance';
import {
  MaintenanceStatus,
  maintenanceCategoryLabels,
  maintenanceStatusLabels,
  maintenanceUrgencyLabels,
} from '../types/maintenance';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { mockAccommodations } from '../data/mockAccommodations';
import { toast } from 'sonner';

export function LandlordMaintenance() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | MaintenanceStatus | 'high_urgency'>('all');

  const allRequests = getMaintenanceRequestsForLandlord(user?.id || '');
  const stats = getMaintenanceStats(user?.id || '');

  const filteredRequests = filter === 'all'
    ? allRequests
    : filter === 'high_urgency'
    ? allRequests.filter(request => request.urgency === 'high')
    : allRequests.filter(request => request.status === filter);

  const handleUpdateStatus = (requestId: string, status: MaintenanceStatus, title: string) => {
    if (updateMaintenanceStatus(requestId, status)) {
      toast.success(`Estado atualizado: ${title}`, {
        description: maintenanceStatusLabels[status],
      });

      window.location.reload();
    }
  };

  const getAccommodationTitle = (accommodationId: string) => {
    const accommodation = mockAccommodations.find(item => item.id === accommodationId);
    return accommodation?.title || 'Alojamento';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-destructive bg-destructive/10 border-destructive';
      case 'medium':
        return 'text-accent bg-accent/10 border-accent';
      default:
        return 'text-secondary bg-secondary/10 border-secondary';
    }
  };

  const getEmptyStateText = () => {
    if (filter === 'all') {
      return 'Ainda não recebeste pedidos de manutenção.';
    }

    if (filter === 'high_urgency') {
      return 'Não tens pedidos urgentes neste momento.';
    }

    return `Não tens pedidos ${maintenanceStatusLabels[filter]?.toLowerCase()}.`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-accent" />
            </div>

            <div>
              <h1 className="text-3xl font-bold">Pedidos de Manutenção</h1>
              <p className="text-muted-foreground">
                Gere os problemas reportados nos teus alojamentos
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card
            className={`p-6 cursor-pointer transition-all ${
              filter === 'all' ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('all')}
          >
            <p className="text-sm font-semibold text-muted-foreground mb-2">Total</p>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </Card>

          <Card
            className={`p-6 cursor-pointer transition-all ${
              filter === 'pending' ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('pending')}
          >
            <p className="text-sm font-semibold text-muted-foreground mb-2">Pendentes</p>
            <p className="text-3xl font-bold text-accent">{stats.pending}</p>
          </Card>

          <Card
            className={`p-6 cursor-pointer transition-all ${
              filter === 'in_progress' ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('in_progress')}
          >
            <p className="text-sm font-semibold text-muted-foreground mb-2">Em resolução</p>
            <p className="text-3xl font-bold text-primary">{stats.inProgress}</p>
          </Card>

          <Card
            className={`p-6 cursor-pointer transition-all ${
              filter === 'resolved' ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('resolved')}
          >
            <p className="text-sm font-semibold text-muted-foreground mb-2">Resolvidos</p>
            <p className="text-3xl font-bold text-secondary">{stats.resolved}</p>
          </Card>

          <Card
            className={`p-6 cursor-pointer transition-all bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20 ${
              filter === 'high_urgency' ? 'ring-2 ring-destructive shadow-md' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('high_urgency')}
          >
            <p className="text-sm font-semibold text-muted-foreground mb-2">Urgentes</p>
            <p className="text-3xl font-bold text-destructive">{stats.highUrgency}</p>
          </Card>
        </div>

        {filteredRequests.length === 0 ? (
          <Card className="p-16 text-center">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wrench className="w-10 h-10 text-accent" />
            </div>

            <h2 className="text-2xl font-bold mb-3">
              Sem pedidos de manutenção
            </h2>

            <p className="text-muted-foreground">
              {getEmptyStateText()}
            </p>
          </Card>
        ) : (
          <div className="space-y-5">
            {filteredRequests.map(request => (
              <Card key={request.id} className="p-8 hover:shadow-lg transition-all">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-foreground">{request.title}</h3>
                          <Badge
                            variant={
                              request.status === 'resolved' || request.status === 'closed'
                                ? 'success'
                                : request.status === 'in_progress'
                                ? 'default'
                                : 'warning'
                            }
                          >
                            {maintenanceStatusLabels[request.status]}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Badge variant="outline" className={getUrgencyColor(request.urgency)}>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {maintenanceUrgencyLabels[request.urgency]}
                          </Badge>

                          <Badge variant="outline">
                            {maintenanceCategoryLabels[request.category]}
                          </Badge>

                          <Badge variant="outline">
                            {getAccommodationTitle(request.accommodationId)}
                          </Badge>
                        </div>

                        <p className="text-muted-foreground mb-4 leading-relaxed">
                          {request.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>
                              Reportado há{' '}
                              {Math.floor(
                                (new Date().getTime() - new Date(request.createdAt).getTime())
                                  / (1000 * 60 * 60 * 24),
                              )}{' '}
                              dias
                            </span>
                          </div>

                          {request.resolvedAt && (
                            <div className="flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-secondary" />
                              <span>
                                Resolvido há{' '}
                                {Math.floor(
                                  (new Date().getTime() - new Date(request.resolvedAt).getTime())
                                    / (1000 * 60 * 60 * 24),
                                )}{' '}
                                dias
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:w-56">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Alterar estado</p>

                    {request.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus(request.id, 'received', request.title)}
                          className="w-full"
                        >
                          Marcar como recebido
                        </Button>

                        <Button
                          variant="primary"
                          onClick={() => handleUpdateStatus(request.id, 'in_progress', request.title)}
                          className="w-full"
                        >
                          Iniciar resolução
                        </Button>
                      </>
                    )}

                    {request.status === 'received' && (
                      <Button
                        variant="primary"
                        onClick={() => handleUpdateStatus(request.id, 'in_progress', request.title)}
                        className="w-full"
                      >
                        Iniciar resolução
                      </Button>
                    )}

                    {request.status === 'in_progress' && (
                      <Button
                        variant="secondary"
                        onClick={() => handleUpdateStatus(request.id, 'resolved', request.title)}
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar como resolvido
                      </Button>
                    )}

                    {request.status === 'resolved' && (
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(request.id, 'closed', request.title)}
                        className="w-full"
                      >
                        Fechar pedido
                      </Button>
                    )}

                    {request.status === 'closed' && (
                      <Badge variant="success" className="w-full justify-center py-2">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Fechado
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
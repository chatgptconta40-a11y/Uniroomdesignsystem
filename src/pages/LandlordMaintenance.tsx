import { useState } from 'react';
import { Wrench, AlertCircle, Clock, CheckCircle, ArrowUpCircle } from 'lucide-react';
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

const URGENCY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
const STATUS_ORDER: Record<string, number> = { pending: 0, received: 1, in_progress: 2, resolved: 3, closed: 4 };

export function LandlordMaintenance() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | MaintenanceStatus | 'high_urgency'>('all');
  const [_version, setVersion] = useState(0);

  const allRequests = getMaintenanceRequestsForLandlord(user?.id || '');
  const stats = getMaintenanceStats(user?.id || '');

  const baseFiltered = filter === 'all'
    ? allRequests
    : filter === 'high_urgency'
    ? allRequests.filter(request => request.urgency === 'high')
    : allRequests.filter(request => request.status === filter);

  const filteredRequests = [...baseFiltered].sort((a, b) => {
    const urgencyDiff = (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9);
    if (urgencyDiff !== 0) return urgencyDiff;
    return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
  });

  const handleUpdateStatus = (requestId: string, status: MaintenanceStatus, title: string) => {
    if (updateMaintenanceStatus(requestId, status)) {
      toast.success(`Estado atualizado: ${title}`, {
        description: maintenanceStatusLabels[status],
      });
      setVersion(v => v + 1);
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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { key: 'all' as const, label: 'Total', value: stats.total, valueClass: 'text-foreground' },
            { key: 'pending' as const, label: 'Pendentes', value: stats.pending, valueClass: 'text-accent' },
            { key: 'in_progress' as const, label: 'Em resolução', value: stats.inProgress, valueClass: 'text-primary' },
            { key: 'resolved' as const, label: 'Resolvidos', value: stats.resolved, valueClass: 'text-secondary' },
            { key: 'high_urgency' as const, label: 'Urgentes', value: stats.highUrgency, valueClass: 'text-destructive', urgent: true },
          ].map(stat => (
            <Card
              key={stat.key}
              className={`p-4 cursor-pointer transition-all ${
                filter === stat.key
                  ? stat.urgent ? 'ring-2 ring-destructive shadow-md' : 'ring-2 ring-primary shadow-md'
                  : 'hover:shadow-md'
              } ${stat.urgent ? 'bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20' : ''}`}
              onClick={() => setFilter(stat.key)}
            >
              <p className="text-xs font-semibold text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.valueClass}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              {filter === 'high_urgency'
                ? <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
                : <Wrench className="w-8 h-8 text-muted-foreground/40" />
              }
            </div>
            <h2 className="text-lg font-semibold mb-2">
              {filter === 'all' ? 'Sem pedidos de manutenção' : 'Sem pedidos nesta categoria'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {getEmptyStateText()}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Ver todos os pedidos
              </button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map(request => (
              <Card
                key={request.id}
                className={`p-5 hover:shadow-md transition-all ${
                  request.urgency === 'high' && request.status !== 'resolved' && request.status !== 'closed'
                    ? 'border-l-4 border-l-red-400'
                    : request.urgency === 'medium' && request.status !== 'resolved' && request.status !== 'closed'
                    ? 'border-l-4 border-l-amber-400'
                    : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      {request.urgency === 'high' && request.status !== 'resolved' && request.status !== 'closed' && (
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ArrowUpCircle className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-semibold text-foreground">{request.title}</h3>
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
                          <Badge variant="outline" className={getUrgencyColor(request.urgency)}>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {maintenanceUrgencyLabels[request.urgency]}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {maintenanceCategoryLabels[request.category]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getAccommodationTitle(request.accommodationId)}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">
                          {request.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
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
                              <CheckCircle className="w-3.5 h-3.5 text-secondary" />
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

                  <div className="flex flex-col gap-2 lg:w-48 lg:flex-shrink-0">
                    <p className="text-xs font-semibold text-muted-foreground">Alterar estado</p>

                    {request.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(request.id, 'received', request.title)}
                          className="w-full"
                        >
                          Marcar como recebido
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
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
                        size="sm"
                        onClick={() => handleUpdateStatus(request.id, 'in_progress', request.title)}
                        className="w-full"
                      >
                        Iniciar resolução
                      </Button>
                    )}

                    {request.status === 'in_progress' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(request.id, 'resolved', request.title)}
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Marcar como resolvido
                      </Button>
                    )}

                    {request.status === 'resolved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(request.id, 'closed', request.title)}
                        className="w-full"
                      >
                        Fechar pedido
                      </Button>
                    )}

                    {request.status === 'closed' && (
                      <div className="flex items-center gap-1.5 text-sm text-secondary font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Fechado
                      </div>
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
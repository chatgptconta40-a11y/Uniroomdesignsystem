import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CalendarCheck,
  MapPin,
  ExternalLink,
  XCircle,
  CheckCircle,
  Search,
} from 'lucide-react';
import { useProperties } from '../context/PropertiesContext';
import { useVisitRequests } from '../hooks/useVisitRequests';
import type { VisitRequestStatus } from '../types/accommodation';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ConfirmModal } from '../components/ConfirmModal';
import { toast } from 'sonner';

const VISIT_STATUS_LABEL: Record<VisitRequestStatus, string> = {
  pending: 'Aguarda resposta',
  accepted: 'Confirmada',
  rejected: 'Recusada',
  counter_proposed: 'Nova data proposta',
  cancelled: 'Cancelada',
  completed: 'Realizada',
};

const VISIT_STATUS_COLOR: Record<VisitRequestStatus, string> = {
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  counter_proposed: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function fmtDatetime(d: Date): string {
  return (
    d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) +
    ' às ' +
    d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  );
}

export function StudentVisitRequests() {
  const navigate = useNavigate();
  const { getRoom, getProperty } = useProperties();
  const [confirmCancelVisitId, setConfirmCancelVisitId] = useState<string | null>(null);

  const { visitRequests, loading, cancelVisitRequest, acceptVisitRequest } = useVisitRequests();

  const handleCancelVisit = async () => {
    if (!confirmCancelVisitId) return;
    const ok = await cancelVisitRequest(confirmCancelVisitId);
    if (ok) toast.success('Pedido de visita cancelado.');
    else toast.error('Não foi possível cancelar. Tenta novamente.');
    setConfirmCancelVisitId(null);
  };

  const handleAcceptCounter = async (id: string, proposedAt?: Date) => {
    const ok = await acceptVisitRequest(id, undefined, proposedAt);
    if (ok) toast.success('Data aceite! O senhorio foi notificado.');
    else toast.error('Não foi possível aceitar. Tenta novamente.');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pedidos de Visita</h1>
              <p className="text-muted-foreground">
                Acompanha as visitas que pediste antes de te candidatares.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">A carregar pedidos de visita…</p>
          </Card>
        ) : visitRequests.length === 0 ? (
          <Card className="p-16 text-center">
            <CalendarCheck className="w-14 h-14 text-gray-300 mx-auto mb-5" />
            <h2 className="text-xl font-semibold text-foreground mb-3">Sem pedidos de visita</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Quando pedires uma visita a um quarto antes de te candidatares, os pedidos aparecerão aqui.
            </p>
            <Button onClick={() => navigate('/search')}>
              <Search className="w-4 h-4 mr-2" />
              Procurar quartos
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {visitRequests.map(req => {
              const room = req.roomId ? getRoom(req.roomId) : undefined;
              const property = req.propertyId
                ? getProperty(req.propertyId)
                : room ? getProperty(room.propertyId) : undefined;
              const coverImage = room?.images[0] || property?.images[0];
              const roomTitle = room?.title || 'Quarto';
              const propTitle = property?.title;
              const city = property?.city || '';
              const zone = property?.zone || '';
              const isCounterProposed = req.status === 'counter_proposed';
              const isActive = !['cancelled', 'rejected', 'completed'].includes(req.status);
              const dateToShow = isCounterProposed && req.proposedAt ? req.proposedAt : req.requestedAt;
              const dateLabel = isCounterProposed && req.proposedAt ? 'Data proposta pelo senhorio' : 'Data pedida';

              return (
                <Card
                  key={req.id}
                  className={`overflow-hidden ${isCounterProposed ? 'ring-2 ring-amber-300 border-amber-200' : ''}`}
                >
                  {isCounterProposed && (
                    <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center gap-3">
                      <CalendarCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold text-amber-800">O senhorio propôs uma nova data.</span>
                        <span className="text-sm text-amber-700 ml-2">Aceita ou cancela o pedido.</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
                    {coverImage && (
                      <button
                        type="button"
                        onClick={() => room && navigate(`/room/${room.id}`)}
                        className="w-full h-48 md:h-full min-h-[200px] overflow-hidden bg-muted cursor-pointer"
                      >
                        <img
                          src={coverImage}
                          alt={roomTitle}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </button>
                    )}

                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                        <div>
                          <button
                            onClick={() => room && navigate(`/room/${room.id}`)}
                            className="text-lg font-bold text-foreground hover:text-primary text-left block mb-1"
                          >
                            {roomTitle}
                          </button>
                          {propTitle && (
                            <p className="text-sm font-semibold text-primary mb-1">{propTitle}</p>
                          )}
                          {(zone || city) && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {zone}{zone && city ? ', ' : ''}{city}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 ${VISIT_STATUS_COLOR[req.status]}`}>
                          {VISIT_STATUS_LABEL[req.status]}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="rounded-xl bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground mb-1">{dateLabel}</p>
                          <p className="text-sm font-semibold">{fmtDatetime(dateToShow)}</p>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Pedido em</p>
                          <p className="text-sm font-semibold">{req.createdAt.toLocaleDateString('pt-PT')}</p>
                        </div>
                      </div>

                      {req.studentMessage && (
                        <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 mb-4">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Mensagem enviada</p>
                          <p className="text-sm text-foreground italic">"{req.studentMessage}"</p>
                        </div>
                      )}

                      {req.landlordMessage && (
                        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 mb-4">
                          <p className="text-xs font-semibold text-blue-700 mb-1">Resposta do senhorio</p>
                          <p className="text-sm text-blue-900">"{req.landlordMessage}"</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {isCounterProposed && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => void handleAcceptCounter(req.id, req.proposedAt)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aceitar nova data
                          </Button>
                        )}
                        {room && (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/room/${room.id}`)}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver quarto
                          </Button>
                        )}
                        {isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setConfirmCancelVisitId(req.id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar pedido
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
      </div>

      <ConfirmModal
        isOpen={!!confirmCancelVisitId}
        onClose={() => setConfirmCancelVisitId(null)}
        onConfirm={() => void handleCancelVisit()}
        title="Cancelar pedido de visita?"
        description="Tens a certeza que queres cancelar este pedido de visita?"
        cancelLabel="Manter pedido"
        confirmLabel="Cancelar pedido"
      />
    </div>
  );
}

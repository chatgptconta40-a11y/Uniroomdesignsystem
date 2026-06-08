import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  CalendarCheck,
  MapPin,
  ExternalLink,
  XCircle,
  CheckCircle,
  Search,
  CalendarDays,
  Calendar,
  Clock,
  Sparkles,
  MessageCircle,
  User,
  Mail,
} from 'lucide-react';
import { useProperties } from '../context/PropertiesContext';
import { useVisitRequests } from '../hooks/useVisitRequests';
import { supabase } from '../lib/supabase';
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

type FilterStatus = 'active' | VisitRequestStatus;

export function StudentVisitRequests() {
  const navigate = useNavigate();
  const { getRoom, getProperty } = useProperties();
  const [confirmCancelVisitId, setConfirmCancelVisitId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('active');
  const [landlordProfiles, setLandlordProfiles] = useState<Record<string, { name?: string; email?: string }>>({});

  const { visitRequests, loading, cancelVisitRequest, acceptVisitRequest } = useVisitRequests();

  useEffect(() => {
    const ids = [...new Set(visitRequests.map(r => r.landlordId).filter(Boolean) as string[])];
    if (ids.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', ids);
      if (data) {
        const map: Record<string, { name?: string; email?: string }> = {};
        for (const row of data) map[row.id] = { name: row.name ?? undefined, email: row.email ?? undefined };
        setLandlordProfiles(map);
      }
    })();
  }, [visitRequests]);

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

  const ACTIVE_STATUSES: VisitRequestStatus[] = ['pending', 'counter_proposed', 'accepted'];

  const filtered = visitRequests.filter(r =>
    statusFilter === 'active' ? ACTIVE_STATUSES.includes(r.status) : r.status === statusFilter
  );

  const count = (s: VisitRequestStatus) => visitRequests.filter(r => r.status === s).length;
  const activeCount = visitRequests.filter(r => ACTIVE_STATUSES.includes(r.status)).length;

  const filterTabs: Array<{ key: FilterStatus; label: string; count: number }> = [
    { key: 'active', label: 'Ativos', count: activeCount },
    { key: 'pending', label: 'Pendentes', count: count('pending') },
    { key: 'counter_proposed', label: 'Contrapropostas', count: count('counter_proposed') },
    { key: 'accepted', label: 'Confirmadas', count: count('accepted') },
    { key: 'completed', label: 'Realizadas', count: count('completed') },
    { key: 'rejected', label: 'Recusadas', count: count('rejected') },
    { key: 'cancelled', label: 'Canceladas', count: count('cancelled') },
  ].filter(t => t.key === 'active' || t.count > 0);

  const getStatusBorder = (s: VisitRequestStatus): string => {
    if (s === 'counter_proposed') return 'ring-2 ring-amber-300 border-amber-200';
    if (s === 'accepted') return 'ring-2 ring-green-200 border-green-200';
    if (s === 'pending') return 'ring-2 ring-blue-200 border-blue-200';
    if (s === 'completed') return 'border-emerald-200';
    if (s === 'rejected') return 'border-red-200';
    return '';
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Pedidos de Visita</h1>
                <p className="text-muted-foreground">
                  {loading
                    ? 'A carregar…'
                    : visitRequests.length === 0
                    ? 'Ainda não pediste visitas'
                    : `${visitRequests.length} ${visitRequests.length === 1 ? 'pedido' : 'pedidos'} no total`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 min-w-full lg:min-w-[420px]">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Pendentes</p>
                <p className="text-2xl font-bold text-blue-700">{count('pending')}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Confirmadas</p>
                <p className="text-2xl font-bold text-green-700">{count('accepted')}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Realizadas</p>
                <p className="text-2xl font-bold text-emerald-700">{count('completed')}</p>
              </Card>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        {visitRequests.length > 0 && (
          <div className="mb-6 flex gap-1 border-b overflow-x-auto pb-px">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-all ${
                  statusFilter === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
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
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum pedido nesta categoria.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(req => {
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
              const isPending = req.status === 'pending';
              const isAccepted = req.status === 'accepted';
              const isActive = !['cancelled', 'rejected', 'completed'].includes(req.status);
              const dateToShow = isCounterProposed && req.proposedAt ? req.proposedAt : req.requestedAt;
              const dateLabel = isCounterProposed && req.proposedAt ? 'Data proposta pelo senhorio' : 'Data pedida';
              const landlord = req.landlordId ? landlordProfiles[req.landlordId] : undefined;
              const landlordName = landlord?.name || 'Senhorio';
              const landlordEmail = landlord?.email;

              return (
                <Card
                  key={req.id}
                  className={`overflow-hidden transition-all ${getStatusBorder(req.status)}`}
                >
                  {isCounterProposed && (
                    <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold text-amber-800">O senhorio propôs uma nova data.</span>
                        <span className="text-sm text-amber-700 ml-2">Aceita ou cancela o pedido.</span>
                      </div>
                    </div>
                  )}
                  {isPending && (
                    <div className="bg-blue-50 border-b border-blue-200 px-5 py-3 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="font-semibold text-blue-800">A aguardar resposta do senhorio</span>
                    </div>
                  )}
                  {isAccepted && (
                    <div className="bg-green-50 border-b border-green-200 px-5 py-3 flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="font-semibold text-green-800">Visita confirmada — prepara-te para o encontro!</span>
                    </div>
                  )}

                  <div className={`grid grid-cols-1 ${coverImage ? 'md:grid-cols-[240px_1fr]' : ''}`}>
                    {coverImage && (
                      <button
                        type="button"
                        onClick={() => room && navigate(`/room/${room.id}`)}
                        className="w-full h-56 md:h-full min-h-[240px] cursor-pointer overflow-hidden bg-muted text-left"
                      >
                        <img
                          src={coverImage}
                          alt={roomTitle}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </button>
                    )}

                    <div className="p-5 min-w-0">
                      {/* Title row */}
                      <div className="flex flex-row items-start justify-between gap-4 mb-4">
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => room && navigate(`/room/${room.id}`)}
                            className="text-xl font-bold text-foreground hover:text-primary text-left block line-clamp-1 mb-1"
                          >
                            {roomTitle}
                          </button>
                          {propTitle && (
                            <p className="text-sm font-semibold text-primary mb-1 line-clamp-1">{propTitle}</p>
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
                              Pedido em {req.createdAt.toLocaleDateString('pt-PT')}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 w-fit ${VISIT_STATUS_COLOR[req.status]}`}>
                          {VISIT_STATUS_LABEL[req.status]}
                        </span>
                      </div>

                      {/* Info grid: landlord + visit date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="rounded-xl border border-border bg-muted/30 p-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Senhorio
                          </p>
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{landlordName}</p>
                          {landlordEmail && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 line-clamp-1">
                              <Mail className="w-3 h-3 flex-shrink-0" /> {landlordEmail}
                            </p>
                          )}
                        </div>
                        <div className={`rounded-xl border p-3 ${isCounterProposed ? 'bg-amber-50/60 border-amber-200' : 'bg-muted/30 border-border'}`}>
                          <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1.5 ${isCounterProposed ? 'text-amber-700' : 'text-muted-foreground'}`}>
                            <Calendar className="w-3.5 h-3.5" /> {dateLabel}
                          </p>
                          <p className={`text-sm font-semibold ${isCounterProposed ? 'text-amber-900' : 'text-foreground'}`}>
                            {fmtDatetime(dateToShow)}
                          </p>
                        </div>
                      </div>

                      {/* Messages */}
                      {req.studentMessage && (
                        <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 mb-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Mensagem enviada</p>
                          <p className="text-sm text-foreground italic">"{req.studentMessage}"</p>
                        </div>
                      )}
                      {req.landlordMessage && (
                        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 mb-3">
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Resposta do senhorio</p>
                          <p className="text-sm text-blue-900">"{req.landlordMessage}"</p>
                        </div>
                      )}

                      {/* Actions */}
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
                        <Button size="sm" variant="outline" onClick={() => navigate('/messages')}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Mensagens
                        </Button>
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

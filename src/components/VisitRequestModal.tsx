import { useState } from 'react';
import { Calendar, Clock, MapPin, MessageCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useVisitRequests } from '../hooks/useVisitRequests';
import { isSupabaseUuid } from '../lib/identity';
import { toast } from 'sonner';

interface Props {
  roomId: string;
  roomTitle: string;
  landlordId: string;
  propertyId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function VisitRequestModal({ roomId, roomTitle, landlordId, propertyId, onClose, onSuccess }: Props) {
  const { createVisitRequest } = useVisitRequests();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!date || !time) {
      toast.error('Seleciona uma data e hora para a visita.');
      return;
    }
    const requestedAt = new Date(`${date}T${time}:00`);
    if (isNaN(requestedAt.getTime()) || requestedAt <= new Date()) {
      toast.error('A data da visita tem de ser no futuro.');
      return;
    }
    console.log('[VisitRequestModal] handleSubmit:', {
      landlordId,
      propertyId,
      roomId,
      requestedAt: requestedAt.toISOString(),
      roomTitle,
    });
    setLoading(true);
    const result = await createVisitRequest({
      landlordId,
      propertyId,
      roomId,
      requestedAt,
      studentMessage: message.trim() || undefined,
    });
    setLoading(false);
    if ('error' in result) {
      toast.error('Não foi possível enviar o pedido.', { description: result.error });
      return;
    }
    toast.success('Pedido de visita enviado! O senhorio irá responder em breve.');
    onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Agendar visita"
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? 'A enviar…' : 'Enviar pedido'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 flex items-center gap-3">
          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm font-medium text-foreground truncate">{roomTitle}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              Data preferida
            </span>
          </label>
          <input
            type="date"
            min={todayStr}
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              Hora preferida
            </span>
          </label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-primary" />
              Mensagem <span className="text-muted-foreground font-normal">(opcional)</span>
            </span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={400}
            rows={3}
            placeholder="Ex: Gostava de ver o quarto antes de me candidatar. Fico disponível também noutros horários."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/400</p>
        </div>

        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
          O senhorio irá confirmar, recusar ou propor uma data alternativa. Agendar uma visita{' '}
          <strong>não cria uma candidatura</strong> — podes candidatar-te independentemente.
        </p>
      </div>
    </Modal>
  );
}

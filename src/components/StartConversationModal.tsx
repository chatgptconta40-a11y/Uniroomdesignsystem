import { useState } from 'react';
import { useNavigate } from 'react-router';
import { X, Send } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';
import { findOrCreateConversation } from '../hooks/useMessages';
import { Accommodation } from '../types/accommodation';
import { toast } from 'sonner';

interface StartConversationModalProps {
  accommodation: Accommodation;
  landlordId: string;
  landlordName?: string;
  roomId?: string;
  propertyId?: string;
  defaultMessage?: string;
  isActiveHome?: boolean;
  onClose: () => void;
}

export function StartConversationModal({
  accommodation,
  landlordId,
  landlordName = 'Senhorio',
  roomId,
  propertyId,
  defaultMessage,
  isActiveHome = false,
  onClose,
}: StartConversationModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const defaultMessageText = isActiveHome
    ? `Olá, queria esclarecer uma dúvida sobre a minha estadia.`
    : `Olá, vi este quarto no UniRoom e tenho interesse. Gostava de confirmar se ainda está disponível, quais são as condições de entrada e se seria possível agendar uma visita. Obrigado.`;

  const [message, setMessage] = useState(defaultMessage || defaultMessageText);

  const quickMessages = isActiveHome
    ? [
        `Olá, queria esclarecer uma dúvida sobre a minha estadia.`,
        `Boa tarde, queria falar consigo sobre uma questão relacionada com a casa.`,
        `Olá, tenho uma dúvida sobre pagamentos/despesas deste mês.`,
        `Boa tarde, queria informar uma situação relacionada com o meu quarto/casa.`,
      ]
    : [
        `Olá! Tenho interesse no quarto "${accommodation.title}". Ainda está disponível?`,
        `Boa tarde! Vi o anúncio de "${accommodation.title}". Gostaria de saber mais informações sobre as condições de arrendamento.`,
        `Olá! Interessado/a em "${accommodation.title}". É possível agendar uma visita?`,
      ];

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Escreve uma mensagem');
      return;
    }

    try {
      const conversationId = await findOrCreateConversation({
        studentId: user?.id || '',
        studentName: user?.name || '',
        landlordId,
        landlordName,
        roomId: roomId || undefined,
        propertyId: propertyId || undefined,
        accommodationTitle: accommodation.title,
        accommodationPrice: accommodation.price,
        accommodationImage: accommodation.images[0],
        initialMessage: message.trim(),
      });

      toast.success('Mensagem enviada!');
      onClose();
      navigate(`/messages?conversation=${conversationId}`);
    } catch {
      toast.error('Erro ao enviar mensagem. Tenta novamente.');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isActiveHome ? 'Contactar senhorio' : 'Enviar mensagem ao responsável'}
            </h2>
            <p className="text-sm text-muted-foreground">{accommodation.title}</p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <img
              src={accommodation.images[0]}
              alt={accommodation.title}
              className="w-20 h-20 rounded-lg object-cover"
            />

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{accommodation.title}</h3>
              <p className="text-sm text-muted-foreground">
                {accommodation.zone}, {accommodation.city}
              </p>
              <p className="text-sm font-semibold text-primary">€{accommodation.price}/mês</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Sugestões rápidas:
            </label>

            <div className="space-y-3">
              {quickMessages.map((quickMessage, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(quickMessage)}
                  className="w-full text-left px-4 py-3 bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all text-sm"
                >
                  {quickMessage}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              A tua mensagem:
            </label>

            <textarea
              value={message}
              onChange={(event) => {
                const newValue = event.target.value;
                if (newValue.length <= 500) {
                  setMessage(newValue);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder="Escreve a tua mensagem aqui..."
              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              rows={5}
              maxLength={500}
            />

            <p className={`text-xs mt-1 ${message.length >= 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {message.length}/500 caracteres
            </p>
          </div>

          <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-foreground">
              {isActiveHome ? (
                <>
                  <strong>Dica:</strong> Explica claramente a tua questão ou dúvida.
                  Senhorios respondem mais rapidamente a mensagens claras e objetivas.
                </>
              ) : (
                <>
                  <strong>Dica:</strong> Apresenta-te brevemente e menciona porque tens interesse neste alojamento.
                  Senhorios respondem mais rapidamente a mensagens completas e educadas.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-between gap-3">
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>

          <Button onClick={() => void handleSend()} disabled={!message.trim()}>
            <Send className="w-4 h-4 mr-2" />
            Enviar mensagem
          </Button>
        </div>
      </div>
    </div>
  );
}
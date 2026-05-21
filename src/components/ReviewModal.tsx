import { useState } from 'react';
import { X, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from './Button';
import { createReview } from '../data/mockTrust';
import { toast } from 'sonner';

interface ReviewModalProps {
  accommodationId: string;
  landlordId: string;
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({
  accommodationId,
  landlordId,
  userId,
  userName,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [criteria, setCriteria] = useState({
    quality: 0,
    coexistence: 0,
    landlordResponse: 0,
    location: 0,
    valueForMoney: 0,
  });
  const [comment, setComment] = useState('');
  const [recommend, setRecommend] = useState<boolean | null>(null);

  const criteriaLabels = {
    quality: 'Qualidade do alojamento',
    coexistence: 'Convivência',
    landlordResponse: 'Resposta do senhorio',
    location: 'Localização',
    valueForMoney: 'Relação qualidade/preço',
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Por favor, seleciona uma classificação geral');
      return;
    }

    if (Object.values(criteria).some(value => value === 0)) {
      toast.error('Por favor, classifica todos os critérios');
      return;
    }

    if (!comment.trim()) {
      toast.error('Por favor, escreve um comentário');
      return;
    }

    if (recommend === null) {
      toast.error('Por favor, indica se recomendas');
      return;
    }

    createReview(
      accommodationId,
      landlordId,
      userId,
      userName,
      rating,
      criteria,
      comment.trim(),
      recommend,
    );

    toast.success('Avaliação publicada com sucesso!');
    onSuccess();
    onClose();
  };

  const getRatingLabel = () => {
    switch (rating) {
      case 5:
        return 'Excelente!';
      case 4:
        return 'Muito bom';
      case 3:
        return 'Bom';
      case 2:
        return 'Razoável';
      case 1:
        return 'Fraco';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Deixar avaliação</h2>
            <p className="text-sm text-muted-foreground">Partilha a tua experiência</p>
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
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Como foi a tua experiência geral?
            </h3>

            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                  aria-label={`Classificar com ${star} estrela${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {getRatingLabel()}
              </p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Avalia cada critério:</h3>

            <div className="space-y-4">
              {Object.entries(criteriaLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-foreground">{label}</span>

                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCriteria({ ...criteria, [key]: star })}
                        className="transition-transform hover:scale-110"
                        aria-label={`${label}: ${star} estrela${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= criteria[key as keyof typeof criteria]
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Comentário
            </label>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Partilha detalhes sobre a tua experiência neste alojamento..."
              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              rows={5}
              maxLength={500}
            />

            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Recomendarias este alojamento?
            </label>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRecommend(true)}
                className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${
                  recommend === true
                    ? 'border-green-500 bg-green-50'
                    : 'border-border hover:border-green-500'
                }`}
              >
                <ThumbsUp
                  className={`w-8 h-8 mx-auto mb-2 ${
                    recommend === true ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                />
                <p
                  className={`font-medium ${
                    recommend === true ? 'text-green-600' : 'text-foreground'
                  }`}
                >
                  Sim
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRecommend(false)}
                className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${
                  recommend === false
                    ? 'border-red-500 bg-red-50'
                    : 'border-border hover:border-red-500'
                }`}
              >
                <ThumbsDown
                  className={`w-8 h-8 mx-auto mb-2 ${
                    recommend === false ? 'text-red-600' : 'text-muted-foreground'
                  }`}
                />
                <p
                  className={`font-medium ${
                    recommend === false ? 'text-red-600' : 'text-foreground'
                  }`}
                >
                  Não
                </p>
              </button>
            </div>
          </div>

          <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-foreground">
              <strong>Dica:</strong> Avaliações honestas e detalhadas ajudam outros estudantes a
              tomar decisões informadas. A tua avaliação será verificada e pública.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-between gap-3">
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>

          <Button onClick={handleSubmit}>
            Publicar avaliação
          </Button>
        </div>
      </div>
    </div>
  );
}
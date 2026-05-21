import { useState } from 'react';
import { X, Check, Send, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { Input } from './Input';
import { useAuth } from '../context/AuthContext';
import { Accommodation } from '../types/accommodation';
import { createApplication } from '../data/mockApplications';
import { toast } from 'sonner';

interface ApplicationModalProps {
  accommodation: Accommodation;
  roomId?: string;
  propertyId?: string;
  propertyTitle?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplicationModal({ accommodation, roomId, propertyId, propertyTitle, onClose, onSuccess }: ApplicationModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const studentProfile = user
    ? {
        personal: {
          course: 'Não especificado',
          university: 'Não especificada',
          year: undefined as number | undefined,
          verified: user.verified,
        },
        lifestyle: {
          schedule: 'flexible' as string,
          cleanliness: 4,
          smoking: false,
          personality: 'equilibrado',
        },
        preferences: true,
      }
    : null;

  const profileCompleteness = studentProfile
    ? Math.round(
        ((studentProfile.personal ? 33 : 0) +
          (studentProfile.lifestyle ? 33 : 0) +
          (studentProfile.preferences ? 34 : 0))
      )
    : 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    createApplication(
      user?.id || '',
      accommodation.id,
      accommodation.landlordId,
      message,
      moveInDate ? new Date(moveInDate) : undefined,
      {
        roomId,
        propertyId,
      }
    );

    setIsSubmitting(false);
    toast.success('Candidatura enviada com sucesso!');
    onSuccess();
    onClose();
  };

  const messageSuggestions = [
    'Apresenta-te brevemente',
    'Menciona o teu curso e universidade',
    'Explica porque este alojamento te interessa',
    'Indica se tens alguma dúvida',
  ];

  const exampleMessage = `Olá! Sou estudante de ${studentProfile?.personal?.course || '[Curso]'} na ${studentProfile?.personal?.university || '[Universidade]'}. Procuro alojamento a partir de ${moveInDate ? new Date(moveInDate).toLocaleDateString('pt-PT', { month: 'long' }) : '[mês]'}. Estou muito interessado/a neste espaço pela localização e ambiente descrito.`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Candidatar-me</h2>
            <p className="text-sm text-muted-foreground">{accommodation.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    step > s
                      ? 'bg-green-500 text-white'
                      : step === s
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      step > s ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Perfil</span>
            <span>Mensagem</span>
            <span>Confirmar</span>
          </div>
        </div>

        <div className="px-6 py-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">O teu perfil</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Estas informações serão partilhadas com o senhorio.
                </p>
              </div>

              <Card className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
                    {user?.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{user?.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{user?.email}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={profileCompleteness === 100 ? 'success' : 'warning'}>
                        Perfil {profileCompleteness}% completo
                      </Badge>
                      {studentProfile?.personal?.verified && (
                        <Badge variant="outline">
                          <Check className="w-3 h-3 mr-1" />
                          Verificado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {studentProfile?.personal && (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-muted-foreground">Curso</span>
                      <span className="font-medium text-foreground">
                        {studentProfile.personal.course || 'Não especificado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-muted-foreground">Universidade</span>
                      <span className="font-medium text-foreground">
                        {studentProfile.personal.university || 'Não especificado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-muted-foreground">Ano</span>
                      <span className="font-medium text-foreground">
                        {studentProfile.personal.year ? `${studentProfile.personal.year}º ano` : 'Não especificado'}
                      </span>
                    </div>
                  </div>
                )}

                {profileCompleteness < 100 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900 mb-1">
                        Perfil incompleto
                      </p>
                      <p className="text-yellow-700">
                        Completa o teu perfil para aumentar as hipóteses de aceitação.
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {studentProfile?.lifestyle && (
                <div>
                  <h4 className="font-medium text-foreground mb-3">Perfil de convivência</h4>
                  <Card className="p-6">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Horário:</span>
                        <span className="ml-2 font-medium">
                          {studentProfile.lifestyle.schedule === 'day' ? 'Diurno' :
                           studentProfile.lifestyle.schedule === 'night' ? 'Noturno' : 'Flexível'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Limpeza:</span>
                        <span className="ml-2 font-medium">{studentProfile.lifestyle.cleanliness}/5</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fumar:</span>
                        <span className="ml-2 font-medium">{studentProfile.lifestyle.smoking ? 'Sim' : 'Não'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Personalidade:</span>
                        <span className="ml-2 font-medium capitalize">{studentProfile.lifestyle.personality}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Mensagem de apresentação</h3>
                <p className="text-sm text-muted-foreground">
                  Apresenta-te ao senhorio (opcional mas recomendado).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Data prevista de entrada
                </label>
                <Input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mensagem (opcional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={exampleMessage}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  rows={6}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {message.length}/500 caracteres
                </p>
              </div>

              <Card className="p-6 bg-primary/5 border-primary/20">
                <h4 className="font-medium text-foreground mb-2 text-sm">
                  Sugestões para a tua mensagem:
                </h4>
                <ul className="space-y-1 text-sm text-foreground">
                  {messageSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Confirmar candidatura</h3>
                <p className="text-sm text-muted-foreground">
                  Revê os detalhes antes de enviar.
                </p>
              </div>

              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Alojamento</h4>
                    <p className="text-sm text-muted-foreground">{accommodation.title}</p>
                    {propertyTitle && (
                      <p className="text-sm text-muted-foreground">Casa: {propertyTitle}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{accommodation.address}, {accommodation.city}</p>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-1">Valor</h4>
                    <p className="text-sm text-muted-foreground">€{accommodation.price}/mês</p>
                  </div>

                  {moveInDate && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-foreground mb-1">Data de entrada</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(moveInDate).toLocaleDateString('pt-PT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {message && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-foreground mb-1">Mensagem</h4>
                      <p className="text-sm text-muted-foreground italic">"{message}"</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">O que acontece a seguir?</p>
                    <ul className="space-y-1 text-xs">
                      <li>• O senhorio será notificado da tua candidatura</li>
                      <li>• Receberás atualizações sobre o estado</li>
                      <li>• Podes gerir candidaturas na página "As Minhas Candidaturas"</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-between">
          <Button
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            variant="outline"
          >
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          <Button
            onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'A enviar...'
            ) : step === 3 ? (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Candidatura
              </>
            ) : (
              'Continuar'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
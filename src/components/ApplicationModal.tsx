import { useState } from 'react';
import { X, Check, Send, AlertCircle, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { Input } from './Input';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { Accommodation } from '../types/accommodation';
import { createUnifiedApplication, getExistingApplicationForRoom } from '../data/unifiedApplications';
import { mockStudentProfiles } from '../data/mockUsers';
import { toast } from 'sonner';

interface ApplicationModalProps {
  accommodation: Accommodation;
  roomId?: string;
  propertyId?: string;
  propertyTitle?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplicationModal({
  accommodation,
  roomId,
  propertyId,
  propertyTitle,
  onClose,
  onSuccess,
}: ApplicationModalProps) {
  const { user } = useAuth();
  const { getRoom, getProperty, refreshProperties } = useProperties();

  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    moveInDate: '',
    message: '',
  });

  const effectiveRoomId = roomId || accommodation.id;
  const room = getRoom(effectiveRoomId);
  const property = getProperty(propertyId || room?.propertyId || '');
  const effectivePropertyId = propertyId || property?.id || room?.propertyId || '';
  const effectivePropertyTitle = propertyTitle || property?.title;
  const isRoomUnavailable = !!room && room.status !== 'available';

  const studentProfile = mockStudentProfiles.find(profile => profile.userId === user?.id);

  const profileCompleteness = user
    ? Math.round(
        (user.name ? 33 : 0) +
          (studentProfile?.university ? 33 : 0) +
          (studentProfile?.course ? 34 : 0),
      )
    : 0;

  const existingApplication = user
    ? getExistingApplicationForRoom(user.id, effectiveRoomId)
    : null;

  const hasActiveApplication =
    !!existingApplication &&
    (
      existingApplication.status === 'pending' ||
      existingApplication.status === 'under_review' ||
      existingApplication.status === 'accepted' ||
      existingApplication.status === 'confirmed'
    );

  const hasRejectedApplication =
    !!existingApplication &&
    (
      existingApplication.status === 'rejected' ||
      existingApplication.status === 'withdrawn'
    );

  const canSubmit =
    !!user &&
    !isSubmitting &&
    !hasActiveApplication &&
    !isRoomUnavailable;

  const todayIso = new Date().toISOString().split('T')[0];

  const validateApplicationDetails = () => {
    const errors = {
      moveInDate: '',
      message: '',
    };

    const trimmedMessage = message.trim();

    if (!moveInDate) {
      errors.moveInDate = 'Indica a data prevista de entrada.';
    } else if (moveInDate < todayIso) {
      errors.moveInDate = 'A data de entrada não pode ser anterior a hoje.';
    }

    if (!trimmedMessage) {
      errors.message = 'Escreve uma mensagem de apresentação.';
    } else if (trimmedMessage.length < 40) {
      errors.message = 'A mensagem deve ter pelo menos 40 caracteres.';
    } else if (trimmedMessage.length > 500) {
      errors.message = 'A mensagem não pode ultrapassar 500 caracteres.';
    }

    setFieldErrors(errors);
    return !errors.moveInDate && !errors.message;
  };

  const handleContinue = () => {
    if (step === 2 && !validateApplicationDetails()) {
      toast.warning('Revê os campos obrigatórios antes de continuar.');
      return;
    }

    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Inicia sessão para te candidatares.');
      return;
    }

    if (hasActiveApplication) {
      toast.error('Já tens uma candidatura ativa para este quarto.');
      return;
    }

    if (isRoomUnavailable) {
      toast.error('Este quarto já não está disponível.');
      refreshProperties();
      return;
    }

    if (!validateApplicationDetails()) {
      setStep(2);
      toast.warning('Revê os campos obrigatórios antes de enviar.');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      createUnifiedApplication({
        studentId: user.id,
        studentName: user.name || 'Estudante',
        studentUniversity: studentProfile?.university,
        studentCourse: studentProfile?.course,
        studentYear: studentProfile?.year,
        roomId: effectiveRoomId,
        propertyId: effectivePropertyId,
        landlordId: accommodation.landlordId || property?.landlordId || '',
        landlordName: undefined,
        message: message.trim(),
        moveInDate: new Date(moveInDate),
        accommodationId: accommodation.id,
      });

      refreshProperties();
      toast.success('Candidatura enviada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar a candidatura.';

      toast.error(message);
      refreshProperties();
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageSuggestions = [
    'Apresenta-te brevemente',
    'Menciona o teu curso e universidade',
    'Explica porque este alojamento te interessa',
    'Indica se tens alguma dúvida',
  ];

  const exampleMessage = `Olá! Sou estudante de ${studentProfile?.course || '[Curso]'} na ${studentProfile?.university || '[Universidade]'}. Procuro alojamento a partir de ${
    moveInDate
      ? new Date(moveInDate).toLocaleDateString('pt-PT', { month: 'long' })
      : '[mês]'
  }. Estou muito interessado/a neste espaço pela localização e ambiente descrito.`;

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
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isRoomUnavailable && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Este quarto já não está disponível</p>
              <p className="text-sm text-red-700 mt-0.5">
                O estado atual do quarto é “{room?.status}”. Podes procurar outro quarto disponível.
              </p>
            </div>
          </div>
        )}

        {hasActiveApplication && (
          <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Já tens uma candidatura ativa para este quarto</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Estado atual: <strong>{existingApplication?.status}</strong>. Podes acompanhar em “As Minhas Candidaturas”.
              </p>
            </div>
          </div>
        )}

        {hasRejectedApplication && !hasActiveApplication && (
          <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              A tua candidatura anterior para este quarto foi {existingApplication?.status === 'rejected' ? 'recusada' : 'cancelada'}.
              Podes candidatar-te novamente se o quarto estiver disponível.
            </p>
          </div>
        )}

        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map(item => (
              <div key={item} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    step > item
                      ? 'bg-green-500 text-white'
                      : step === item
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > item ? <Check className="w-5 h-5" /> : item}
                </div>
                {item < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      step > item ? 'bg-green-500' : 'bg-muted'
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
                    {user?.name?.charAt(0) || 'E'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{user?.name || 'Estudante'}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{user?.email || 'Sessão não iniciada'}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={profileCompleteness === 100 ? 'success' : 'warning'}>
                        Perfil {profileCompleteness}% completo
                      </Badge>
                      {user?.verified && (
                        <Badge variant="outline">
                          <Check className="w-3 h-3 mr-1" />
                          Verificado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-t">
                    <span className="text-muted-foreground">Curso</span>
                    <span className="font-medium text-foreground">
                      {studentProfile?.course || 'Não especificado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t">
                    <span className="text-muted-foreground">Universidade</span>
                    <span className="font-medium text-foreground">
                      {studentProfile?.university || 'Não especificada'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t">
                    <span className="text-muted-foreground">Ano</span>
                    <span className="font-medium text-foreground">
                      {studentProfile?.year ? `${studentProfile.year}º ano` : 'Não especificado'}
                    </span>
                  </div>
                </div>

                {profileCompleteness < 100 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900 mb-1">Perfil incompleto</p>
                      <p className="text-yellow-700">
                        Completa o teu perfil para aumentar as hipóteses de aceitação.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Mensagem de apresentação</h3>
                <p className="text-sm text-muted-foreground">
                  Apresenta-te ao senhorio. Uma mensagem clara aumenta a confiança e ajuda na decisão.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Data prevista de entrada <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={moveInDate}
                  onChange={event => {
                    setMoveInDate(event.target.value);
                    if (fieldErrors.moveInDate) {
                      setFieldErrors(prev => ({ ...prev, moveInDate: '' }));
                    }
                  }}
                  min={todayIso}
                  error={fieldErrors.moveInDate}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mensagem <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={event => {
                    setMessage(event.target.value);
                    if (fieldErrors.message) {
                      setFieldErrors(prev => ({ ...prev, message: '' }));
                    }
                  }}
                  placeholder={exampleMessage}
                  className={`w-full px-4 py-3 bg-input-background border rounded-lg focus:ring-2 resize-none transition-colors ${
                    fieldErrors.message
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-border focus:ring-primary focus:border-primary'
                  }`}
                  rows={6}
                  maxLength={500}
                />
                <div className="mt-1 flex items-start justify-between gap-3">
                  <div>
                    {fieldErrors.message ? (
                      <p className="text-xs text-red-500">{fieldErrors.message}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Mínimo 40 caracteres. Evita mensagens demasiado vagas.
                      </p>
                    )}
                  </div>

                  <p
                    className={`text-xs flex-shrink-0 ${
                      message.trim().length > 0 && message.trim().length < 40
                        ? 'text-amber-600'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {message.length}/500
                  </p>
                </div>
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
                    {effectivePropertyTitle && (
                      <p className="text-sm text-muted-foreground">Casa: {effectivePropertyTitle}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {accommodation.address}, {accommodation.city}
                    </p>
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

                  {message.trim() && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-foreground mb-1">Mensagem</h4>
                      <p className="text-sm text-muted-foreground italic">“{message.trim()}”</p>
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
                      <li>• Receberás atualizações sobre o estado em tempo real</li>
                      <li>• Se for aceite, confirmas a estadia em “As Minhas Candidaturas”</li>
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
            onClick={step === 3 ? handleSubmit : handleContinue}
            disabled={step === 3 ? !canSubmit : false}
          >
            {isSubmitting ? (
              'A enviar...'
            ) : step === 3 ? (
              <>
                <Send className="w-4 h-4 mr-2" />
                {hasActiveApplication ? 'Candidatura já enviada' : 'Enviar Candidatura'}
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

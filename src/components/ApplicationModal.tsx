import { useEffect, useState } from 'react';
import { X, Check, Send, AlertCircle, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { Input } from './Input';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { Accommodation } from '../types/accommodation';
import { StudentProfile } from '../types/profile';
import { fetchStudentProfileFromDb } from '../db/profilesDb';
import { supabase } from '../lib/supabase';
import { validateApplicationIds } from '../lib/identity';
import { toast } from 'sonner';

interface ApplicationModalProps {
  accommodation: Accommodation;
  roomId?: string;
  propertyId?: string;
  propertyTitle?: string;
  onClose: () => void;
  onSuccess: () => void;
}

function formatYear(year?: number) {
  if (!year) return 'Não especificado';
  return `${year}.º ano`;
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

  const effectiveRoomId = roomId || accommodation.id;
  const room = getRoom(effectiveRoomId);
  const property = getProperty(propertyId || room?.propertyId || '');
  const effectivePropertyId = propertyId || property?.id || room?.propertyId || '';
  const effectivePropertyTitle = propertyTitle || property?.title;
  const isRoomUnavailable = !!room && room.status !== 'available';

  const [dbProfile, setDbProfile] = useState<StudentProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(!!user?.id);

  useEffect(() => {
    if (!user?.id) {
      setIsProfileLoading(false);
      return;
    }
    let cancelled = false;
    setIsProfileLoading(true);
    fetchStudentProfileFromDb(user.id)
      .then(p => { if (!cancelled) { setDbProfile(p); setIsProfileLoading(false); } })
      .catch(err => {
        console.error('[ApplicationModal] profile fetch error', err);
        if (!cancelled) setIsProfileLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const profileName = dbProfile?.personal.fullName || user?.name || 'Estudante';
  const profileEmail = user?.email || 'Sessão não iniciada';
  const profileCourse = dbProfile?.personal.course || '';
  const profileInstitution = dbProfile?.personal.institution || '';
  const profileYear = dbProfile?.personal.yearOfStudy;
  const profileHometown = dbProfile?.personal.hometown || '';
  const profileBio = dbProfile?.personal.bio || '';
  const profileLanguages = dbProfile?.personal.languages || [];

  const profileCompleteness =
    dbProfile?.completeness?.overall ??
    user?.profileCompleteness?.overall ??
    0;

  const [existingApplication, setExistingApplication] = useState<{ id: string; status: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id || !effectiveRoomId) {
      setExistingApplication(null);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('id,status')
        .eq('user_id', user.id)
        .eq('room_id', effectiveRoomId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (cancelled) return;
      if (error) {
        console.error('[UniRoom] existingApplication fetch error:', error.message);
        setExistingApplication(null);
        return;
      }
      setExistingApplication(data && data[0] ? { id: data[0].id, status: data[0].status } : null);
    })();
    return () => { cancelled = true; };
  }, [user?.id, effectiveRoomId]);

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

    const landlordId = accommodation.landlordId || property?.landlordId || '';

    const validation = validateApplicationIds({
      userId: user.id,
      landlordId,
      propertyId: effectivePropertyId,
      roomId: effectiveRoomId,
    });

    if (!validation.ok) {
      toast.error(validation.reason);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: dup, error: dupError } = await supabase
        .from('applications')
        .select('id,status')
        .eq('user_id', user.id)
        .eq('room_id', effectiveRoomId)
        .in('status', ['pending', 'under_review', 'accepted', 'confirmed'])
        .limit(1);

      if (dupError) {
        toast.error(`Erro ao validar candidatura: ${dupError.message}`);
        return;
      }
      if (dup && dup.length > 0) {
        toast.error('Já tens uma candidatura ativa para este quarto.');
        return;
      }

      const payload = {
        id: crypto.randomUUID(),
        user_id: user.id,
        landlord_id: landlordId,
        property_id: effectivePropertyId,
        room_id: effectiveRoomId || null,
        status: 'pending',
        message,
        move_in_date: moveInDate ? new Date(moveInDate).toISOString().slice(0, 10) : null,
      };

      const { error } = await supabase.from('applications').insert(payload);
      if (error) {
        toast.error(`Erro ao enviar candidatura: ${error.message}`);
        return;
      }

      refreshProperties();
      toast.success('Candidatura enviada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar a candidatura.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageSuggestions = [
    'Apresenta-te brevemente',
    'Menciona o teu curso e instituição',
    'Explica porque este alojamento te interessa',
    'Indica quando pretendes entrar',
  ];

  const exampleMessage = `Olá! Sou estudante de ${profileCourse || '[Curso]'} na ${profileInstitution || '[Instituição]'}. Procuro alojamento a partir de ${
    moveInDate
      ? new Date(moveInDate).toLocaleDateString('pt-PT', { month: 'long' })
      : '[mês]'
  }. Estou interessado/a neste espaço pela localização e pelo ambiente descrito.`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">Candidatar-me</h2>
            <p className="text-sm text-muted-foreground">{accommodation.title}</p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Fechar"
            type="button"
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
                O estado atual do quarto é "{room?.status}". Podes procurar outro quarto disponível.
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
                Estado atual: <strong>{existingApplication?.status}</strong>. Podes acompanhar em "As Minhas Candidaturas".
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
                    {profileName.charAt(0)}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{profileName}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{profileEmail}</p>

                    <div className="flex flex-wrap items-center gap-2">
                      {isProfileLoading ? (
                        <Badge variant="outline">A carregar perfil...</Badge>
                      ) : (
                        <Badge variant={profileCompleteness >= 80 ? 'success' : 'warning'}>
                          Perfil {profileCompleteness}% completo
                        </Badge>
                      )}

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
                  <div className="flex items-center justify-between gap-4 py-2 border-t">
                    <span className="text-muted-foreground">Curso</span>
                    <span className="font-medium text-foreground text-right">
                      {profileCourse || 'Não especificado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2 border-t">
                    <span className="text-muted-foreground">Instituição</span>
                    <span className="font-medium text-foreground text-right">
                      {profileInstitution || 'Não especificada'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2 border-t">
                    <span className="text-muted-foreground">Ano</span>
                    <span className="font-medium text-foreground text-right">
                      {formatYear(profileYear)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2 border-t">
                    <span className="text-muted-foreground">Cidade de origem</span>
                    <span className="font-medium text-foreground text-right">
                      {profileHometown || 'Não especificada'}
                    </span>
                  </div>

                  {profileLanguages.length > 0 && (
                    <div className="flex items-center justify-between gap-4 py-2 border-t">
                      <span className="text-muted-foreground">Idiomas</span>
                      <span className="font-medium text-foreground text-right">
                        {profileLanguages.join(', ')}
                      </span>
                    </div>
                  )}

                  {profileBio && (
                    <div className="py-3 border-t">
                      <span className="block text-muted-foreground mb-1">Bio</span>
                      <p className="font-medium text-foreground leading-relaxed">
                        {profileBio}
                      </p>
                    </div>
                  )}
                </div>

                {!isProfileLoading && profileCompleteness < 80 && (
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
                  Apresenta-te ao senhorio. É opcional, mas ajuda muito na decisão.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Data prevista de entrada
                </label>

                <Input
                  type="date"
                  value={moveInDate}
                  onChange={event => setMoveInDate(event.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mensagem
                </label>

                <textarea
                  value={message}
                  onChange={event => setMessage(event.target.value)}
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

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-1">Perfil enviado</h4>
                    <p className="text-sm text-muted-foreground">
                      {profileName}
                      {profileCourse ? ` · ${profileCourse}` : ''}
                      {profileInstitution ? ` · ${profileInstitution}` : ''}
                      {profileYear ? ` · ${formatYear(profileYear)}` : ''}
                    </p>
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
                      <li>• Receberás atualizações sobre o estado em tempo real</li>
                      <li>• Se for aceite, confirmas a estadia em "As Minhas Candidaturas"</li>
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

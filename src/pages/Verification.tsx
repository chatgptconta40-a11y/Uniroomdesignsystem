import { useMemo, useRef, useState } from 'react';

import { useNavigate } from 'react-router';
import {
  Shield,
  Mail,
  GraduationCap,
  FileText,
  Check,
  Upload,
  Loader2,
  AlertCircle,
  Clock,
  Building2,
  XCircle,
} from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVerificationStatus } from '../hooks/useTrust';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { toast } from 'sonner';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ACADEMIC_DOMAINS = [
  '.edu',
  '.ac.',
  'uminho.pt',
  'up.pt',
  'ulisboa.pt',
  'tecnico.ulisboa.pt',
  'fc.ul.pt',
  'iscte-iul.pt',
  'unl.pt',
  'uc.pt',
  'ipv.pt',
  'estgv.ipv.pt',
  'ipl.pt',
  'ipp.pt',
  'ipb.pt',
  'ua.pt',
  'ubi.pt',
  'utad.pt',
  'ualg.pt',
  'estudante',
  'aluno',
  'student',
];

const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_DOC_BYTES = 8 * 1024 * 1024;

function isAcademicEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return ACADEMIC_DOMAINS.some(token => lower.includes(token));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function Verification() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { status: verification, upsert, submitDocument } = useVerificationStatus(user?.id);

  const isLandlord = user?.type === 'landlord';

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [email, setEmail] = useState(user?.email || '');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [uniEmail, setUniEmail] = useState('');
  const [uniEmailError, setUniEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (!verification) return;
    const step = !verification.emailVerified ? 1 : !verification.universityEmailVerified ? 2 : 3;
    setCurrentStep(step);
    setEmail(prev => prev || verification.personalEmail || user?.email || '');
    setUniEmail(prev => prev || verification.universityEmail || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verification?.emailVerified, verification?.universityEmailVerified]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [confirmOwnership, setConfirmOwnership] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allDone = Boolean(
    verification?.emailVerified &&
    verification?.universityEmailVerified &&
    verification?.documentVerified,
  );

  const documentPending = verification?.documentReviewStatus === 'pending';
  const documentRejected = verification?.documentReviewStatus === 'rejected';

  const steps = useMemo(
    () => [
      {
        number: 1,
        title: 'Email pessoal',
        shortTitle: 'Email',
        icon: Mail,
        completed: !!verification?.emailVerified,
      },
      {
        number: 2,
        title: isLandlord ? 'Email profissional' : 'Email universitário',
        shortTitle: isLandlord ? 'Email pro' : 'Email uni',
        icon: isLandlord ? Building2 : GraduationCap,
        completed: !!verification?.universityEmailVerified,
      },
      {
        number: 3,
        title: 'Documento',
        shortTitle: 'Documento',
        icon: FileText,
        completed: !!verification?.documentVerified,
      },
    ],
    [verification?.emailVerified, verification?.universityEmailVerified, verification?.documentVerified, isLandlord],
  );

  const completedCount = steps.filter(step => step.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  const handleVerifyEmail = async () => {
    const value = email.trim();

    if (!value) {
      setEmailError('O email é obrigatório.');
      return;
    }

    if (!EMAIL_RE.test(value)) {
      setEmailError('Insere um email com formato válido.');
      return;
    }

    if (!user?.id) {
      toast.error('Sessão inválida.');
      return;
    }

    setEmailError(null);
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 700));

    await upsert({ emailVerified: true, personalEmail: value });

    toast.success('Email pessoal confirmado.');
    setIsProcessing(false);
    setCurrentStep(2);
  };

  const handleVerifyUniEmail = async () => {
    const value = uniEmail.trim();

    if (!value) {
      setUniEmailError(isLandlord ? 'O email profissional é obrigatório.' : 'O email universitário é obrigatório.');
      return;
    }

    if (!EMAIL_RE.test(value)) {
      setUniEmailError('Formato de email inválido.');
      return;
    }

    if (!isLandlord && !isAcademicEmail(value)) {
      setUniEmailError('Tem de ser um email institucional ou académico.');
      return;
    }

    if (!user?.id) {
      toast.error('Sessão inválida.');
      return;
    }

    setUniEmailError(null);
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 700));

    await upsert({ universityEmailVerified: true, universityEmail: value });

    toast.success(isLandlord ? 'Email profissional confirmado.' : 'Email universitário confirmado.');
    setIsProcessing(false);
    setCurrentStep(3);
  };

  const handleFileSelected = (file: File | undefined | null) => {
    if (!file) return;

    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      setDocumentError('Formato não suportado. Aceitamos apenas PDF, JPG ou PNG.');
      setDocumentFile(null);
      return;
    }

    if (file.size > MAX_DOC_BYTES) {
      setDocumentError('Ficheiro demasiado grande. Máximo 8 MB.');
      setDocumentFile(null);
      return;
    }

    setDocumentError(null);
    setDocumentFile(file);
  };

  const handleSubmitDocument = async () => {
    if (!documentFile) {
      setDocumentError('Tens de carregar um documento.');
      return;
    }

    if (!confirmOwnership) {
      setDocumentError('Tens de confirmar que o documento te pertence.');
      return;
    }

    if (!user?.id) {
      toast.error('Sessão inválida.');
      return;
    }

    setDocumentError(null);
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 900));

    const result = await submitDocument(documentFile.name);

    setIsProcessing(false);

    if (!result) {
      toast.error('Não foi possível enviar o documento.', {
        description: 'Verifica a tua ligação e tenta novamente.',
      });
      return;
    }

    toast.success('Documento enviado para análise do administrador.');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="mb-6 flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Verificação de conta</h1>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  allDone
                    ? 'bg-green-100 text-green-700'
                    : documentPending
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                }`}
              >
                {allDone ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Verificado
                  </>
                ) : documentPending ? (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    Documento em análise
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    Verificação pendente
                  </>
                )}
              </span>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Completa os passos abaixo para aumentar a confiança junto de senhorios e da equipa UniRoom.
            </p>
          </div>
        </div>

        <Card className="p-5 mb-6">
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completedCount} de {steps.length} passos concluídos
            </span>
            <span className="font-semibold text-foreground">{progressPct}%</span>
          </div>

          <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <ol className="grid grid-cols-3 gap-2 sm:gap-4">
            {steps.map(step => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number && !step.completed;
              const canNavigate =
                step.completed ||
                step.number === 1 ||
                (step.number === 2 && !!verification?.emailVerified) ||
                (step.number === 3 && !!verification?.universityEmailVerified);

              return (
                <li key={step.number}>
                  <button
                    type="button"
                    disabled={!canNavigate}
                    onClick={() => canNavigate && setCurrentStep(step.number)}
                    className={`group flex w-full flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition-all ${
                      step.completed
                        ? 'border-green-200 bg-green-50'
                        : isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card'
                    } ${canNavigate ? 'hover:border-primary/60 cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        step.completed
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.completed ? <Check className="h-5 w-5" /> : <StepIcon className="h-4 w-4" />}
                    </div>

                    <div className="leading-tight">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Passo {step.number}
                      </p>
                      <p className="text-xs font-semibold text-foreground sm:hidden">{step.shortTitle}</p>
                      <p className="hidden text-sm font-semibold text-foreground sm:block">{step.title}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card className="p-6 md:p-8">
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Mail className="h-3.5 w-3.5" />
                  Passo 1 de 3
                </div>
                <h2 className="text-xl font-bold text-foreground">Confirma o teu email pessoal</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Usamos este email para comunicação geral, recuperação de conta e notificações.
                </p>
              </div>

              <Input
                type="email"
                label="Email pessoal"
                value={email}
                onChange={event => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="nome@exemplo.com"
                error={emailError || undefined}
                disabled={verification?.emailVerified || isProcessing}
                autoComplete="email"
              />

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Este passo dá o nível Bronze de verificação.
                </p>

                <Button
                  onClick={handleVerifyEmail}
                  disabled={isProcessing || verification?.emailVerified}
                  className="sm:w-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A verificar
                    </>
                  ) : verification?.emailVerified ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Verificado
                    </>
                  ) : (
                    'Confirmar email'
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  {isLandlord ? <Building2 className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
                  Passo 2 de 3
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {isLandlord ? 'Confirma o email profissional' : 'Confirma o email universitário'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isLandlord
                    ? 'Ajuda a validar que és um responsável legítimo por alojamentos.'
                    : 'Ajuda os senhorios a perceberem que és estudante real.'}
                </p>
              </div>

              <Input
                type="email"
                label={isLandlord ? 'Email profissional' : 'Email universitário'}
                value={uniEmail}
                onChange={event => {
                  setUniEmail(event.target.value);
                  if (uniEmailError) setUniEmailError(null);
                }}
                placeholder={isLandlord ? 'nome@empresa.pt' : 'aluno@estgv.ipv.pt'}
                error={uniEmailError || undefined}
                disabled={verification?.universityEmailVerified || isProcessing}
              />

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                {isLandlord
                  ? 'Para senhorios, este email pode ser profissional ou associado à entidade gestora.'
                  : 'São aceites domínios académicos como ipv.pt, uc.pt, up.pt, ulisboa.pt, uminho.pt, ua.pt, entre outros.'}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  disabled={isProcessing}
                >
                  Voltar
                </Button>

                <Button
                  onClick={handleVerifyUniEmail}
                  disabled={isProcessing || verification?.universityEmailVerified}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A verificar
                    </>
                  ) : verification?.universityEmailVerified ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Verificado
                    </>
                  ) : (
                    'Confirmar email'
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  <FileText className="h-3.5 w-3.5" />
                  Passo 3 de 3
                </div>
                <h2 className="text-xl font-bold text-foreground">Documento de verificação</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  O documento fica em análise e só o administrador pode aprovar o nível Ouro.
                </p>
              </div>

              {verification?.documentVerified && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Documento aprovado</p>
                    <p className="text-sm text-green-700">A tua conta está verificada com nível Ouro.</p>
                  </div>
                </div>
              )}

              {documentPending && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Documento em análise</p>
                    <p className="text-sm text-blue-700">
                      O administrador ainda precisa de aprovar o documento
                      {verification?.documentFileName ? ` (${verification.documentFileName})` : ''}.
                    </p>
                  </div>
                </div>
              )}

              {documentRejected && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Documento rejeitado</p>
                    <p className="text-sm text-red-700">
                      {verification?.documentRejectionReason || 'Carrega um novo documento para análise.'}
                    </p>
                  </div>
                </div>
              )}

              {!verification?.documentVerified && (
                <>
                  <div
                    onDragEnter={event => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragOver={event => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={event => {
                      event.preventDefault();
                      setDragActive(false);
                    }}
                    onDrop={event => {
                      event.preventDefault();
                      setDragActive(false);
                      handleFileSelected(event.dataTransfer.files?.[0]);
                    }}
                    className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                      dragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-muted/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={event => handleFileSelected(event.target.files?.[0])}
                    />

                    <Upload className="mx-auto mb-3 h-8 w-8 text-primary" />

                    <p className="font-semibold text-foreground">
                      Arrasta o documento ou escolhe um ficheiro
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF, JPG ou PNG. Máximo {formatBytes(MAX_DOC_BYTES)}.
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Escolher ficheiro
                    </Button>

                    {documentFile && (
                      <div className="mt-4 rounded-xl bg-card border border-border p-3 text-sm">
                        <p className="font-semibold text-foreground">{documentFile.name}</p>
                        <p className="text-muted-foreground">{formatBytes(documentFile.size)}</p>
                      </div>
                    )}
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-border p-4 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmOwnership}
                      onChange={event => setConfirmOwnership(event.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-muted-foreground">
                      Confirmo que este documento me pertence e que os dados carregados são verdadeiros.
                    </span>
                  </label>

                  {documentError && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{documentError}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(2)} disabled={isProcessing}>
                  Voltar
                </Button>

                {verification?.documentVerified ? (
                  <Button onClick={() => navigate('/dashboard')}>
                    Ir para o dashboard
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitDocument}
                    disabled={isProcessing || documentPending}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A enviar
                      </>
                    ) : documentPending ? (
                      'Documento em análise'
                    ) : (
                      'Enviar para análise'
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

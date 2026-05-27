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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getVerificationStatus, updateVerificationStatus } from '../data/mockTrust';
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

  const verification = getVerificationStatus(user?.id || '');
  const isLandlord = user?.type === 'landlord';

  const initialStep = !verification?.emailVerified
    ? 1
    : !verification?.universityEmailVerified
    ? 2
    : !verification?.documentVerified
    ? 3
    : 3;

  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [uniEmail, setUniEmail] = useState('');
  const [uniEmailError, setUniEmailError] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [confirmOwnership, setConfirmOwnership] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [docUnderReview, setDocUnderReview] = useState<boolean>(!!verification?.documentVerified);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allDone = !!(
    verification?.emailVerified &&
    verification?.universityEmailVerified &&
    verification?.documentVerified
  );

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
        shortTitle: isLandlord ? 'Email pro' : 'Email .edu',
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

  const completedCount = steps.filter(s => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  const handleVerifyEmail = async () => {
    const value = email.trim();
    if (!value) {
      setEmailError('O email é obrigatório.');
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setEmailError('Insere um email com formato válido (ex: nome@exemplo.com).');
      return;
    }
    setEmailError(null);
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 900));
    updateVerificationStatus(user?.id || '', { emailVerified: true });
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
      setUniEmailError('Tem de ser um email institucional (ex: aluno@universidade.pt ou domínio académico).');
      return;
    }
    setUniEmailError(null);
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 900));
    updateVerificationStatus(user?.id || '', { universityEmailVerified: true });
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
    setDocumentError(null);
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    updateVerificationStatus(user?.id || '', {
      documentVerified: true,
      verifiedAt: new Date(),
    });
    setDocUnderReview(true);
    setIsProcessing(false);
    toast.success('Documento enviado para análise.');
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
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {allDone ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Verificado
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
              Completa os 3 passos abaixo para que a tua conta seja considerada verificada na UniRoom.
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
                onChange={e => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="nome@exemplo.com"
                error={emailError || undefined}
                disabled={verification?.emailVerified || isProcessing}
                autoComplete="email"
              />

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Os teus dados são usados apenas para verificação e nunca são partilhados publicamente.
                </p>
                <Button
                  onClick={handleVerifyEmail}
                  disabled={isProcessing || verification?.emailVerified}
                  className="sm:w-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />A verificar
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
                  {isLandlord ? 'Confirma o teu email profissional' : 'Confirma o teu email universitário'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isLandlord
                    ? 'Usa um email profissional associado à gestão dos teus alojamentos.'
                    : 'Tem de ser o email institucional fornecido pela tua universidade ou politécnico (ex: .edu, .ac., uminho.pt, ipv.pt).'}
                </p>
              </div>

              {!verification?.emailVerified && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Confirma primeiro o email pessoal no passo 1.
                </div>
              )}

              <Input
                type="email"
                label={isLandlord ? 'Email profissional' : 'Email universitário'}
                value={uniEmail}
                onChange={e => {
                  setUniEmail(e.target.value);
                  if (uniEmailError) setUniEmailError(null);
                }}
                placeholder={isLandlord ? 'contacto@empresa.pt' : 'aluno@universidade.pt'}
                error={uniEmailError || undefined}
                disabled={verification?.universityEmailVerified || !verification?.emailVerified || isProcessing}
                autoComplete="email"
              />

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  disabled={isProcessing}
                  className="sm:w-auto"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleVerifyUniEmail}
                  disabled={isProcessing || verification?.universityEmailVerified || !verification?.emailVerified}
                  className="sm:w-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />A verificar
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
                <h2 className="text-xl font-bold text-foreground">Carrega o teu documento</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isLandlord
                    ? 'Cartão de cidadão ou comprovativo de titularidade/gestão do alojamento.'
                    : 'Cartão de cidadão, passaporte ou cartão de estudante com foto.'}
                </p>
              </div>

              {!verification?.universityEmailVerified && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Confirma primeiro o email do passo 2.
                </div>
              )}

              {docUnderReview ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-blue-900">Documento em análise</p>
                      <p className="mt-1 text-xs leading-relaxed text-blue-800">
                        Recebemos o teu documento. A equipa UniRoom analisa-o em até 48 horas e a tua conta passa a "Verificada"
                        assim que ficar aprovado.
                      </p>
                      {documentFile && (
                        <p className="mt-2 truncate text-xs text-blue-700">
                          <span className="font-semibold">Ficheiro:</span> {documentFile.name} ({formatBytes(documentFile.size)})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    onClick={() => verification?.universityEmailVerified && fileInputRef.current?.click()}
                    onDragOver={e => {
                      e.preventDefault();
                      if (verification?.universityEmailVerified) setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setDragActive(false);
                      if (!verification?.universityEmailVerified) return;
                      handleFileSelected(e.dataTransfer.files?.[0]);
                    }}
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                      !verification?.universityEmailVerified
                        ? 'border-border bg-muted/30 cursor-not-allowed opacity-60'
                        : dragActive
                        ? 'border-primary bg-primary/5'
                        : documentFile
                        ? 'border-green-300 bg-green-50/50'
                        : 'border-border hover:border-primary hover:bg-muted/30'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      className="hidden"
                      onChange={e => handleFileSelected(e.target.files?.[0])}
                    />
                    {documentFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
                          <Check className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Documento selecionado</p>
                        <p className="truncate max-w-full text-xs text-muted-foreground">
                          {documentFile.name} — {formatBytes(documentFile.size)}
                        </p>
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary hover:underline"
                          onClick={e => {
                            e.stopPropagation();
                            setDocumentFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          Trocar ficheiro
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          Arrasta o ficheiro ou clica para escolher
                        </p>
                        <p className="text-xs text-muted-foreground">PDF, JPG ou PNG — até 8 MB</p>
                      </div>
                    )}
                  </div>

                  {documentError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      {documentError}
                    </div>
                  )}

                  <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmOwnership}
                      onChange={e => setConfirmOwnership(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">
                      Confirmo que o documento é meu e corresponde aos dados da conta.
                    </span>
                  </label>

                  <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      disabled={isProcessing}
                      className="sm:w-auto"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handleSubmitDocument}
                      disabled={
                        isProcessing ||
                        !verification?.universityEmailVerified ||
                        !documentFile ||
                        !confirmOwnership
                      }
                      className="sm:w-auto"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />A enviar
                        </>
                      ) : (
                        'Enviar para análise'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5 mt-6">
          <h3 className="text-sm font-bold text-foreground mb-3">Porque pedimos verificação</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['Mais segurança', 'Reduz contas falsas e fraude na plataforma.'],
              ['Mais confiança', 'Senhorios e estudantes preferem perfis verificados.'],
              ['Melhores candidaturas', 'Perfis verificados destacam-se no processo.'],
              ['Dados protegidos', 'O documento é usado apenas para verificação.'],
            ].map(([title, desc]) => (
              <li key={title} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => navigate(isLandlord ? '/landlord/dashboard' : '/dashboard')}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Voltar ao dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}

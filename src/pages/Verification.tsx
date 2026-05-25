import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Mail, GraduationCap, FileText, Camera, Check, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getVerificationStatus, updateVerificationStatus, getVerificationBadge } from '../data/mockTrust';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { toast } from 'sonner';

export function Verification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isLandlord = user?.type === 'landlord';
  const verification = getVerificationStatus(user?.id || '');

  const steps = [
    { number: 1, title: 'Email pessoal', icon: Mail, completed: verification?.emailVerified },
    {
      number: 2,
      title: isLandlord ? 'Dados profissionais' : 'Email universitário',
      icon: isLandlord ? Building2 : GraduationCap,
      completed: verification?.universityEmailVerified,
    },
    {
      number: 3,
      title: isLandlord ? 'Identificação' : 'Documento',
      icon: FileText,
      completed: verification?.documentVerified,
    },
    { number: 4, title: 'Selfie', icon: Camera, completed: verification?.photoVerified },
  ];

  const copy = isLandlord
    ? {
        pageTitle: 'Verificação de senhorio',
        intro: 'Confirma a tua identidade e aumenta a confiança dos estudantes nos teus anúncios.',
        secondTitle: 'Dados profissionais',
        secondDescription: 'Confirma um email profissional ou de contacto associado à gestão dos teus alojamentos.',
        secondPlaceholder: 'contacto@alojamento.pt',
        secondHelp: 'Usa um email que possas associar à tua atividade como senhorio.',
        secondToast: 'Dados profissionais verificados!',
        documentTitle: 'Documento de identificação',
        documentDescription: 'Faz upload de um documento de identificação ou comprovativo de titularidade/gestão do alojamento.',
        documentNote: 'Este passo ajuda a reduzir fraude, anúncios falsos e pedidos de pagamento suspeitos.',
        photoDescription: 'Tira uma selfie para confirmar que és a pessoa responsável pela conta.',
        goldDescription: 'Nível Ouro: senhorio verificado, mais confiança e maior destaque nos sinais de segurança.',
        completeDestination: '/landlord/dashboard',
        completeToastDescription: 'O teu perfil de senhorio ficou mais confiável para estudantes.',
        benefits: [
          ['Mais confiança', 'Os estudantes reconhecem perfis de senhorio verificados.'],
          ['Mais respostas qualificadas', 'Candidatos sentem-se mais seguros ao contactar-te.'],
          ['Sinais de segurança', 'Os teus anúncios ganham contexto de confiança.'],
          ['Menos fricção', 'A verificação reduz dúvidas antes da visita.'],
        ],
      }
    : {
        pageTitle: 'Verificação de conta',
        intro: 'Aumenta a tua credibilidade e acede a mais funcionalidades.',
        secondTitle: 'Email universitário',
        secondDescription: 'Verifica o teu email institucional para confirmar que és estudante.',
        secondPlaceholder: 'estudante@universidade.pt',
        secondHelp: 'Usa o email fornecido pela tua universidade.',
        secondToast: 'Email universitário verificado!',
        documentTitle: 'Upload de documento',
        documentDescription: 'Faz upload do cartão de estudante ou documento de identificação.',
        documentNote: 'Este passo é opcional, mas aumenta significativamente a tua credibilidade na plataforma.',
        photoDescription: 'Tira uma selfie para completar a verificação total.',
        goldDescription: 'Nível Ouro: verificação completa e máxima credibilidade na plataforma.',
        completeDestination: '/profile',
        completeToastDescription: 'Parabéns! Atingiste o nível Ouro.',
        benefits: [
          ['Maior credibilidade', 'Senhorios confiam mais em perfis verificados.'],
          ['Prioridade nas candidaturas', 'O teu perfil fica mais forte quando te candidatas.'],
          ['Mais segurança', 'A plataforma consegue reduzir perfis falsos.'],
          ['Badge de confiança', 'Destaque visual no teu perfil.'],
        ],
      };

  const handleVerifyEmail = async () => {
    if (!email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1200));

    updateVerificationStatus(user?.id || '', { emailVerified: true });
    toast.success('Email verificado com sucesso!');
    setIsProcessing(false);
    setCurrentStep(2);
  };

  const handleVerifySecondaryStep = async () => {
    if (!secondaryEmail.includes('@') || !secondaryEmail.includes('.')) {
      toast.error(isLandlord ? 'Insere um email de contacto válido' : 'Por favor, usa um email universitário válido');
      return;
    }

    if (!isLandlord && !secondaryEmail.includes('.edu') && !secondaryEmail.includes('.pt')) {
      toast.error('Por favor, usa um email universitário válido');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1600));

    updateVerificationStatus(user?.id || '', { universityEmailVerified: true });
    toast.success(copy.secondToast);
    setIsProcessing(false);
    setCurrentStep(3);
  };

  const handleUploadDocument = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1600));

    updateVerificationStatus(user?.id || '', { documentVerified: true });
    toast.success('Documento verificado com sucesso!');
    setIsProcessing(false);
    setCurrentStep(4);
  };

  const handleUploadPhoto = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1600));

    updateVerificationStatus(user?.id || '', {
      photoVerified: true,
      verifiedAt: new Date(),
    });

    toast.success('Verificação completa!', {
      description: copy.completeToastDescription,
    });

    setIsProcessing(false);

    setTimeout(() => {
      navigate(copy.completeDestination);
    }, 1200);
  };

  const currentVerification = getVerificationStatus(user?.id || '');
  const badge = currentVerification ? getVerificationBadge(currentVerification.level) : null;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">{copy.pageTitle}</h1>

          <p className="text-muted-foreground">
            {copy.intro}
          </p>
        </div>

        {currentVerification && currentVerification.level !== 'none' && (
          <Card className="p-6 mb-8 text-center">
            <div className="text-4xl mb-3">{badge?.icon}</div>

            <h2 className="text-xl font-semibold text-foreground mb-1">
              Nível {badge?.label}
            </h2>

            <p className="text-muted-foreground text-sm">
              Continua a verificação para desbloquear o próximo nível.
            </p>
          </Card>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = step.completed;

              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-primary text-white ring-4 ring-blue-100'
                          : 'bg-muted text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>

                    <p
                      className={`text-xs font-medium text-center ${
                        isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`w-full h-1 mx-2 ${
                        steps[index + 1].completed ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Card className="p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-3">Verificar email</h2>
                <p className="text-muted-foreground">
                  Confirma o teu email pessoal para começar o processo de verificação.
                </p>
              </div>

              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu.email@exemplo.com"
                disabled={verification?.emailVerified}
              />

              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-foreground">
                  <strong>Nível Bronze:</strong> verificação de email básica.
                </div>
              </div>

              <Button
                onClick={handleVerifyEmail}
                className="w-full"
                disabled={isProcessing || verification?.emailVerified}
              >
                {isProcessing ? 'A verificar...' : verification?.emailVerified ? 'Verificado' : 'Verificar email'}
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                {isLandlord ? (
                  <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
                ) : (
                  <GraduationCap className="w-12 h-12 text-primary mx-auto mb-4" />
                )}
                <h2 className="text-2xl font-bold text-foreground mb-3">{copy.secondTitle}</h2>
                <p className="text-muted-foreground">
                  {copy.secondDescription}
                </p>
              </div>

              <div>
                <Input
                  type="email"
                  value={secondaryEmail}
                  onChange={(event) => setSecondaryEmail(event.target.value)}
                  placeholder={copy.secondPlaceholder}
                  disabled={verification?.universityEmailVerified}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {copy.secondHelp}
                </p>
              </div>

              <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-foreground">
                  <strong>Nível Prata:</strong> {isLandlord ? 'senhorio com contacto profissional confirmado.' : 'estudante verificado.'}
                </div>
              </div>

              <Button
                onClick={handleVerifySecondaryStep}
                className="w-full"
                disabled={isProcessing || verification?.universityEmailVerified}
              >
                {isProcessing ? 'A verificar...' : verification?.universityEmailVerified ? 'Verificado' : `Verificar ${isLandlord ? 'dados profissionais' : 'email universitário'}`}
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-3">{copy.documentTitle}</h2>
                <p className="text-muted-foreground">
                  {copy.documentDescription}
                </p>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Clica para fazer upload ou arrasta o ficheiro.
                </p>
                <p className="text-xs text-muted-foreground">PDF, JPG ou PNG até 5MB</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-foreground">
                  {copy.documentNote}
                </p>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setCurrentStep(4)} variant="outline" className="flex-1">
                  Saltar
                </Button>

                <Button onClick={handleUploadDocument} className="flex-1" disabled={isProcessing}>
                  {isProcessing ? 'A processar...' : 'Enviar documento'}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-3">Selfie de verificação</h2>
                <p className="text-muted-foreground">
                  {copy.photoDescription}
                </p>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Tira uma selfie ou faz upload de uma foto.
                </p>
                <p className="text-xs text-muted-foreground">JPG ou PNG</p>
              </div>

              <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm text-foreground">
                  <strong>{copy.goldDescription}</strong>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => navigate(copy.completeDestination)} variant="outline" className="flex-1">
                  Concluir mais tarde
                </Button>

                <Button onClick={handleUploadPhoto} className="flex-1" disabled={isProcessing}>
                  {isProcessing ? 'A processar...' : 'Enviar selfie'}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6 mt-8">
          <h3 className="font-semibold text-foreground mb-4">Vantagens da verificação</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {copy.benefits.map(([title, description]) => (
              <div key={title} className="flex items-start gap-4">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
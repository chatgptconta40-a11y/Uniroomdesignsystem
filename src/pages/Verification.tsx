import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Mail, GraduationCap, FileText, Camera, Check } from 'lucide-react';
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
  const [universityEmail, setUniversityEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const verification = getVerificationStatus(user?.id || '');

  const steps = [
    { number: 1, title: 'Email pessoal', icon: Mail, completed: verification?.emailVerified },
    { number: 2, title: 'Email universitário', icon: GraduationCap, completed: verification?.universityEmailVerified },
    { number: 3, title: 'Documento', icon: FileText, completed: verification?.documentVerified },
    { number: 4, title: 'Selfie', icon: Camera, completed: verification?.photoVerified },
  ];

  const handleVerifyEmail = async () => {
    if (!email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    updateVerificationStatus(user?.id || '', { emailVerified: true });
    toast.success('Email verificado com sucesso!');
    setIsProcessing(false);
    setCurrentStep(2);
  };

  const handleVerifyUniversityEmail = async () => {
    if (!universityEmail.includes('@') || (!universityEmail.includes('.edu') && !universityEmail.includes('.pt'))) {
      toast.error('Por favor, usa um email universitário válido');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    updateVerificationStatus(user?.id || '', { universityEmailVerified: true });
    toast.success('Email universitário verificado!');
    setIsProcessing(false);
    setCurrentStep(3);
  };

  const handleUploadDocument = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    updateVerificationStatus(user?.id || '', { documentVerified: true });
    toast.success('Documento verificado com sucesso!');
    setIsProcessing(false);
    setCurrentStep(4);
  };

  const handleUploadPhoto = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    updateVerificationStatus(user?.id || '', {
      photoVerified: true,
      verifiedAt: new Date(),
    });

    toast.success('Verificação completa!', {
      description: 'Parabéns! Atingiste o nível Ouro.',
    });

    setIsProcessing(false);

    setTimeout(() => {
      navigate('/profile');
    }, 2000);
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

          <h1 className="text-3xl font-bold text-foreground mb-3">Verificação de conta</h1>

          <p className="text-muted-foreground">
            Aumenta a tua credibilidade e acede a mais funcionalidades.
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
                <GraduationCap className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-3">Email universitário</h2>
                <p className="text-muted-foreground">
                  Verifica o teu email institucional para confirmar que és estudante.
                </p>
              </div>

              <div>
                <Input
                  type="email"
                  value={universityEmail}
                  onChange={(event) => setUniversityEmail(event.target.value)}
                  placeholder="estudante@universidade.pt"
                  disabled={verification?.universityEmailVerified}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Usa o email fornecido pela tua universidade.
                </p>
              </div>

              <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-foreground">
                  <strong>Nível Prata:</strong> estudante verificado.
                </div>
              </div>

              <Button
                onClick={handleVerifyUniversityEmail}
                className="w-full"
                disabled={isProcessing || verification?.universityEmailVerified}
              >
                {isProcessing ? 'A verificar...' : verification?.universityEmailVerified ? 'Verificado' : 'Verificar email universitário'}
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-3">Upload de documento</h2>
                <p className="text-muted-foreground">
                  Faz upload do cartão de estudante ou documento de identificação.
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
                  Este passo é opcional, mas aumenta significativamente a tua credibilidade na plataforma.
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
                  Tira uma selfie para completar a verificação total.
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
                  <strong>Nível Ouro:</strong> verificação completa e máxima credibilidade na plataforma.
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => navigate('/profile')} variant="outline" className="flex-1">
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
            {[
              ['Maior credibilidade', 'Senhorios confiam mais em perfis verificados.'],
              ['Prioridade nas candidaturas', 'Aparecer em destaque nas pesquisas.'],
              ['Acesso antecipado', 'Novos alojamentos antes de outros.'],
              ['Badge de confiança', 'Destaque visual no teu perfil.'],
            ].map(([title, description]) => (
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
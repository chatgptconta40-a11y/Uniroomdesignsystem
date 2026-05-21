import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Home, User, Users, Home as HomeIcon, CheckCircle, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { Card } from '../components/Card';
import { OnboardingPersonal } from '../components/onboarding/OnboardingPersonal';
import { OnboardingLifestyle } from '../components/onboarding/OnboardingLifestyle';
import { OnboardingPreferences } from '../components/onboarding/OnboardingPreferences';
import { OnboardingWelcome } from '../components/onboarding/OnboardingWelcome';
import { StudentProfile, PersonalProfile, LifestyleProfile, AccommodationPreferences } from '../types/profile';
import { saveProfile, calculateCompleteness } from '../data/mockProfiles';
import { toast } from 'sonner';

export function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const [personalData, setPersonalData] = useState<Partial<PersonalProfile>>({
    userId: user?.id || '',
    fullName: user?.name || '',
  });

  const [lifestyleData, setLifestyleData] = useState<Partial<LifestyleProfile>>({
    userId: user?.id || '',
  });

  const [preferencesData, setPreferencesData] = useState<Partial<AccommodationPreferences>>({
    userId: user?.id || '',
  });

  const steps = [
    { number: 1, title: 'Perfil Pessoal', icon: User },
    { number: 2, title: 'Convivência', icon: Users },
    { number: 3, title: 'Preferências', icon: HomeIcon },
    { number: 4, title: 'Conclusão', icon: CheckCircle },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    toast.info('Podes completar o teu perfil mais tarde!');
    navigate('/dashboard');
  };

  const handleComplete = () => {
    const profile: StudentProfile = {
      personal: personalData as PersonalProfile,
      lifestyle: lifestyleData as LifestyleProfile,
      preferences: preferencesData as AccommodationPreferences,
      completeness: calculateCompleteness({
        personal: personalData as PersonalProfile,
        lifestyle: lifestyleData as LifestyleProfile,
        preferences: preferencesData as AccommodationPreferences,
      }),
      onboardingCompleted: true,
    };

    saveProfile(profile);
    toast.success('Perfil criado com sucesso!');
    navigate('/dashboard');
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <nav className="border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">UniRoom</span>
                <span className="text-xs text-muted-foreground">Configuração do Perfil</span>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <span className="text-sm">Saltar por agora</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Progress Steps */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      // Allow clicking on completed steps
                      if (step.number < currentStep) {
                        setCurrentStep(step.number);
                      }
                    }}
                    disabled={step.number > currentStep}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep === step.number
                        ? 'bg-primary text-white shadow-lg'
                        : currentStep > step.number
                        ? 'bg-secondary text-white cursor-pointer hover:shadow-md'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    <step.icon className="w-6 h-6" />
                  </button>
                  <p className={`text-xs mt-2 font-medium ${
                    currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                    currentStep > step.number ? 'bg-secondary' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <ProgressBar progress={progress} color="primary" />
        </div>

        {/* Step Content */}
        <Card className="p-8">
          {currentStep === 1 && (
            <OnboardingPersonal data={personalData} onChange={setPersonalData} />
          )}
          {currentStep === 2 && (
            <OnboardingLifestyle data={lifestyleData} onChange={setLifestyleData} />
          )}
          {currentStep === 3 && (
            <OnboardingPreferences data={preferencesData} onChange={setPreferencesData} />
          )}
          {currentStep === 4 && (
            <OnboardingWelcome
              completeness={calculateCompleteness({
                personal: personalData as PersonalProfile,
                lifestyle: lifestyleData as LifestyleProfile,
                preferences: preferencesData as AccommodationPreferences,
              })}
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </Button>
            ) : (
              <div></div>
            )}

            {currentStep < 4 ? (
              <Button variant="primary" onClick={handleNext} className="gap-2">
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleComplete} className="gap-2">
                Concluir
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

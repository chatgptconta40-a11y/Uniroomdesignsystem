import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Home,
  User,
  Users,
  Home as HomeIcon,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { Card } from '../components/Card';
import { OnboardingPersonal } from '../components/onboarding/OnboardingPersonal';
import { OnboardingLifestyle } from '../components/onboarding/OnboardingLifestyle';
import { OnboardingPreferences } from '../components/onboarding/OnboardingPreferences';
import { OnboardingWelcome } from '../components/onboarding/OnboardingWelcome';
import { StudentProfile, PersonalProfile, LifestyleProfile, AccommodationPreferences } from '../types/profile';
import { calculateCompleteness } from '../utils/profileCompleteness';
import { toast } from 'sonner';

type StepNumber = 1 | 2 | 3 | 4;

interface StepItem {
  number: StepNumber;
  title: string;
  icon: typeof User;
}

interface OnboardingDraft {
  currentStep: StepNumber;
  personalData: Partial<PersonalProfile>;
  lifestyleData: Partial<LifestyleProfile>;
  preferencesData: Partial<AccommodationPreferences>;
}

function isFilled(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

function getStepMissingFields(
  step: StepNumber,
  personalData: Partial<PersonalProfile>,
  lifestyleData: Partial<LifestyleProfile>,
  preferencesData: Partial<AccommodationPreferences>,
) {
  if (step === 1) {
    const missing: string[] = [];

    if (!isFilled(personalData.fullName)) missing.push('nome completo');
    if (!isFilled(personalData.age)) missing.push('idade');
    if (!isFilled(personalData.gender)) missing.push('género');
    if (!isFilled(personalData.institution)) missing.push('instituição de ensino');
    if (!isFilled(personalData.course)) missing.push('curso');
    if (!isFilled(personalData.yearOfStudy)) missing.push('ano de curso');
    if (!isFilled(personalData.hometown)) missing.push('cidade de origem');

    return missing;
  }

  if (step === 2) {
    const missing: string[] = [];

    if (!isFilled(lifestyleData.schedule)) missing.push('rotina diária');
    if (!isFilled(lifestyleData.cleanliness)) missing.push('organização');
    if (!isFilled(lifestyleData.noiseTolerance)) missing.push('tolerância ao ruído');
    if (!isFilled(lifestyleData.socialPreference)) missing.push('ambiente preferido');

    return missing;
  }

  if (step === 3) {
    const missing: string[] = [];

    if (!isFilled(preferencesData.maxBudget)) missing.push('orçamento máximo');
    if (!isFilled(preferencesData.preferredCities)) missing.push('cidade pretendida');
    if (!isFilled(preferencesData.roomType)) missing.push('tipo de alojamento');

    return missing;
  }

  return [];
}

export function Onboarding() {
  const { user, saveStudentProfile } = useAuth();
  const navigate = useNavigate();

  const [draftLoaded, setDraftLoaded] = useState(false);
  const [hadDraft, setHadDraft] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [showValidation, setShowValidation] = useState(false);

  const [personalData, setPersonalData] = useState<Partial<PersonalProfile>>({
    userId: user?.id || '',
    fullName: user?.name || '',
  });

  const [lifestyleData, setLifestyleData] = useState<Partial<LifestyleProfile>>({
    userId: user?.id || '',
  });

  const [preferencesData, setPreferencesData] = useState<Partial<AccommodationPreferences>>({
    userId: user?.id || '',
    preferredCities: ['Viseu'],
    maxDistanceFromUniversity: 3,
  });

  // Carregar rascunho de profiles.onboarding_draft
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_draft')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error('[Onboarding] load draft:', error.message);
        setDraftLoaded(true);
        return;
      }
      const draft = data?.onboarding_draft as OnboardingDraft | null;
      if (draft && typeof draft === 'object') {
        if (draft.currentStep) setCurrentStep(draft.currentStep);
        if (draft.personalData) setPersonalData(draft.personalData);
        if (draft.lifestyleData) setLifestyleData(draft.lifestyleData);
        if (draft.preferencesData) setPreferencesData(draft.preferencesData);
        setHadDraft(true);
      }
      setDraftLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Guardar rascunho no Supabase com debounce ~500ms
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user?.id || !draftLoaded || currentStep === 4) return;
    const draftToSave: OnboardingDraft = {
      currentStep,
      personalData,
      lifestyleData,
      preferencesData,
    };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_draft: draftToSave })
        .eq('id', user.id);
      if (error) console.error('[Onboarding] save draft:', error.message);
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [currentStep, personalData, lifestyleData, preferencesData, draftLoaded, user?.id]);

  const steps: StepItem[] = [
    { number: 1, title: 'Perfil pessoal', icon: User },
    { number: 2, title: 'Convivência', icon: Users },
    { number: 3, title: 'Preferências', icon: HomeIcon },
    { number: 4, title: 'Conclusão', icon: CheckCircle },
  ];

  const completeness = useMemo(
    () =>
      calculateCompleteness({
        personal: personalData as PersonalProfile,
        lifestyle: lifestyleData as LifestyleProfile,
        preferences: preferencesData as AccommodationPreferences,
      }),
    [personalData, lifestyleData, preferencesData],
  );

  const missingFields = getStepMissingFields(currentStep, personalData, lifestyleData, preferencesData);
  const canContinue = missingFields.length === 0 || currentStep === 4;
  const progress = (currentStep / 4) * 100;

  const handleNext = () => {
    if (currentStep >= 4) return;

    if (!canContinue) {
      setShowValidation(true);
      toast.warning('Preenche os campos obrigatórios antes de continuar.');
      return;
    }

    setShowValidation(false);
    setCurrentStep((currentStep + 1) as StepNumber);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setShowValidation(false);
      setCurrentStep((currentStep - 1) as StepNumber);
    }
  };

  const handleComplete = async () => {
    const profile: StudentProfile = {
      personal: {
        userId: user?.id || personalData.userId || '',
        fullName: personalData.fullName || user?.name || 'Estudante',
        ...personalData,
      } as PersonalProfile,
      lifestyle: {
        userId: user?.id || lifestyleData.userId || '',
        ...lifestyleData,
      } as LifestyleProfile,
      preferences: {
        userId: user?.id || preferencesData.userId || '',
        ...preferencesData,
      } as AccommodationPreferences,
      completeness,
      onboardingCompleted: true,
    };

    const result = await saveStudentProfile(profile);
    if (!result.success) {
      toast.error(result.error || 'Erro ao guardar perfil.');
      return;
    }

    if (user?.id) {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_draft: null })
        .eq('id', user.id);
      if (error) console.error('[Onboarding] clear draft:', error.message);
    }

    toast.success('Perfil criado com sucesso.');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <nav className="border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Home className="w-5 h-5 text-white" />
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold text-foreground">UniRoom</span>
                <span className="text-xs text-muted-foreground">Configuração obrigatória do perfil</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
              Perfil obrigatório
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {hadDraft && currentStep > 1 && (
          <div className="mb-4 p-4 rounded-xl border border-primary/20 bg-primary/5 text-primary flex items-center gap-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm font-medium">Retomámos de onde ficaste. Os teus dados estão guardados.</p>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (step.number < currentStep) {
                        setShowValidation(false);
                        setCurrentStep(step.number);
                      }
                    }}
                    disabled={step.number > currentStep}
                    className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep === step.number
                        ? 'bg-primary text-white shadow-lg'
                        : currentStep > step.number
                          ? 'bg-secondary text-white cursor-pointer hover:shadow-md'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                    aria-label={step.title}
                  >
                    <step.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </button>

                  <p
                    className={`text-[11px] md:text-xs mt-2 font-medium text-center ${
                      currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors mt-5 ${
                      currentStep > step.number ? 'bg-secondary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <ProgressBar progress={progress} color="primary" />
        </div>

        {showValidation && missingFields.length > 0 && (
          <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />

            <div>
              <p className="font-semibold text-sm">Faltam campos obrigatórios.</p>
              <p className="text-sm mt-0.5">Preenche: {missingFields.join(', ')}.</p>
            </div>
          </div>
        )}

        <Card className="p-5 md:p-8">
          {currentStep === 1 && <OnboardingPersonal data={personalData} onChange={setPersonalData} />}
          {currentStep === 2 && <OnboardingLifestyle data={lifestyleData} onChange={setLifestyleData} />}
          {currentStep === 3 && <OnboardingPreferences data={preferencesData} onChange={setPreferencesData} />}
          {currentStep === 4 && <OnboardingWelcome completeness={completeness} />}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </Button>
            ) : (
              <div />
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
      </main>
    </div>
  );
}

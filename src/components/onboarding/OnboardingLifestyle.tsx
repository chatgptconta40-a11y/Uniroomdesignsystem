import { LifestyleProfile } from '../../types/profile';
import { Slider } from '../Slider';
import { OptionCard } from '../OptionCard';
import { Users, Moon, Sun, Sparkles, Volume2, UserPlus, Cigarette, Dog, ChefHat, MessageCircle } from 'lucide-react';

interface OnboardingLifestyleProps {
  data: Partial<LifestyleProfile>;
  onChange: (data: Partial<LifestyleProfile>) => void;
}

export function OnboardingLifestyle({ data, onChange }: OnboardingLifestyleProps) {
  const handleChange = (field: keyof LifestyleProfile, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-secondary/10 rounded-xl">
          <Users className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h2>Perfil de Convivência</h2>
          <p className="text-muted-foreground">
            Quanto mais completo, melhores serão as tuas sugestões de colegas de casa
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Horários */}
        <div className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Horários</h3>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                A que horas costumas deitar-te?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <OptionCard
                  selected={data.bedtime === 'early'}
                  onClick={() => handleChange('bedtime', 'early')}
                  title="Cedo"
                  description="Antes das 22h"
                />
                <OptionCard
                  selected={data.bedtime === 'moderate'}
                  onClick={() => handleChange('bedtime', 'moderate')}
                  title="Normal"
                  description="22h - 00h"
                />
                <OptionCard
                  selected={data.bedtime === 'late'}
                  onClick={() => handleChange('bedtime', 'late')}
                  title="Tarde"
                  description="Depois das 00h"
                />
              </div>
            </div>

            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                A que horas costumas acordar?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <OptionCard
                  selected={data.wakeupTime === 'early'}
                  onClick={() => handleChange('wakeupTime', 'early')}
                  title="Cedo"
                  description="Antes das 7h"
                />
                <OptionCard
                  selected={data.wakeupTime === 'moderate'}
                  onClick={() => handleChange('wakeupTime', 'moderate')}
                  title="Normal"
                  description="7h - 9h"
                />
                <OptionCard
                  selected={data.wakeupTime === 'late'}
                  onClick={() => handleChange('wakeupTime', 'late')}
                  title="Tarde"
                  description="Depois das 9h"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Limpeza */}
        <div className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Limpeza e Organização</h3>
          </div>
          <div className="space-y-5">
            <Slider
              label="Quão organizado(a) és?"
              min={1}
              max={5}
              value={data.cleanliness || 3}
              onChange={(value) => handleChange('cleanliness', value)}
              labels={{ min: 'Desorganizado', max: 'Muito organizado' }}
            />

            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                Com que frequência limpas espaços comuns?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <OptionCard
                  selected={data.cleaningFrequency === 'daily'}
                  onClick={() => handleChange('cleaningFrequency', 'daily')}
                  title="Diariamente"
                />
                <OptionCard
                  selected={data.cleaningFrequency === 'weekly'}
                  onClick={() => handleChange('cleaningFrequency', 'weekly')}
                  title="Semanalmente"
                />
                <OptionCard
                  selected={data.cleaningFrequency === 'monthly'}
                  onClick={() => handleChange('cleaningFrequency', 'monthly')}
                  title="Mensalmente"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ruído */}
        <div className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Ruído</h3>
          </div>
          <div className="space-y-5">
            <Slider
              label="Qual é a tua tolerância ao ruído?"
              min={1}
              max={5}
              value={data.noiseTolerance || 3}
              onChange={(value) => handleChange('noiseTolerance', value)}
              labels={{ min: 'Baixa', max: 'Alta' }}
            />

            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                Com que volume costumas ouvir música?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <OptionCard
                  selected={data.musicVolume === 'quiet'}
                  onClick={() => handleChange('musicVolume', 'quiet')}
                  title="Baixo"
                />
                <OptionCard
                  selected={data.musicVolume === 'moderate'}
                  onClick={() => handleChange('musicVolume', 'moderate')}
                  title="Moderado"
                />
                <OptionCard
                  selected={data.musicVolume === 'loud'}
                  onClick={() => handleChange('musicVolume', 'loud')}
                  title="Alto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visitas */}
        <div className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Visitas</h3>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                Com que frequência recebes visitas?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <OptionCard
                  selected={data.guestsFrequency === 'never'}
                  onClick={() => handleChange('guestsFrequency', 'never')}
                  title="Nunca"
                />
                <OptionCard
                  selected={data.guestsFrequency === 'rarely'}
                  onClick={() => handleChange('guestsFrequency', 'rarely')}
                  title="Raramente"
                />
                <OptionCard
                  selected={data.guestsFrequency === 'sometimes'}
                  onClick={() => handleChange('guestsFrequency', 'sometimes')}
                  title="Às vezes"
                />
                <OptionCard
                  selected={data.guestsFrequency === 'often'}
                  onClick={() => handleChange('guestsFrequency', 'often')}
                  title="Frequentemente"
                />
              </div>
            </div>

            <Slider
              label="Quão confortável és com visitas em casa?"
              min={1}
              max={5}
              value={data.guestsAcceptance || 3}
              onChange={(value) => handleChange('guestsAcceptance', value)}
              labels={{ min: 'Pouco confortável', max: 'Muito confortável' }}
            />
          </div>
        </div>

        {/* Hábitos */}
        <div className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Hábitos</h3>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block mb-3 text-sm font-medium text-foreground">
                  Fumas?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <OptionCard
                    selected={data.smoking === true}
                    onClick={() => handleChange('smoking', true)}
                    icon={<Cigarette className="w-5 h-5 text-primary" />}
                    title="Sim"
                  />
                  <OptionCard
                    selected={data.smoking === false}
                    onClick={() => handleChange('smoking', false)}
                    title="Não"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-3 text-sm font-medium text-foreground">
                  Tens animais de estimação?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <OptionCard
                    selected={data.pets === true}
                    onClick={() => handleChange('pets', true)}
                    icon={<Dog className="w-5 h-5 text-primary" />}
                    title="Sim"
                  />
                  <OptionCard
                    selected={data.pets === false}
                    onClick={() => handleChange('pets', false)}
                    title="Não"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                Com que frequência cozinhas em casa?
              </label>
              <div className="grid grid-cols-4 gap-3">
                <OptionCard
                  selected={data.cooking === 'never'}
                  onClick={() => handleChange('cooking', 'never')}
                  title="Nunca"
                />
                <OptionCard
                  selected={data.cooking === 'rarely'}
                  onClick={() => handleChange('cooking', 'rarely')}
                  title="Raramente"
                />
                <OptionCard
                  selected={data.cooking === 'sometimes'}
                  onClick={() => handleChange('cooking', 'sometimes')}
                  title="Às vezes"
                />
                <OptionCard
                  selected={data.cooking === 'often'}
                  onClick={() => handleChange('cooking', 'often')}
                  title="Frequentemente"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social */}
        <div className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Personalidade e Ambiente Social</h3>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                Como te descreves?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <OptionCard
                  selected={data.personality === 'introvert'}
                  onClick={() => handleChange('personality', 'introvert')}
                  title="Introvertido"
                  description="Prefiro tempo sozinho"
                />
                <OptionCard
                  selected={data.personality === 'moderate'}
                  onClick={() => handleChange('personality', 'moderate')}
                  title="Equilibrado"
                  description="Depende do dia"
                />
                <OptionCard
                  selected={data.personality === 'extrovert'}
                  onClick={() => handleChange('personality', 'extrovert')}
                  title="Extrovertido"
                  description="Adoro socializar"
                />
              </div>
            </div>

            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                Que tipo de ambiente preferes em casa?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <OptionCard
                  selected={data.socialPreference === 'quiet'}
                  onClick={() => handleChange('socialPreference', 'quiet')}
                  title="Tranquilo"
                  description="Espaço calmo e privado"
                />
                <OptionCard
                  selected={data.socialPreference === 'moderate'}
                  onClick={() => handleChange('socialPreference', 'moderate')}
                  title="Equilibrado"
                  description="Mix de ambos"
                />
                <OptionCard
                  selected={data.socialPreference === 'social'}
                  onClick={() => handleChange('socialPreference', 'social')}
                  title="Social"
                  description="Convívio frequente"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-secondary/10 border border-secondary/20 rounded-xl">
          <p className="text-sm text-secondary-foreground">
            💡 <strong>Dica:</strong> Quanto mais completo o teu perfil de convivência, melhores serão os teus matches e menos conflitos terás com os teus colegas de casa.
          </p>
        </div>
      </div>
    </div>
  );
}

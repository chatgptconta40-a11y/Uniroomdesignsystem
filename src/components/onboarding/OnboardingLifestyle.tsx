import { LifestyleProfile } from '../../types/profile';
import { Slider } from '../Slider';
import { OptionCard } from '../OptionCard';
import {
  Users,
  Moon,
  Clock3,
  Sparkles,
  Volume2,
  UserPlus,
  Cigarette,
  Dog,
  ChefHat,
  MessageCircle,
  Info,
} from 'lucide-react';

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
            Estas respostas ajudam a calcular compatibilidade com casas partilhadas e futuros colegas.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Rotina diária</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                Como é normalmente a tua rotina?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <OptionCard
                  selected={data.schedule === 'morning'}
                  onClick={() => handleChange('schedule', 'morning')}
                  title="Mais matinal"
                  description="Funciono melhor cedo"
                />
                <OptionCard
                  selected={data.schedule === 'flexible'}
                  onClick={() => handleChange('schedule', 'flexible')}
                  title="Flexível"
                  description="Adapto-me bem"
                />
                <OptionCard
                  selected={data.schedule === 'night'}
                  onClick={() => handleChange('schedule', 'night')}
                  title="Mais noturna"
                  description="Estudo ou trabalho tarde"
                />
              </div>
            </div>

            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                A que horas costumas deitar-te?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <OptionCard
                  selected={data.bedtime === 'early'}
                  onClick={() => handleChange('bedtime', 'early')}
                  icon={<Moon className="w-5 h-5 text-primary" />}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

        <div className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Limpeza e organização</h3>
          </div>

          <div className="space-y-5">
            <Slider
              label="Quão importante é para ti manter a casa organizada?"
              min={1}
              max={5}
              value={data.cleanliness || 3}
              onChange={(value) => handleChange('cleanliness', value)}
              labels={{ min: 'Sou relaxado(a)', max: 'Muito importante' }}
            />

            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                Com que frequência achas justo limpar espaços comuns?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <OptionCard
                  selected={data.cleaningFrequency === 'daily'}
                  onClick={() => handleChange('cleaningFrequency', 'daily')}
                  title="Todos os dias"
                  description="Pequenas tarefas diárias"
                />
                <OptionCard
                  selected={data.cleaningFrequency === 'weekly'}
                  onClick={() => handleChange('cleaningFrequency', 'weekly')}
                  title="Semanalmente"
                  description="Rotina combinada"
                />
                <OptionCard
                  selected={data.cleaningFrequency === 'monthly'}
                  onClick={() => handleChange('cleaningFrequency', 'monthly')}
                  title="Pontualmente"
                  description="Quando for necessário"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Ruído e descanso</h3>
          </div>

          <div className="space-y-5">
            <Slider
              label="Quão tolerante és a ruído em casa?"
              min={1}
              max={5}
              value={data.noiseTolerance || 3}
              onChange={(value) => handleChange('noiseTolerance', value)}
              labels={{ min: 'Preciso de silêncio', max: 'Sou tolerante' }}
            />

            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                Como costumas ouvir música ou ver conteúdos?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <OptionCard
                  selected={data.musicVolume === 'quiet'}
                  onClick={() => handleChange('musicVolume', 'quiet')}
                  title="Baixo"
                  description="Quase sempre discreto"
                />
                <OptionCard
                  selected={data.musicVolume === 'moderate'}
                  onClick={() => handleChange('musicVolume', 'moderate')}
                  title="Moderado"
                  description="Volume normal"
                />
                <OptionCard
                  selected={data.musicVolume === 'loud'}
                  onClick={() => handleChange('musicVolume', 'loud')}
                  title="Alto"
                  description="Gosto de som presente"
                />
              </div>
            </div>
          </div>
        </div>

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
              label="Quão confortável estás com visitas de colegas em casa?"
              min={1}
              max={5}
              value={data.guestsAcceptance || 3}
              onChange={(value) => handleChange('guestsAcceptance', value)}
              labels={{ min: 'Prefiro evitar', max: 'Totalmente confortável' }}
            />
          </div>
        </div>

        <div className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Hábitos do dia a dia</h3>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  Tens animais de estimação contigo?
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

        <div className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Ambiente social</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                Como te descreves em casa?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <OptionCard
                  selected={data.personality === 'introvert'}
                  onClick={() => handleChange('personality', 'introvert')}
                  title="Reservado(a)"
                  description="Valorizo espaço pessoal"
                />
                <OptionCard
                  selected={data.personality === 'moderate'}
                  onClick={() => handleChange('personality', 'moderate')}
                  title="Equilibrado(a)"
                  description="Depende do contexto"
                />
                <OptionCard
                  selected={data.personality === 'extrovert'}
                  onClick={() => handleChange('personality', 'extrovert')}
                  title="Sociável"
                  description="Gosto de convívio"
                />
              </div>
            </div>

            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                Que ambiente preferes numa casa partilhada?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <OptionCard
                  selected={data.socialPreference === 'quiet'}
                  onClick={() => handleChange('socialPreference', 'quiet')}
                  title="Tranquilo"
                  description="Casa calma e privada"
                />
                <OptionCard
                  selected={data.socialPreference === 'moderate'}
                  onClick={() => handleChange('socialPreference', 'moderate')}
                  title="Equilibrado"
                  description="Respeito e algum convívio"
                />
                <OptionCard
                  selected={data.socialPreference === 'social'}
                  onClick={() => handleChange('socialPreference', 'social')}
                  title="Social"
                  description="Ambiente mais próximo"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl flex gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Estas respostas não servem para excluir pessoas automaticamente. Servem para explicar melhor a compatibilidade,
            reduzir conflitos e ajudar o estudante a escolher uma casa onde se sinta confortável.
          </p>
        </div>
      </div>
    </div>
  );
}
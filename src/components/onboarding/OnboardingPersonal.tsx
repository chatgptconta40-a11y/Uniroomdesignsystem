import { PersonalProfile } from '../../types/profile';
import { Input } from '../Input';
import { OptionCard } from '../OptionCard';
import { User, GraduationCap, MapPin, Languages, MessageSquare, ShieldCheck } from 'lucide-react';

interface OnboardingPersonalProps {
  data: Partial<PersonalProfile>;
  onChange: (data: Partial<PersonalProfile>) => void;
}

export function OnboardingPersonal({ data, onChange }: OnboardingPersonalProps) {
  const handleChange = (field: keyof PersonalProfile, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const parseOptionalNumber = (value: string) => {
    if (!value) return undefined;
    return Number(value);
  };

  return (
    <div>
      <div className="flex items-start gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2>Perfil pessoal</h2>
          <p className="text-muted-foreground">
            Ajuda senhorios e futuros colegas a perceberem quem és antes de uma candidatura.
          </p>
        </div>
      </div>

      <div className="space-y-7">
        <section className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Identificação</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Nome completo"
              value={data.fullName || ''}
              onChange={(event) => handleChange('fullName', event.target.value)}
              placeholder="João Silva"
              helperText="Será mostrado nas candidaturas e mensagens."
            />

            <Input
              label="Idade"
              type="number"
              min={16}
              max={80}
              value={data.age || ''}
              onChange={(event) => handleChange('age', parseOptionalNumber(event.target.value))}
              placeholder="20"
            />
          </div>

          <div className="mt-5">
            <label className="block mb-3 text-sm font-medium text-foreground">
              Género
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'male', label: 'Masculino' },
                { value: 'female', label: 'Feminino' },
                { value: 'other', label: 'Outro' },
                { value: 'prefer_not_to_say', label: 'Prefiro não dizer' },
              ].map((option) => (
                <OptionCard
                  key={option.value}
                  selected={data.gender === option.value}
                  onClick={() => handleChange('gender', option.value)}
                  title={option.label}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Contexto académico</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Instituição de ensino"
              value={data.institution || ''}
              onChange={(event) => handleChange('institution', event.target.value)}
              placeholder="ESTGV - Instituto Politécnico de Viseu"
              helperText="Ajuda a calcular recomendações perto da tua universidade."
            />

            <Input
              label="Curso"
              value={data.course || ''}
              onChange={(event) => handleChange('course', event.target.value)}
              placeholder="Engenharia Informática"
            />

            <Input
              label="Ano de curso"
              type="number"
              min={1}
              max={6}
              value={data.yearOfStudy || ''}
              onChange={(event) => handleChange('yearOfStudy', parseOptionalNumber(event.target.value))}
              placeholder="1"
            />

            <Input
              label="Cidade de origem"
              value={data.hometown || ''}
              onChange={(event) => handleChange('hometown', event.target.value)}
              placeholder="Porto"
            />
          </div>
        </section>

        <section className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Apresentação</h3>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-foreground">
              Bio curta
            </label>

            <textarea
              value={data.bio || ''}
              onChange={(event) => handleChange('bio', event.target.value)}
              placeholder="Ex.: Sou estudante da ESTGV, procuro uma casa tranquila para estudar e valorizo boa comunicação com colegas de casa."
              className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground resize-none"
              rows={4}
              maxLength={280}
            />

            <div className="flex items-center justify-between mt-1.5">
              <p className="text-sm text-muted-foreground">
                Uma boa bio aumenta a confiança antes de contactar senhorios.
              </p>
              <span className="text-xs text-muted-foreground">
                {(data.bio || '').length}/280
              </span>
            </div>
          </div>

          <div className="mt-5">
            <Input
              label="Idiomas"
              value={data.languages?.join(', ') || ''}
              onChange={(event) =>
                handleChange(
                  'languages',
                  event.target.value
                    .split(',')
                    .map(language => language.trim())
                    .filter(Boolean)
                )
              }
              placeholder="Português, Inglês, Espanhol"
              helperText="Separa os idiomas por vírgulas."
            />
          </div>
        </section>

        <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl flex gap-3">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Estes dados ajudam a tornar candidaturas e conversas mais claras. Podes editar o perfil mais tarde.
          </p>
        </div>
      </div>
    </div>
  );
}
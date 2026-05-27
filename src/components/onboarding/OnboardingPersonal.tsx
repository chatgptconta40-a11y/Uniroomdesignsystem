import { PersonalProfile } from '../../types/profile';
import { Input } from '../Input';
import { OptionCard } from '../OptionCard';
import { User, GraduationCap, Languages, MessageSquare, ShieldCheck } from 'lucide-react';

interface OnboardingPersonalProps {
  data: Partial<PersonalProfile>;
  onChange: (data: Partial<PersonalProfile>) => void;
}

const INSTITUTIONS = [
  'ESTGV - Instituto Politécnico de Viseu',
  'Universidade de Coimbra',
  'Universidade do Porto',
  'Universidade de Lisboa',
  'Universidade do Minho',
  'Instituto Politécnico do Porto',
  'Instituto Politécnico de Coimbra',
  'Instituto Politécnico de Lisboa',
  'Universidade de Aveiro',
  'Universidade do Algarve',
  'Universidade da Beira Interior',
  'Instituto Politécnico de Bragança',
];

const COURSES = [
  'Engenharia Informática',
  'Desenvolvimento Web e Dispositivos Móveis',
  'Design e Multimédia',
  'Gestão',
  'Contabilidade',
  'Marketing',
  'Engenharia Civil',
  'Engenharia Mecânica',
  'Engenharia Eletrotécnica',
  'Enfermagem',
  'Educação Básica',
  'Comunicação Social',
  'Turismo',
  'Psicologia',
  'Arquitetura',
];

const YEARS = [
  { value: 1, label: '1.º ano' },
  { value: 2, label: '2.º ano' },
  { value: 3, label: '3.º ano' },
  { value: 4, label: '4.º ano' },
  { value: 5, label: '5.º ano' },
  { value: 6, label: '6.º ano' },
];

const HOMETOWNS = [
  'Viseu',
  'Porto',
  'Lisboa',
  'Coimbra',
  'Faro',
  'Braga',
  'Aveiro',
  'Guarda',
  'Bragança',
  'Vila Real',
  'Castelo Branco',
  'Leiria',
  'Santarém',
  'Setúbal',
  'Évora',
  'Beja',
  'Viana do Castelo',
  'Ponta Delgada',
  'Funchal',
];

function RequiredMark() {
  return <span className="ml-1 text-destructive">*</span>;
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
  helperText,
}: {
  label: string;
  value: string | number | undefined;
  placeholder: string;
  options: Array<string | { value: string | number; label: string }>;
  onChange: (value: string) => void;
  helperText?: string;
}) {
  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-foreground">
        {label}
        <RequiredMark />
      </label>

      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-14 px-4 bg-input-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((option) => {
          const item = typeof option === 'string' ? { value: option, label: option } : option;

          return (
            <option key={String(item.value)} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>

      {helperText && <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>}
    </div>
  );
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
            Preenche estes dados para poderes receber recomendações corretas e candidatar-te a quartos.
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
              helperText="Campo obrigatório. Será mostrado nas candidaturas e mensagens."
            />

            <Input
              label="Idade"
              type="number"
              min={16}
              max={80}
              value={data.age || ''}
              onChange={(event) => handleChange('age', parseOptionalNumber(event.target.value))}
              placeholder="20"
              helperText="Campo obrigatório."
            />
          </div>

          <div className="mt-5">
            <label className="block mb-3 text-sm font-medium text-foreground">
              Género
              <RequiredMark />
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
            <SelectField
              label="Instituição de ensino"
              value={data.institution}
              placeholder="Seleciona a tua instituição"
              options={INSTITUTIONS}
              onChange={(value) => handleChange('institution', value)}
              helperText="Ajuda a calcular recomendações perto da tua universidade."
            />

            <SelectField
              label="Curso"
              value={data.course}
              placeholder="Seleciona o teu curso"
              options={COURSES}
              onChange={(value) => handleChange('course', value)}
            />

            <SelectField
              label="Ano de curso"
              value={data.yearOfStudy}
              placeholder="Seleciona o ano"
              options={YEARS}
              onChange={(value) => handleChange('yearOfStudy', Number(value))}
            />

            <SelectField
              label="Cidade de origem"
              value={data.hometown}
              placeholder="Seleciona a tua cidade"
              options={HOMETOWNS}
              onChange={(value) => handleChange('hometown', value)}
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
                    .filter(Boolean),
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
            Os campos assinalados com * são obrigatórios. Estes dados tornam as recomendações e candidaturas mais fiáveis.
          </p>
        </div>
      </div>
    </div>
  );
}

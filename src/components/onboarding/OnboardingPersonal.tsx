import { PersonalProfile } from '../../types/profile';
import { Input } from '../Input';
import { User } from 'lucide-react';

interface OnboardingPersonalProps {
  data: Partial<PersonalProfile>;
  onChange: (data: Partial<PersonalProfile>) => void;
}

export function OnboardingPersonal({ data, onChange }: OnboardingPersonalProps) {
  const handleChange = (field: keyof PersonalProfile, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2>Perfil Pessoal</h2>
          <p className="text-muted-foreground">Conta-nos um pouco sobre ti</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Nome completo"
            value={data.fullName || ''}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="João Silva"
          />

          <Input
            label="Idade"
            type="number"
            value={data.age || ''}
            onChange={(e) => handleChange('age', Number(e.target.value))}
            placeholder="20"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-foreground">
            Género (opcional)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'male', label: 'Masculino' },
              { value: 'female', label: 'Feminino' },
              { value: 'other', label: 'Outro' },
              { value: 'prefer_not_to_say', label: 'Prefiro não dizer' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange('gender', option.value)}
                className={`p-3 border-2 rounded-xl transition-all ${
                  data.gender === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium">{option.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Curso"
            value={data.course || ''}
            onChange={(e) => handleChange('course', e.target.value)}
            placeholder="Engenharia Informática"
          />

          <Input
            label="Instituição de ensino"
            value={data.institution || ''}
            onChange={(e) => handleChange('institution', e.target.value)}
            placeholder="Universidade de Lisboa"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Ano de curso"
            type="number"
            value={data.yearOfStudy || ''}
            onChange={(e) => handleChange('yearOfStudy', Number(e.target.value))}
            placeholder="1"
            min={1}
            max={6}
          />

          <Input
            label="Cidade de origem"
            value={data.hometown || ''}
            onChange={(e) => handleChange('hometown', e.target.value)}
            placeholder="Porto"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-foreground">
            Bio curta
          </label>
          <textarea
            value={data.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="Fala um pouco sobre ti, os teus interesses e o que procuras num alojamento..."
            className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground resize-none"
            rows={4}
          />
        </div>

        <Input
          label="Idiomas (separados por vírgula)"
          value={data.languages?.join(', ') || ''}
          onChange={(e) => handleChange('languages', e.target.value.split(',').map(l => l.trim()).filter(Boolean))}
          placeholder="Português, Inglês, Espanhol"
          helperText="Indica os idiomas que falas"
        />
      </div>
    </div>
  );
}

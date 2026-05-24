import {
  Sparkles,
  CheckCircle,
  TrendingUp,
  User,
  Users,
  Home,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { ProgressBar } from '../ProgressBar';
import { Card } from '../Card';
import { StudentProfile } from '../../types/profile';

interface OnboardingWelcomeProps {
  completeness: StudentProfile['completeness'];
}

function getCompletenessMessage(overall: number) {
  if (overall >= 85) {
    return 'O teu perfil está forte. As recomendações, candidaturas e matches ficam mais claros desde o início.';
  }

  if (overall >= 60) {
    return 'Já tens informação suficiente para começar. Podes melhorar o perfil mais tarde para sugestões mais precisas.';
  }

  return 'Podes começar a explorar, mas completar mais dados vai melhorar a qualidade das recomendações.';
}

export function OnboardingWelcome({ completeness }: OnboardingWelcomeProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-secondary" />
        </div>

        <h2 className="mb-3">Perfil pronto para começar</h2>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Vamos usar as tuas respostas para ordenar quartos, explicar compatibilidade e tornar candidaturas mais confiáveis.
        </p>
      </div>

      <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h3 className="text-xl">Completude geral: {completeness.overall}%</h3>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {getCompletenessMessage(completeness.overall)}
            </p>
          </div>

          <div className="w-full md:w-56">
            <ProgressBar progress={completeness.overall} showLabel size="md" color="primary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="text-center p-5">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-primary" />
          </div>

          <h4 className="mb-2">Perfil pessoal</h4>
          <ProgressBar progress={completeness.personal} showLabel={false} size="sm" />
          <p className="text-sm text-muted-foreground mt-2">{completeness.personal}% completo</p>
        </Card>

        <Card className="text-center p-5">
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-secondary" />
          </div>

          <h4 className="mb-2">Convivência</h4>
          <ProgressBar progress={completeness.lifestyle} showLabel={false} size="sm" color="secondary" />
          <p className="text-sm text-muted-foreground mt-2">{completeness.lifestyle}% completo</p>
        </Card>

        <Card className="text-center p-5">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Home className="w-6 h-6 text-accent" />
          </div>

          <h4 className="mb-2">Preferências</h4>
          <ProgressBar progress={completeness.preferences} showLabel={false} size="sm" color="accent" />
          <p className="text-sm text-muted-foreground mt-2">{completeness.preferences}% completo</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-muted/30 rounded-xl border border-border">
          <Search className="w-5 h-5 text-primary mb-3" />
          <h4 className="font-semibold mb-1">Pesquisa mais relevante</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os quartos podem ser ordenados por preço, distância e compatibilidade.
          </p>
        </div>

        <div className="p-5 bg-muted/30 rounded-xl border border-border">
          <Users className="w-5 h-5 text-secondary mb-3" />
          <h4 className="font-semibold mb-1">Melhor convivência</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A app consegue explicar melhor se o ambiente da casa combina contigo.
          </p>
        </div>

        <div className="p-5 bg-muted/30 rounded-xl border border-border">
          <ShieldCheck className="w-5 h-5 text-accent mb-3" />
          <h4 className="font-semibold mb-1">Candidaturas mais claras</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Senhorios recebem informação suficiente para responder com mais confiança.
          </p>
        </div>
      </div>

      {completeness.overall < 70 && (
        <div className="mt-6 p-5 bg-accent/10 border border-accent/20 rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ainda podes avançar, mas completar os campos em falta vai melhorar recomendações e compatibilidade.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
import { Sparkles, CheckCircle, TrendingUp } from 'lucide-react';
import { ProgressBar } from '../ProgressBar';
import { Card } from '../Card';
import { StudentProfile } from '../../types/profile';

interface OnboardingWelcomeProps {
  completeness: StudentProfile['completeness'];
}

export function OnboardingWelcome({ completeness }: OnboardingWelcomeProps) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-secondary" />
      </div>

      <h2 className="mb-3">Tudo pronto!</h2>
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
        O teu perfil foi criado com sucesso. Agora vamos encontrar o alojamento e os colegas de casa perfeitos para ti.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-primary" />
          </div>
          <h4 className="mb-2">Perfil Pessoal</h4>
          <ProgressBar progress={completeness.personal} showLabel={false} size="sm" />
          <p className="text-sm text-muted-foreground mt-2">{completeness.personal}% completo</p>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-secondary" />
          </div>
          <h4 className="mb-2">Convivência</h4>
          <ProgressBar progress={completeness.lifestyle} showLabel={false} size="sm" color="secondary" />
          <p className="text-sm text-muted-foreground mt-2">{completeness.lifestyle}% completo</p>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-accent" />
          </div>
          <h4 className="mb-2">Preferências</h4>
          <ProgressBar progress={completeness.preferences} showLabel={false} size="sm" color="accent" />
          <p className="text-sm text-muted-foreground mt-2">{completeness.preferences}% completo</p>
        </Card>
      </div>

      <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h3 className="text-xl">Completude geral: {completeness.overall}%</h3>
        </div>
        <p className="text-muted-foreground">
          {completeness.overall >= 80 && 'Excelente! O teu perfil está muito completo e receberás ótimas sugestões.'}
          {completeness.overall >= 50 && completeness.overall < 80 && 'Bom trabalho! Podes completar mais tarde para melhorar as sugestões.'}
          {completeness.overall < 50 && 'Podes melhorar o teu perfil mais tarde para receber sugestões mais precisas.'}
        </p>
      </div>

      {completeness.overall < 70 && (
        <div className="p-6 bg-accent/10 border border-accent/20 rounded-xl">
          <p className="text-sm text-accent-foreground">
            💡 <strong>Dica:</strong> Completa o teu perfil para aumentar em até 3x a qualidade dos matches e das sugestões de alojamento.
          </p>
        </div>
      )}
    </div>
  );
}

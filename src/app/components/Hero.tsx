import { Link } from 'react-router';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary/5 via-card to-secondary/5 py-24 md:py-32 px-4 md:px-6 lg:px-8">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl"></div>

      <div className="relative max-w-6xl mx-auto text-center">
        <Badge variant="default" className="mb-6">
          <Sparkles className="w-4 h-4" />
          Plataforma de Alojamento Universitário
        </Badge>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
          Encontra o teu quarto<br className="hidden sm:block" /> e os teus colegas ideais
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
          Compatibilidade real entre estudantes baseada nos teus hábitos.
          Alojamento seguro, verificado e próximo da tua universidade.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/register">
            <Button variant="primary" size="lg" className="w-full sm:w-auto min-w-[220px]">
              Começar Gratuitamente
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto min-w-[220px]">
              Já tenho conta
            </Button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span>Perfis Verificados</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span>100% Gratuito</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span>Suporte 24/7</span>
          </div>
        </div>
      </div>
    </section>
  );
}

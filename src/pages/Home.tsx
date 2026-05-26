import { useState } from 'react';
import { Search, Users, ShieldCheck } from 'lucide-react';
import { Hero, HomeSearchFilters } from '../app/components/Hero';
import { FeatureCard } from '../app/components/FeatureCard';
import { Footer } from '../app/components/Footer';
import { FeaturedRoomsSection } from '../components/FeaturedRoomsSection';

export function Home() {
  const [homeFilters, setHomeFilters] = useState<HomeSearchFilters | null>(null);

  return (
    <main className="flex-1">
      <Hero onSearch={setHomeFilters} />

      <section id="quartos">
        <FeaturedRoomsSection filters={homeFilters} />
      </section>

      <section id="como-funciona" className="py-16 md:py-24 px-4 md:px-6 lg:px-8 bg-card scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="heading-2 mb-4">Feito para a realidade do estudante</h2>
            <p className="body-large max-w-2xl mx-auto text-balance">
              Não és turista — és estudante. Por isso mostramos o que importa: distância às aulas, regras da casa, disponibilidade real e compatibilidade com quem já lá vive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={<Search className="w-8 h-8" />}
              title="Perto das aulas, dentro do orçamento"
              description="Vê o tempo a pé até à tua instituição, o custo total com despesas incluídas e a data real de entrada disponível"
              color="primary"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Casas compatíveis com a tua rotina"
              description="O sistema de compatibilidade cruza os teus hábitos de estudo, sono e convivência com o perfil da casa"
              color="secondary"
            />
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8" />}
              title="Senhorios verificados, anúncios reais"
              description="Perfis verificados, avaliações de ex-inquilinos e sinais de confiança para que saibas com quem estás a lidar"
              color="accent"
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

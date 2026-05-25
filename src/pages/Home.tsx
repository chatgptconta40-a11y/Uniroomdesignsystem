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
            <h2 className="heading-2 mb-4">Como funciona o UniRoom</h2>
            <p className="body-large max-w-2xl mx-auto text-balance">
              Tornar a procura de alojamento universitário simples, segura e baseada em compatibilidade real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={<Search className="w-8 h-8" />}
              title="Pesquisa Inteligente"
              description="Filtra por cidade, preço, universidade e preferências para encontrares o alojamento perfeito"
              color="primary"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Compatibilidade Real"
              description="Sistema de match baseado nos teus hábitos de convivência para garantir harmonia total"
              color="secondary"
            />
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8" />}
              title="Confiança e Segurança"
              description="Perfis verificados, avaliações reais e suporte dedicado para uma experiência segura"
              color="accent"
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

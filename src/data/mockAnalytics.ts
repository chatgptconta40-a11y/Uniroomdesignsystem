import { ListingAnalytics, PerformanceInsight, ComparisonData } from '../types/analytics';

export const mockListingAnalytics: ListingAnalytics[] = [
  {
    listingId: '1',
    listingTitle: 'Quarto confortável em Viseu Centro',
    period: 'month',
    views: 245,
    favorites: 18,
    applications: 8,
    messages: 12,
    conversionRate: 3.3,
    favoriteRate: 7.3,
    viewTrend: 15,
    applicationTrend: 25,
  },
  {
    listingId: '3',
    listingTitle: 'Quarto Confortável no Porto',
    period: 'month',
    views: 189,
    favorites: 15,
    applications: 6,
    messages: 9,
    conversionRate: 3.2,
    favoriteRate: 7.9,
    viewTrend: 8,
    applicationTrend: -5,
  },
];

export const mockInsights: PerformanceInsight[] = [
  {
    type: 'success',
    title: 'Ótimo desempenho!',
    description: 'O teu anúncio "Quarto confortável em Viseu Centro" está a receber 15% mais visualizações que no mês passado.',
    action: 'Ver estatísticas',
  },
  {
    type: 'warning',
    title: 'Preço acima da média',
    description: 'Os teus alojamentos em Lisboa estão 12% acima do preço médio da zona. Considera ajustar para aumentar candidaturas.',
    action: 'Ver preços',
  },
  {
    type: 'info',
    title: 'Adiciona mais fotos',
    description: 'Anúncios com 8+ fotos recebem 2.5x mais visualizações. Vários dos teus anúncios têm menos de 5 fotos.',
    action: 'Adicionar fotos',
  },
  {
    type: 'success',
    title: 'Taxa de resposta excelente',
    description: 'Manténs uma taxa de resposta de 98%, muito acima da média de 85%.',
  },
];

export const mockComparisons: ComparisonData[] = [
  { metric: 'Taxa de Conversão', yourValue: 3.3, average: 2.8, topPerformer: 4.5 },
  { metric: 'Tempo de Resposta (h)', yourValue: 2, average: 6, topPerformer: 1 },
  { metric: 'Avaliação Média', yourValue: 4.7, average: 4.2, topPerformer: 4.9 },
  { metric: 'Taxa de Aceitação', yourValue: 65, average: 58, topPerformer: 78 },
];

export function getListingAnalytics(listingId: string): ListingAnalytics | undefined {
  return mockListingAnalytics.find(a => a.listingId === listingId);
}

export function getAllAnalytics(): ListingAnalytics[] {
  return mockListingAnalytics;
}

export function getInsights(): PerformanceInsight[] {
  return mockInsights;
}

export function getComparisons(): ComparisonData[] {
  return mockComparisons;
}

export function getOverallMetrics() {
  const totalViews = mockListingAnalytics.reduce((sum, a) => sum + a.views, 0);
  const totalFavorites = mockListingAnalytics.reduce((sum, a) => sum + a.favorites, 0);
  const totalApplications = mockListingAnalytics.reduce((sum, a) => sum + a.applications, 0);
  const avgConversion = mockListingAnalytics.reduce((sum, a) => sum + a.conversionRate, 0) / mockListingAnalytics.length;

  return {
    totalViews,
    totalFavorites,
    totalApplications,
    avgConversion: avgConversion.toFixed(1),
    viewTrend: 12,
    applicationTrend: 18,
  };
}

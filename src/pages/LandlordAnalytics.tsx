import { useNavigate } from 'react-router';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  FileText,
  BarChart3,
  Lightbulb,
  Award,
  AlertCircle,
} from 'lucide-react';
import {
  getAllAnalytics,
  getInsights,
  getComparisons,
  getOverallMetrics,
} from '../data/mockAnalytics';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

export function LandlordAnalytics() {
  const navigate = useNavigate();
  const analytics = getAllAnalytics();
  const insights = getInsights();
  const comparisons = getComparisons();
  const overall = getOverallMetrics();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Award className="w-6 h-6 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'info':
        return <Lightbulb className="w-6 h-6 text-blue-600" />;
      default:
        return <BarChart3 className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          </div>

          <p className="text-muted-foreground">
            Análise detalhada do desempenho dos teus alojamentos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>

              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">+{overall.viewTrend}%</span>
              </div>
            </div>

            <h3 className="text-3xl font-bold text-foreground mb-1">{overall.totalViews}</h3>
            <p className="text-sm text-muted-foreground">Total de visualizações</p>
            <p className="text-xs text-muted-foreground mt-1">Este mês</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>

              <Badge variant="outline">
                {((overall.totalFavorites / overall.totalViews) * 100).toFixed(1)}%
              </Badge>
            </div>

            <h3 className="text-3xl font-bold text-foreground mb-1">{overall.totalFavorites}</h3>
            <p className="text-sm text-muted-foreground">Favoritos</p>
            <p className="text-xs text-muted-foreground mt-1">Taxa de favoritos</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>

              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">+{overall.applicationTrend}%</span>
              </div>
            </div>

            <h3 className="text-3xl font-bold text-foreground mb-1">{overall.totalApplications}</h3>
            <p className="text-sm text-muted-foreground">Candidaturas</p>
            <p className="text-xs text-muted-foreground mt-1">Este mês</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>

              <Badge variant="success">Ótimo</Badge>
            </div>

            <h3 className="text-3xl font-bold text-foreground mb-1">{overall.avgConversion}%</h3>
            <p className="text-sm text-muted-foreground">Taxa de conversão</p>
            <p className="text-xs text-muted-foreground mt-1">Candidaturas / visualizações</p>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Recomendações automáticas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <Card key={index} className={`p-6 border ${getInsightColor(insight.type)}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getInsightIcon(insight.type)}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{insight.title}</h3>
                    <p className="text-sm text-foreground mb-3">{insight.description}</p>

                    {insight.action && (
                      <button
                        className="text-sm font-medium text-primary hover:underline"
                        onClick={() => {
                          if (insight.action?.includes('fotos')) {
                            navigate('/landlord/listings');
                          } else if (insight.action?.includes('preços')) {
                            navigate('/landlord/listings');
                          } else {
                            navigate('/landlord/analytics');
                          }
                        }}
                      >
                        {insight.action}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Comparação com outros senhorios</h2>

          <Card className="p-6">
            <div className="space-y-6">
              {comparisons.map((comparison, index) => {
                const percentage = (comparison.yourValue / comparison.topPerformer) * 100;
                const vsAverage = comparison.yourValue >= comparison.average;

                return (
                  <div key={index}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-3">
                      <span className="text-sm font-medium text-foreground">{comparison.metric}</span>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Tu: <span className="font-semibold text-foreground">{comparison.yourValue}</span>
                        </span>

                        <span className="text-muted-foreground">
                          Média: <span className="font-semibold">{comparison.average}</span>
                        </span>

                        <span className="text-muted-foreground">
                          Top: <span className="font-semibold text-green-600">{comparison.topPerformer}</span>
                        </span>
                      </div>
                    </div>

                    <div className="relative w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          vsAverage
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />

                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-gray-600"
                        style={{ left: `${(comparison.average / comparison.topPerformer) * 100}%` }}
                      >
                        <div className="absolute -top-1 -left-2 w-4 h-4 border-2 border-gray-600 bg-white rounded-full" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {vsAverage ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Acima da média
                        </span>
                      ) : (
                        <span className="text-xs text-orange-600 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          Abaixo da média
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Desempenho por alojamento</h2>

          <div className="space-y-4">
            {analytics.map(listing => (
              <Card key={listing.listingId} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{listing.listingTitle}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {listing.views} visualizações
                      </span>

                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {listing.favorites} favoritos
                      </span>

                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {listing.applications} candidaturas
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Conversão</p>
                      <p className="text-xl font-bold text-primary">{listing.conversionRate}%</p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Favoritos</p>
                      <p className="text-xl font-bold text-red-600">{listing.favoriteRate}%</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-muted-foreground">Visualizações</p>
                      {listing.viewTrend > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>

                    <p className="text-2xl font-bold text-foreground">{listing.views}</p>

                    <p className={`text-xs mt-1 ${listing.viewTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {listing.viewTrend > 0 ? '+' : ''}{listing.viewTrend}% vs mês anterior
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">Favoritos</p>
                    <p className="text-2xl font-bold text-foreground">{listing.favorites}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {listing.favoriteRate}% taxa
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-muted-foreground">Candidaturas</p>
                      {listing.applicationTrend > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>

                    <p className="text-2xl font-bold text-foreground">{listing.applications}</p>

                    <p className={`text-xs mt-1 ${listing.applicationTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {listing.applicationTrend > 0 ? '+' : ''}{listing.applicationTrend}% vs mês anterior
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">Mensagens</p>
                    <p className="text-2xl font-bold text-foreground">{listing.messages}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este mês
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
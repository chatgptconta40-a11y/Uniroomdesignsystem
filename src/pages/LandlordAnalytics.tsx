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
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Comparação com outros senhorios</h2>
              <p className="text-sm text-muted-foreground mt-0.5">O teu desempenho face à média e ao melhor da plataforma</p>
            </div>
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                Tu
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-px h-3 bg-muted-foreground/40 inline-block" />
                Média
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary/60 inline-block" />
                Top
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {comparisons.map((comparison, index) => {
              const yourPct = Math.min((comparison.yourValue / comparison.topPerformer) * 100, 100);
              const avgPct  = Math.min((comparison.average   / comparison.topPerformer) * 100, 100);
              const vsAverage = comparison.yourValue >= comparison.average;
              const diffAbs   = Math.abs(comparison.yourValue - comparison.average);

              return (
                <div key={index} className="p-5 flex flex-col gap-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground leading-tight">{comparison.metric}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 border ${
                      vsAverage
                        ? 'bg-secondary/10 text-secondary border-secondary/25'
                        : 'bg-accent/10 text-accent-foreground border-accent/30'
                    }`}>
                      {vsAverage
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />}
                      {vsAverage ? '+' : '-'}{diffAbs} vs média
                    </span>
                  </div>

                  {/* Three value pills */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Tu',    value: comparison.yourValue,    cls: 'bg-primary/8 border-primary/20 text-primary' },
                      { label: 'Média', value: comparison.average,      cls: 'bg-muted border-border text-muted-foreground' },
                      { label: 'Top',   value: comparison.topPerformer, cls: 'bg-secondary/8 border-secondary/20 text-secondary' },
                    ].map(item => (
                      <div key={item.label} className={`rounded-xl px-3 py-2.5 text-center border ${item.cls}`}>
                        <p className="text-lg font-bold tabular-nums">{item.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress track */}
                  <div className="space-y-1.5">
                    <div className="relative h-2.5 bg-muted rounded-full overflow-visible">
                      <div
                        className={`absolute left-0 top-0 h-2.5 rounded-full ${vsAverage ? 'bg-secondary' : 'bg-accent'}`}
                        style={{ width: `${yourPct}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-muted-foreground/40"
                        style={{ left: `${avgPct}%` }}
                      />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-secondary/60 border-2 border-card" />
                    </div>
                    <div className="relative h-3.5">
                      <span
                        className="absolute text-[10px] text-muted-foreground -translate-x-1/2 leading-none"
                        style={{ left: `${avgPct}%` }}
                      >
                        Média
                      </span>
                      <span className="absolute right-0 text-[10px] text-secondary leading-none">Top</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
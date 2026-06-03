import { useNavigate } from 'react-router';
import {
  Eye,
  Heart,
  FileText,
  BarChart3,
  Lightbulb,
  Award,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { useLandlordAnalytics } from '../hooks/useLandlordAnalytics';

export function LandlordAnalytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { overview, propertyPerformance, insights } = useLandlordAnalytics(user?.id);

  const favoriteRate = overview.totalViews > 0
    ? ((overview.totalFavorites / overview.totalViews) * 100).toFixed(1)
    : '0.0';

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
            </div>

            <h3 className="text-3xl font-bold text-foreground mb-1">{overview.totalViews}</h3>
            <p className="text-sm text-muted-foreground">Total de visualizações</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>

              <span className="text-xs font-semibold text-muted-foreground">
                {favoriteRate}%
              </span>
            </div>

            <h3 className="text-3xl font-bold text-foreground mb-1">{overview.totalFavorites}</h3>
            <p className="text-sm text-muted-foreground">Favoritos</p>
            <p className="text-xs text-muted-foreground mt-1">Taxa de favoritos</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <h3 className="text-3xl font-bold text-foreground mb-1">{overview.totalApplications}</h3>
            <p className="text-sm text-muted-foreground">Candidaturas</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>

            <h3 className="text-3xl font-bold text-foreground mb-1">{overview.avgConversion}%</h3>
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
                          if (insight.action?.toLowerCase().includes('fotos')) {
                            navigate('/landlord/listings');
                          } else if (insight.action?.toLowerCase().includes('verifica')) {
                            navigate('/verification');
                          } else if (insight.action?.toLowerCase().includes('alojamento')) {
                            navigate('/landlord/new-listing');
                          } else {
                            navigate('/landlord/listings');
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
          </div>

          <Card className="p-8">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Info className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">Benchmark indisponível</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Ainda não há dados agregados suficientes para comparar o teu desempenho com a média e o top da plataforma.
              </p>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Desempenho por alojamento</h2>

          {propertyPerformance.length === 0 ? (
            <Card className="p-8">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Sem alojamentos publicados</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Quando publicares alojamentos, vais ver aqui as estatísticas detalhadas de cada um.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {propertyPerformance.map(listing => (
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
                      <p className="text-sm text-muted-foreground mb-3">Visualizações</p>
                      <p className="text-2xl font-bold text-foreground">{listing.views}</p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">Favoritos</p>
                      <p className="text-2xl font-bold text-foreground">{listing.favorites}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {listing.favoriteRate}% taxa
                      </p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">Candidaturas</p>
                      <p className="text-2xl font-bold text-foreground">{listing.applications}</p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">Mensagens</p>
                      <p className="text-2xl font-bold text-foreground">{listing.messages}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

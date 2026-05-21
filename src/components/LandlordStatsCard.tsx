import { Shield, Star, Clock, MessageCircle, CheckCircle, Calendar } from 'lucide-react';
import { Card } from './Card';
import { getLandlordStats } from '../data/mockTrust';
import { TrustBadge } from './TrustBadge';

interface LandlordStatsCardProps {
  landlordId: string;
}

export function LandlordStatsCard({ landlordId }: LandlordStatsCardProps) {
  const stats = getLandlordStats(landlordId);

  if (!stats) return null;

  const memberDuration = Math.floor(
    (new Date().getTime() - stats.memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30),
  );

  const trustIndex = Math.min(95, Math.round((stats.averageRating / 5) * 100));

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>

        <div>
          <h3 className="font-semibold text-foreground">Indicadores de confiança</h3>
          <p className="text-sm text-muted-foreground">Informação verificada</p>
        </div>
      </div>

      <div className="mb-4">
        <TrustBadge userId={landlordId} size="md" showLabel />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-sm">Avaliação média</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-semibold text-foreground">{stats.averageRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({stats.totalReviews} avaliações)</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <span className="text-sm">Taxa de resposta</span>
          </div>

          <span className="font-semibold text-foreground">{stats.responseRate}%</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="w-5 h-5 text-green-500" />
            <span className="text-sm">Tempo de resposta</span>
          </div>

          <span className="font-semibold text-foreground">
            {stats.averageResponseTime < 1 ? '< 1 hora' : `~${stats.averageResponseTime}h`}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-sm">Membro há</span>
          </div>

          <span className="font-semibold text-foreground">
            {memberDuration} {memberDuration === 1 ? 'mês' : 'meses'}
          </span>
        </div>

        {stats.totalIssues > 0 && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-sm">Denúncias resolvidas</span>
            </div>

            <span className="font-semibold text-foreground">
              {stats.resolvedIssues}/{stats.totalIssues}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Índice de confiança</span>
          <span className="text-sm font-semibold text-primary">
            {trustIndex}%
          </span>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-gradient-to-r from-primary to-green-500 h-2 rounded-full transition-all"
            style={{ width: `${trustIndex}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Baseado em avaliações, tempo de resposta e verificações.
        </p>
      </div>

      {stats.verified && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">
              Senhorio verificado pelo UniRoom
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
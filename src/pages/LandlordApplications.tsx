import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  FileText, User, CheckCircle, XCircle, MessageCircle, Mail, GraduationCap,
  Calendar, Shield, Star, SlidersHorizontal, ArrowUpDown, Trophy, AlertTriangle,
  Building, ChevronRight, Clock, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApplicationsForLandlord, updateApplicationStatus, getApplicationStats, DetailedApplication } from '../data/mockLandlordApplications';
import { ApplicationStatus } from '../types/accommodation';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { TrustPill, trustLevelToPill } from '../components/TrustPill';
import { toast } from 'sonner';

type SortOption = 'recent' | 'compatibility' | 'trust' | 'decision' | 'movein';
type SpecialFilter = 'verified' | 'compat80' | 'trust75';

const decisionScore = (app: DetailedApplication) =>
  app.compatibilityScore * 0.6 + app.trustScore * 0.4;

export function LandlordApplications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listingFilter = searchParams.get('listing') || undefined;

  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [specialFilters, setSpecialFilters] = useState<Set<SpecialFilter>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedApp, setSelectedApp] = useState<DetailedApplication | null>(null);
  const [confirmAcceptApp, setConfirmAcceptApp] = useState<DetailedApplication | null>(null);
  const [confirmRejectApp, setConfirmRejectApp] = useState<DetailedApplication | null>(null);
  const [version, setVersion] = useState(0);

  const allApplications = useMemo(
    () => getApplicationsForLandlord(user?.id || '', listingFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, listingFilter, version],
  );

  const stats = useMemo(() => getApplicationStats(user?.id || ''), [user?.id, version]);

  // Determine the best candidate ID (only among actionable applications)
  const bestCandidateId = useMemo(() => {
    const actionable = allApplications.filter(
      a => a.status === 'pending' || a.status === 'under_review',
    );
    if (actionable.length === 0) return null;
    return actionable.reduce((best, cur) =>
      decisionScore(cur) > decisionScore(best) ? cur : best,
    ).id;
  }, [allApplications]);

  const filteredAndSorted = useMemo(() => {
    let list = allApplications;

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(a => a.status === statusFilter);
    }

    // Special filters
    if (specialFilters.has('verified')) {
      list = list.filter(a => a.verificationLevel !== 'none');
    }
    if (specialFilters.has('compat80')) {
      list = list.filter(a => a.compatibilityScore >= 80);
    }
    if (specialFilters.has('trust75')) {
      list = list.filter(a => a.trustScore >= 75);
    }

    // Sort
    const sorted = [...list];
    switch (sortBy) {
      case 'compatibility':
        sorted.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
        break;
      case 'trust':
        sorted.sort((a, b) => b.trustScore - a.trustScore);
        break;
      case 'decision':
        sorted.sort((a, b) => decisionScore(b) - decisionScore(a));
        break;
      case 'movein':
        sorted.sort((a, b) => {
          if (!a.moveInDate) return 1;
          if (!b.moveInDate) return -1;
          return new Date(a.moveInDate).getTime() - new Date(b.moveInDate).getTime();
        });
        break;
      case 'recent':
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return sorted;
  }, [allApplications, statusFilter, specialFilters, sortBy]);

  const toggleSpecial = (f: SpecialFilter) => {
    setSpecialFilters(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const handleAccept = (app: DetailedApplication) => {
    if (updateApplicationStatus(app.id, 'accepted', user?.id)) {
      toast.success(`Candidatura de ${app.applicantName} aceite!`, {
        description: 'O candidato foi notificado.',
      });
      setVersion(v => v + 1);
      setConfirmAcceptApp(null);
      setSelectedApp(null);
    }
  };

  const handleReject = (app: DetailedApplication) => {
    setConfirmRejectApp(app);
  };

  const handleRejectConfirm = () => {
    if (!confirmRejectApp) return;
    if (updateApplicationStatus(confirmRejectApp.id, 'rejected', user?.id)) {
      toast.success('Candidatura rejeitada');
      setVersion(v => v + 1);
      setSelectedApp(null);
    }
    setConfirmRejectApp(null);
  };

  const getCompatColor = (score: number) => {
    if (score >= 80) return 'text-green-700 bg-green-100';
    if (score >= 60) return 'text-yellow-700 bg-yellow-100';
    return 'text-orange-700 bg-orange-100';
  };

  const getTrustColor = (score: number) => {
    if (score >= 75) return 'text-blue-700 bg-blue-100';
    if (score >= 50) return 'text-muted-foreground bg-muted';
    return 'text-red-700 bg-red-100';
  };

  const statusLabel: Record<ApplicationStatus, string> = {
    pending: 'Pendente',
    under_review: 'Em análise',
    accepted: 'Aceite',
    rejected: 'Rejeitada',
    withdrawn: 'Retirada',
  };

  const statusBadgeClass: Record<ApplicationStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Candidaturas</h1>
          </div>
          <p className="text-muted-foreground">Gere e compara as candidaturas aos teus alojamentos</p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {(
            [
              { label: 'Total', value: stats.total, key: 'all', color: 'text-foreground' },
              { label: 'Pendentes', value: stats.pending, key: 'pending', color: 'text-yellow-600' },
              { label: 'Em análise', value: stats.underReview, key: 'under_review', color: 'text-blue-600' },
              { label: 'Aceites', value: stats.accepted, key: 'accepted', color: 'text-green-600' },
              { label: 'Rejeitadas', value: stats.rejected, key: 'rejected', color: 'text-red-600' },
            ] as const
          ).map(({ label, value, key, color }) => (
            <Card
              key={key}
              className={`p-4 cursor-pointer transition-all select-none ${statusFilter === key ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'}`}
              onClick={() => setStatusFilter(key)}
            >
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Sort */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="text-sm bg-transparent outline-none cursor-pointer text-foreground"
            >
              <option value="recent">Mais recentes</option>
              <option value="compatibility">Maior compatibilidade</option>
              <option value="trust">Maior trust score</option>
              <option value="decision">Melhor candidato</option>
              <option value="movein">Entrada mais próxima</option>
            </select>
          </div>

          {/* Special filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtrar:
            </span>
            {(
              [
                { key: 'verified' as SpecialFilter, label: 'Verificados' },
                { key: 'compat80' as SpecialFilter, label: 'Compat. ≥ 80%' },
                { key: 'trust75' as SpecialFilter, label: 'Trust ≥ 75' },
              ]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleSpecial(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  specialFilters.has(key)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-card border-border text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Active filter count */}
          {(specialFilters.size > 0 || statusFilter !== 'all') && (
            <button
              onClick={() => { setSpecialFilters(new Set()); setStatusFilter('all'); }}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredAndSorted.length} candidatura{filteredAndSorted.length !== 1 ? 's' : ''} encontrada{filteredAndSorted.length !== 1 ? 's' : ''}
        </p>

        {/* Applications list */}
        {filteredAndSorted.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h2 className="font-semibold text-foreground mb-2">Sem candidaturas</h2>
            <p className="text-sm text-muted-foreground">Tenta ajustar os filtros.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAndSorted.map(app => {
              const isBest = app.id === bestCandidateId;
              const isActionable = app.status === 'pending' || app.status === 'under_review';

              return (
                <Card
                  key={app.id}
                  className={`p-5 hover:shadow-lg transition-all cursor-pointer group ${isBest ? 'ring-2 ring-amber-400 bg-amber-50/30' : ''}`}
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${isBest ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-primary to-blue-600'}`}>
                        {app.applicantName.charAt(0)}
                      </div>
                      {isBest && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                          <Trophy className="w-3 h-3 text-white" />
                        </span>
                      )}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{app.applicantName}</span>

                        {isBest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[11px] font-semibold">
                            <Trophy className="w-3 h-3" />
                            Melhor candidato
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusBadgeClass[app.status]}`}>
                          {statusLabel[app.status]}
                        </span>

                        <TrustPill type={trustLevelToPill(app.trustLevel)} size="xs" />

                        {app.verificationLevel !== 'none' && (
                          <TrustPill type="verified-student" size="xs" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {app.applicantCourse} · {app.applicantYear}º ano
                        </span>
                        {app.moveInDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Entrada: {new Date(app.moveInDate).toLocaleDateString('pt-PT')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(app.createdAt).toLocaleDateString('pt-PT')}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 flex-shrink-0" />
                        {app.listingTitle}
                        <span className="text-primary font-semibold ml-1">€{app.listingPrice}/mês</span>
                      </p>
                    </div>

                    {/* Scores */}
                    <div className="flex sm:flex-col items-center gap-2 sm:gap-1.5 flex-shrink-0">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${getCompatColor(app.compatibilityScore)}`}>
                        <Star className="w-3.5 h-3.5" />
                        <span className="font-bold text-sm">{app.compatibilityScore}%</span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${getTrustColor(app.trustScore)}`}>
                        <Shield className="w-3.5 h-3.5" />
                        <span className="font-bold text-sm">{app.trustScore}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {isActionable ? (
                        <>
                          <Button
                            onClick={() => setConfirmAcceptApp(app)}
                            className="flex-1 sm:flex-none sm:w-28 bg-green-600 hover:bg-green-700 text-sm py-2"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Aceitar
                          </Button>
                          <Button
                            onClick={() => handleReject(app)}
                            variant="outline"
                            className="flex-1 sm:flex-none sm:w-28 text-red-600 hover:bg-red-50 border-red-200 text-sm py-2"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            Rejeitar
                          </Button>
                          <Button
                            onClick={() => navigate('/messages')}
                            variant="outline"
                            className="sm:w-28 text-sm py-2"
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                            Conversar
                          </Button>
                        </>
                      ) : app.status === 'accepted' ? (
                        <>
                          <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Aceite
                          </div>
                          <Button onClick={() => navigate('/messages')} variant="outline" className="sm:w-28 text-sm py-2">
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                            Mensagem
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          Rejeitada
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground self-center flex-shrink-0 hidden sm:block group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          app={selectedApp}
          isBest={selectedApp.id === bestCandidateId}
          onClose={() => setSelectedApp(null)}
          onAccept={() => setConfirmAcceptApp(selectedApp)}
          onReject={() => handleReject(selectedApp)}
          onMessage={() => navigate('/messages')}
          getCompatColor={getCompatColor}
          getTrustColor={getTrustColor}
          statusLabel={statusLabel}
          statusBadgeClass={statusBadgeClass}
        />
      )}

      {/* Accept Confirmation Modal */}
      {confirmAcceptApp && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmAcceptApp(null)}
          title="Confirmar aceitação"
          size="sm"
          footer={
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmAcceptApp(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleAccept(confirmAcceptApp)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar aceitação
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Ao aceitar esta candidatura, o quarto ficará marcado como <strong>reservado</strong> ou <strong>ocupado</strong> dependendo da data de entrada.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold">
                  {confirmAcceptApp.applicantName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{confirmAcceptApp.applicantName}</p>
                  <p className="text-xs text-muted-foreground">{confirmAcceptApp.applicantEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Building className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{confirmAcceptApp.listingTitle}</span>
              </div>
              {confirmAcceptApp.moveInDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Entrada: {new Date(confirmAcceptApp.moveInDate).toLocaleDateString('pt-PT')}</span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <ConfirmModal
        isOpen={!!confirmRejectApp}
        onClose={() => setConfirmRejectApp(null)}
        onConfirm={handleRejectConfirm}
        title="Rejeitar candidatura?"
        description="Esta candidatura será marcada como rejeitada e o estudante será notificado."
        cancelLabel="Voltar"
        confirmLabel="Rejeitar candidatura"
      />
    </div>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────

interface DetailModalProps {
  app: DetailedApplication;
  isBest: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  onMessage: () => void;
  getCompatColor: (score: number) => string;
  getTrustColor: (score: number) => string;
  statusLabel: Record<ApplicationStatus, string>;
  statusBadgeClass: Record<ApplicationStatus, string>;
}

function ApplicationDetailModal({
  app, isBest, onClose, onAccept, onReject, onMessage,
  getCompatColor, getTrustColor, statusLabel, statusBadgeClass,
}: DetailModalProps) {
  const isActionable = app.status === 'pending' || app.status === 'under_review';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Detalhe da candidatura"
      size="md"
      footer={
        isActionable ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
              onClick={onReject}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitar
            </Button>
            <Button className="flex-1" variant="outline" onClick={onMessage}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Conversar
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={onAccept}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Aceitar candidatura
            </Button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span className={`flex items-center gap-2 font-medium text-sm ${app.status === 'accepted' ? 'text-green-700' : 'text-red-600'}`}>
              {app.status === 'accepted' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {statusLabel[app.status]}
            </span>
            <Button variant="outline" onClick={onMessage}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Enviar mensagem
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-5">
        {/* Candidate header */}
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${isBest ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-primary to-blue-600'}`}>
            {app.applicantName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-foreground">{app.applicantName}</h3>
              {isBest && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                  <Trophy className="w-3.5 h-3.5" />
                  Melhor candidato
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass[app.status]}`}>
                {statusLabel[app.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <TrustPill type={trustLevelToPill(app.trustLevel)} size="sm" />
              {app.verificationLevel !== 'none' && (
                <TrustPill type="verified-student" size="sm" />
              )}
            </div>
          </div>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-4 rounded-xl ${getCompatColor(app.compatibilityScore)}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Compatibilidade</span>
              <Star className="w-4 h-4" />
            </div>
            <p className="text-3xl font-bold">{app.compatibilityScore}%</p>
            <p className="text-xs mt-1 opacity-75">
              {app.compatibilityScore >= 80 ? 'Excelente match' : app.compatibilityScore >= 60 ? 'Bom match' : 'Match moderado'}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${getTrustColor(app.trustScore)}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Trust Score</span>
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-3xl font-bold">{app.trustScore}</p>
            <p className="text-xs mt-1 opacity-75">
              {app.trustScore >= 75 ? 'Muito confiável' : app.trustScore >= 50 ? 'Confiável' : 'Perfil recente'}
            </p>
          </div>
        </div>

        {/* Candidate details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground truncate">{app.applicantEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Curso</p>
              <p className="text-sm font-medium text-foreground">{app.applicantCourse} · {app.applicantYear}º ano</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Alojamento pretendido</p>
              <p className="text-sm font-medium text-foreground line-clamp-1">{app.listingTitle}</p>
              <p className="text-xs text-primary font-semibold">€{app.listingPrice}/mês</p>
            </div>
          </div>
          {app.moveInDate && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Data de entrada</p>
                <p className="text-sm font-medium text-foreground">{new Date(app.moveInDate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        {app.message && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Mensagem do candidato</p>
            <div className="p-4 bg-muted/40 rounded-xl border border-border">
              <p className="text-sm text-foreground leading-relaxed italic">"{app.message}"</p>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Candidatura: {new Date(app.createdAt).toLocaleDateString('pt-PT')}
          </span>
          {app.reviewedAt && (
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Resposta: {new Date(app.reviewedAt).toLocaleDateString('pt-PT')}
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}

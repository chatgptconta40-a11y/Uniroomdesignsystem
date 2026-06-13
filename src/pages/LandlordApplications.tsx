import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  FileText,
  CheckCircle,
  XCircle,
  MessageCircle,
  Mail,
  GraduationCap,
  Calendar,
  Shield,
  Star,
  SlidersHorizontal,
  ArrowUpDown,
  Trophy,
  AlertTriangle,
  Building,
  ChevronRight,
  Clock,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { findOrCreateConversation } from '../hooks/useMessages';
import { Application, ApplicationStatus } from '../types/accommodation';
import { supabase, supabaseUrl } from '../lib/supabase';
import { dbToApplication } from '../hooks/useDb';
import { normalizeRoomStatus } from '../utils/roomStatus';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { TrustPill, trustLevelToPill } from '../components/TrustPill';
import {
  computeCompatibility,
  computeTrust,
  type CompatibilityResult,
} from '../utils/applicationScoring';
import type { LifestyleProfile, AccommodationPreferences } from '../types/profile';
import { toast } from 'sonner';

interface DetailedApplication extends Application {
  applicantName: string;
  applicantEmail: string;
  applicantCourse: string;
  applicantUniversity: string;
  applicantYear: number;
  compatibilityScore: number;
  compatibility: CompatibilityResult;
  trustScore: number;
  trustLevel: 'new' | 'confirmed' | 'trusted';
  trustLabel: string;
  trustIsFallback: boolean;
  verificationLevel: 'none' | 'bronze' | 'silver' | 'gold';
  verificationLabel: string;
  verificationPending: boolean;
  listingTitle: string;
  listingPrice: number;
}

type SortOption = 'recent' | 'compatibility' | 'trust' | 'decision' | 'movein';
type SpecialFilter = 'verified' | 'compat80' | 'trust75';

const decisionScore = (app: DetailedApplication) =>
  app.compatibilityScore * 0.6 + app.trustScore * 0.4;

const isActionableStatus = (status: ApplicationStatus) =>
  status === 'pending' || status === 'under_review';

const canBeBestCandidate = (app: DetailedApplication) =>
  app.verificationLevel !== 'none' ||
  app.verificationPending ||
  app.trustLevel === 'confirmed' ||
  app.trustLevel === 'trusted' ||
  app.trustScore >= 75;

export function LandlordApplications() {
  const { user } = useAuth();
  const { getRoom, getProperty, refreshProperties } = useProperties();
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

  const [baseApplications, setBaseApplications] = useState<Application[]>([]);
  const [profileEnrichment, setProfileEnrichment] = useState<Map<string, {
    name: string;
    email: string;
    course: string;
    university: string;
    year: number;
    verified: boolean;
    onboardingCompleted: boolean;
    status?: string | null;
    lifestyle?: LifestyleProfile | null;
    preferences?: AccommodationPreferences | null;
    trust?: { score: number; level: string } | null;
    verificationLevel?: 'none' | 'bronze' | 'silver' | 'gold';
  }>>(new Map());

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) { setBaseApplications([]); return; }
    (async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error('[UniRoom] Landlord applications fetch error:', error.message);
        toast.error(`Erro ao carregar candidaturas: ${error.message}`);
        setBaseApplications([]);
        return;
      }
      setBaseApplications((data ?? []).map(dbToApplication));
    })();
    return () => { cancelled = true; };
  }, [user?.id, version]);

  useEffect(() => {
    if (!baseApplications.length) return;
    const userIds = [...new Set(baseApplications.map(a => a.userId))];
    (async () => {
      const [
        profilesResult,
        personalsResult,
        lifestyleResult,
        preferencesResult,
        trustResult,
        verificationResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, created_at, verified, onboarding_completed, status')
          .in('id', userIds),
        supabase
          .from('personal_profiles')
          .select('user_id, course, institution, year_of_study, age, hometown, bio, photo_url')
          .in('user_id', userIds),
        supabase
          .from('lifestyle_profiles')
          .select('*')
          .in('user_id', userIds),
        supabase
          .from('accommodation_preferences')
          .select('*')
          .in('user_id', userIds),
        supabase
          .from('trust_scores')
          .select('user_id, score, level, reviews_count, average_rating')
          .in('user_id', userIds),
        supabase
          .from('verification_status')
          .select('user_id, level')
          .in('user_id', userIds),
      ]);

      if (profilesResult.error) {
        console.error('[UniRoom] Student profiles fetch error:', profilesResult.error.message);
      }
      if (personalsResult.error) {
        console.error('[UniRoom] Student personal profiles fetch error:', personalsResult.error.message);
      }
      if (lifestyleResult.error) {
        console.warn('[UniRoom] Lifestyle fetch error:', lifestyleResult.error.message);
      }
      if (preferencesResult.error) {
        console.warn('[UniRoom] Preferences fetch error:', preferencesResult.error.message);
      }
      if (trustResult.error) {
        console.warn('[UniRoom] Trust score fetch error:', trustResult.error.message);
      }
      if (verificationResult.error) {
        console.warn('[UniRoom] Verification fetch error:', verificationResult.error.message);
      }

      const pMap = new Map((profilesResult.data ?? []).map(p => [p.id, p]));
      const perMap = new Map((personalsResult.data ?? []).map(p => [p.user_id, p]));
      const lifeMap = new Map((lifestyleResult.data ?? []).map(l => [l.user_id, l]));
      const prefMap = new Map((preferencesResult.data ?? []).map(p => [p.user_id, p]));
      const trustMap = new Map((trustResult.data ?? []).map(t => [t.user_id, t]));
      const verifMap = new Map((verificationResult.data ?? []).map(v => [v.user_id, v]));

      const enrichment = new Map(userIds.map(id => {
        const life = lifeMap.get(id);
        const pref = prefMap.get(id);
        const trust = trustMap.get(id);
        const verif = verifMap.get(id);

        const lifestyle: LifestyleProfile | null = life
          ? {
              userId: id,
              bedtime: life.bedtime ?? undefined,
              wakeupTime: life.wakeup_time ?? undefined,
              schedule: life.schedule ?? undefined,
              cleanliness: life.cleanliness ?? undefined,
              cleaningFrequency: life.cleaning_frequency ?? undefined,
              noiseTolerance: life.noise_tolerance ?? undefined,
              musicVolume: life.music_volume ?? undefined,
              guestsFrequency: life.guests_frequency ?? undefined,
              guestsAcceptance: life.guests_acceptance ?? undefined,
              smoking: life.smoking ?? undefined,
              pets: life.pets ?? undefined,
              cooking: life.cooking ?? undefined,
              personality: life.personality ?? undefined,
              socialPreference: life.social_preference ?? undefined,
            }
          : null;

        const preferences: AccommodationPreferences | null = pref
          ? {
              userId: id,
              maxBudget: pref.max_budget ?? undefined,
              preferredCities: pref.preferred_cities ?? [],
              maxDistanceFromUniversity: pref.max_distance_from_university ?? undefined,
              moveInDate: pref.move_in_date ? new Date(pref.move_in_date) : undefined,
              stayDuration: pref.stay_duration ?? undefined,
              roomType: pref.room_type ?? undefined,
              amenities: pref.amenities ?? undefined,
            }
          : null;

        return [id, {
          name: pMap.get(id)?.full_name ?? '',
          email: pMap.get(id)?.email ?? '',
          course: perMap.get(id)?.course ?? '',
          university: perMap.get(id)?.institution ?? '',
          year: perMap.get(id)?.year_of_study ?? 0,
          verified: !!pMap.get(id)?.verified,
          onboardingCompleted: !!pMap.get(id)?.onboarding_completed,
          status: pMap.get(id)?.status ?? null,
          lifestyle,
          preferences,
          trust: trust ? { score: Number(trust.score ?? 0), level: trust.level ?? 'new' } : null,
          verificationLevel: (verif?.level as 'none' | 'bronze' | 'silver' | 'gold') ?? 'none',
        }];
      }));
      setProfileEnrichment(enrichment);
    })();
  }, [baseApplications]);

  const allApplications = useMemo<DetailedApplication[]>(() => {
    const list = listingFilter
      ? baseApplications.filter(app => app.roomId === listingFilter || app.propertyId === listingFilter)
      : baseApplications;
    return list.map(app => {
      const room = app.roomId ? getRoom(app.roomId) : undefined;
      const property = app.propertyId
        ? getProperty(app.propertyId)
        : room?.propertyId
          ? getProperty(room.propertyId)
          : undefined;
      const roomLabel = room?.title || 'Quarto';
      const propertyLabel = property?.title || 'Alojamento';
      const enriched = profileEnrichment.get(app.userId);

      const compatibility = computeCompatibility({
        lifestyle: enriched?.lifestyle,
        preferences: enriched?.preferences,
        room,
        property,
        moveInDate: app.moveInDate ?? null,
      });

      const trust = computeTrust({
        trust: enriched?.trust,
        profile: {
          verified: enriched?.verified,
          onboardingCompleted: enriched?.onboardingCompleted,
          status: enriched?.status,
        },
      });

      const verificationLevel = enriched?.verificationLevel ?? 'none';

      return {
        ...app,
        applicantName: enriched?.name || '',
        applicantEmail: enriched?.email || '',
        applicantCourse: enriched?.course || '',
        applicantUniversity: enriched?.university || '',
        applicantYear: enriched?.year || 0,
        compatibilityScore: compatibility.score,
        compatibility,
        trustScore: trust.score,
        trustLevel: trust.level,
        trustLabel: trust.label,
        trustIsFallback: trust.isFallback,
        verificationLevel,
        verificationLabel: verificationLevel === 'none' ? 'Não verificado' : 'Verificado',
        verificationPending: false,
        listingTitle: room ? `${roomLabel} · ${propertyLabel}` : propertyLabel,
        listingPrice: room?.price || 0,
      };
    });
  }, [baseApplications, listingFilter, getRoom, getProperty, profileEnrichment]);

  const stats = useMemo(() => {
    const t = baseApplications;
    return {
      total: t.length,
      pending: t.filter(a => a.status === 'pending').length,
      underReview: t.filter(a => a.status === 'under_review').length,
      accepted: t.filter(a => a.status === 'accepted').length,
      confirmed: t.filter(a => a.status === 'confirmed').length,
      rejected: t.filter(a => a.status === 'rejected').length,
    };
  }, [baseApplications]);

  const getUnavailableReason = useCallback((app: DetailedApplication): string | null => {
    if (!app.roomId) return null;
    if (app.status === 'accepted' || app.status === 'confirmed') return null;

    const room = getRoom(app.roomId);
    if (!room) return null;

    const status = normalizeRoomStatus(room.status);

    if (status === 'reserved') return 'Este quarto já está reservado.';
    if (status === 'occupied') return 'Este quarto já está ocupado.';

    return null;
  }, [getRoom]);

  const bestCandidateId = useMemo(() => {
    const actionable = allApplications.filter(
      app =>
        isActionableStatus(app.status) &&
        !getUnavailableReason(app) &&
        canBeBestCandidate(app),
    );

    if (actionable.length === 0) return null;

    return actionable.reduce((best, current) =>
      decisionScore(current) > decisionScore(best) ? current : best,
    ).id;
  }, [allApplications, getUnavailableReason]);

  const filteredAndSorted = useMemo(() => {
    let list = allApplications;

    if (statusFilter !== 'all') {
      list = list.filter(app => app.status === statusFilter);
    }

    if (specialFilters.has('verified')) {
      list = list.filter(app => app.verificationLevel !== 'none');
    }

    if (specialFilters.has('compat80')) {
      list = list.filter(app => app.compatibilityScore >= 80);
    }

    if (specialFilters.has('trust75')) {
      list = list.filter(app => app.trustScore >= 75);
    }

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

  const toggleSpecial = (filter: SpecialFilter) => {
    setSpecialFilters(previous => {
      const next = new Set(previous);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };

  const handleAccept = async (app: DetailedApplication) => {
    const unavailableReason = getUnavailableReason(app);

    if (unavailableReason) {
      toast.error('Não é possível aceitar esta candidatura', {
        description: unavailableReason,
      });
      setConfirmAcceptApp(null);
      return;
    }

    if (!app.roomId) {
      toast.error('Candidatura sem quarto associado', {
        description: 'Não é possível aceitar uma candidatura sem room_id definido.',
      });
      setConfirmAcceptApp(null);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      toast.error('Sessão expirada. Inicia sessão novamente.');
      return;
    }

    const res = await fetch(
      `${supabaseUrl}/functions/v1/make-server-08c694dc/applications/${encodeURIComponent(app.id)}/accept`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      }
    );
    const result = await res.json();
    if (!res.ok) {
      console.error('[APPLICATIONS] accept failed', result);
      toast.error('Não foi possível aceitar a candidatura.', { description: result?.error });
      return;
    }

    await refreshProperties(true);
    toast.success(`Candidatura de ${app.applicantName || 'candidato'} aceite!`, {
      description: 'O quarto foi marcado como reservado.',
    });
    setVersion(value => value + 1);
    setConfirmAcceptApp(null);
    setSelectedApp(null);
  };

  const handleReject = (app: DetailedApplication) => {
    setConfirmRejectApp(app);
  };

  const handleContactStudent = useCallback(async (app: DetailedApplication) => {
    if (!user) return;
    const room = app.roomId ? getRoom(app.roomId) : undefined;
    const propertyId = app.propertyId || room?.propertyId;
    const property = propertyId ? getProperty(propertyId) : undefined;

    const contextMsg = `Olá, ${app.applicantName || 'estudante'}! Obrigado pela tua candidatura${room ? ` para ${room.title}` : ''}. Gostava de falar contigo sobre os próximos passos.`;

    try {
      const conversationId = await findOrCreateConversation({
        studentId: app.userId,
        studentName: app.applicantName || 'Estudante',
        landlordId: user.id,
        landlordName: user.name || 'Senhorio',
        roomId: room?.id,
        propertyId: property?.id,
        accommodationTitle: room?.title || property?.title,
        accommodationPrice: room?.price,
        accommodationImage: room?.images[0] || property?.images[0],
        initialMessage: contextMsg,
        initialSenderId: user.id,
        initialSenderName: user.name || 'Senhorio',
      });
      navigate(`/messages?conversation=${conversationId}`);
    } catch (err) {
      console.error('[LandlordApplications] handleContactStudent:', err);
      toast.error('Erro ao criar conversa. Tenta novamente.');
    }
  }, [user, getRoom, getProperty, navigate]);

  const handleRejectConfirm = async () => {
    if (!confirmRejectApp) return;

    const { error } = await supabase
      .from('applications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', confirmRejectApp.id);

    if (error) {
      console.error('[APPLICATIONS] reject failed', error);
      toast.error('Não foi possível rejeitar a candidatura.', { description: error.message });
      setConfirmRejectApp(null);
      return;
    }

    await refreshProperties(true);
    toast.success('Candidatura rejeitada', {
      description: 'O estudante foi notificado da decisão.',
    });
    setVersion(value => value + 1);
    setSelectedApp(null);
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
    confirmed: 'Confirmada',
  };

  const statusBadgeClass: Record<ApplicationStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-600',
    confirmed: 'bg-emerald-100 text-emerald-700',
  };

  const confirmAcceptUnavailableReason = confirmAcceptApp ? getUnavailableReason(confirmAcceptApp) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/landlord/listings')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos alojamentos
        </button>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Candidaturas</h1>
          </div>
          <p className="text-muted-foreground">Gere e compara as candidaturas aos teus alojamentos</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {([
            { label: 'Total', value: stats.total, key: 'all', color: 'text-foreground' },
            { label: 'Pendentes', value: stats.pending, key: 'pending', color: 'text-yellow-600' },
            { label: 'Em análise', value: stats.underReview, key: 'under_review', color: 'text-blue-600' },
            { label: 'Aceites', value: stats.accepted, key: 'accepted', color: 'text-green-600' },
            { label: 'Confirmadas', value: stats.confirmed, key: 'confirmed', color: 'text-emerald-600' },
            { label: 'Rejeitadas', value: stats.rejected, key: 'rejected', color: 'text-red-600' },
          ] as const).map(({ label, value, key, color }) => (
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

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              value={sortBy}
              onChange={event => setSortBy(event.target.value as SortOption)}
              className="text-sm bg-transparent outline-none cursor-pointer text-foreground"
            >
              <option value="recent">Mais recentes</option>
              <option value="compatibility">Maior compatibilidade</option>
              <option value="trust">Maior trust score</option>
              <option value="decision">Melhor candidato</option>
              <option value="movein">Entrada mais próxima</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtrar:
            </span>

            {([
              { key: 'verified' as SpecialFilter, label: 'Verificados' },
              { key: 'compat80' as SpecialFilter, label: 'Compat. >= 80%' },
              { key: 'trust75' as SpecialFilter, label: 'Trust >= 75' },
            ]).map(({ key, label }) => (
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

          {(specialFilters.size > 0 || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSpecialFilters(new Set());
                setStatusFilter('all');
              }}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {filteredAndSorted.length} candidatura{filteredAndSorted.length !== 1 ? 's' : ''} encontrada{filteredAndSorted.length !== 1 ? 's' : ''}
        </p>

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
              const isActionable = isActionableStatus(app.status);
              const unavailableReason = getUnavailableReason(app);
              const canAccept = isActionable && !unavailableReason;

              return (
                <Card
                  key={app.id}
                  className={`p-5 hover:shadow-lg transition-all cursor-pointer group ${isBest ? 'ring-2 ring-amber-400 bg-amber-50/30' : ''}`}
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
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

                        {unavailableReason && isActionable && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-[11px] font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Quarto indisponível
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {app.applicantCourse || 'Curso não indicado'}
                          {app.applicantYear ? ` · ${app.applicantYear}º ano` : ''}
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

                    <div className="flex sm:flex-col items-center gap-2 flex-shrink-0" onClick={event => event.stopPropagation()}>
                      {isActionable ? (
                        <>
                          <Button
                            onClick={() => setConfirmAcceptApp(app)}
                            disabled={!canAccept}
                            title={unavailableReason || undefined}
                            className="flex-1 sm:flex-none sm:w-28 bg-green-600 hover:bg-green-700 text-sm py-2 disabled:bg-muted disabled:text-muted-foreground"
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
                            onClick={() => handleContactStudent(app)}
                            variant="outline"
                            className="sm:w-28 text-sm py-2"
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                            Conversar
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className={`flex items-center gap-1.5 text-sm font-medium ${
                            app.status === 'accepted' || app.status === 'confirmed'
                              ? 'text-green-700'
                              : app.status === 'withdrawn'
                                ? 'text-muted-foreground'
                                : 'text-red-600'
                          }`}>
                            {app.status === 'accepted' || app.status === 'confirmed'
                              ? <CheckCircle className="w-4 h-4" />
                              : <XCircle className="w-4 h-4" />}
                            {statusLabel[app.status]}
                          </div>

                          <Button onClick={() => handleContactStudent(app)} variant="outline" className="sm:w-28 text-sm py-2">
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                            Mensagem
                          </Button>
                        </>
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

      {selectedApp && (
        <ApplicationDetailModal
          app={selectedApp}
          isBest={selectedApp.id === bestCandidateId}
          unavailableReason={getUnavailableReason(selectedApp)}
          onClose={() => setSelectedApp(null)}
          onAccept={() => setConfirmAcceptApp(selectedApp)}
          onReject={() => handleReject(selectedApp)}
          onMessage={() => { void handleContactStudent(selectedApp); }}
          getCompatColor={getCompatColor}
          getTrustColor={getTrustColor}
          statusLabel={statusLabel}
          statusBadgeClass={statusBadgeClass}
        />
      )}

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
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-muted disabled:text-muted-foreground"
                disabled={!!confirmAcceptUnavailableReason}
                onClick={() => handleAccept(confirmAcceptApp)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar aceitação
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-4 border rounded-xl ${
              confirmAcceptUnavailableReason
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                confirmAcceptUnavailableReason ? 'text-red-600' : 'text-amber-600'
              }`} />
              <p className={`text-sm ${
                confirmAcceptUnavailableReason ? 'text-red-800' : 'text-amber-800'
              }`}>
                {confirmAcceptUnavailableReason || 'Ao aceitar esta candidatura, o quarto ficará reservado. A ocupação só fica ativa quando o estudante confirmar a estadia.'}
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

interface DetailModalProps {
  app: DetailedApplication;
  isBest: boolean;
  unavailableReason: string | null;
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
  app,
  isBest,
  unavailableReason,
  onClose,
  onAccept,
  onReject,
  onMessage,
  getCompatColor,
  getTrustColor,
  statusLabel,
  statusBadgeClass,
}: DetailModalProps) {
  const isActionable = isActionableStatus(app.status);
  const canAccept = isActionable && !unavailableReason;
  const isPositiveFinal = app.status === 'accepted' || app.status === 'confirmed';

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

            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-muted disabled:text-muted-foreground"
              onClick={onAccept}
              disabled={!canAccept}
              title={unavailableReason || undefined}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aceitar candidatura
            </Button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span className={`flex items-center gap-2 font-medium text-sm ${
              isPositiveFinal
                ? 'text-green-700'
                : app.status === 'withdrawn'
                  ? 'text-muted-foreground'
                  : 'text-red-600'
            }`}>
              {isPositiveFinal ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
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
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${isBest ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-primary to-blue-600'}`}>
            {app.applicantName.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-foreground">{app.applicantName || 'Estudante'}</h3>

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
              {app.verificationLevel !== 'none' && <TrustPill type="verified-student" size="sm" />}
            </div>
          </div>
        </div>

        {unavailableReason && (
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-900">Quarto indisponível</p>
              <p className="text-sm text-orange-800">{unavailableReason}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className={`p-4 rounded-xl ${getCompatColor(app.compatibilityScore)}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Compatibilidade</span>
              <Star className="w-4 h-4" />
            </div>
            <p className="text-3xl font-bold">{app.compatibilityScore}%</p>
            <p className="text-xs mt-1 opacity-75">{app.compatibility?.label ?? 'Match moderado'}</p>
            {((app.compatibility?.reasons?.length ?? 0) > 0 || (app.compatibility?.conflicts?.length ?? 0) > 0) && (
              <ul className="mt-2 space-y-0.5 text-[11px] opacity-90">
                {(app.compatibility?.conflicts ?? []).slice(0, 3).map(c => (
                  <li key={`c-${c}`} className="flex items-start gap-1">
                    <span aria-hidden>•</span>
                    <span>{c}</span>
                  </li>
                ))}
                {(app.compatibility?.reasons ?? []).slice(0, 3 - Math.min(3, app.compatibility?.conflicts?.length ?? 0)).map(r => (
                  <li key={`r-${r}`} className="flex items-start gap-1">
                    <span aria-hidden>•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`p-4 rounded-xl ${getTrustColor(app.trustScore)}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Trust Score</span>
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-3xl font-bold">{app.trustScore}</p>
            <p className="text-xs mt-1 opacity-75">{app.trustLabel ?? 'Perfil recente'}</p>
            {app.trustIsFallback && (
              <p className="text-[11px] mt-1 opacity-70">Estimativa com base no perfil</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground truncate">
                {app.applicantEmail || 'Não disponível'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Curso</p>
              <p className="text-sm font-medium text-foreground">
                {app.applicantCourse || 'Não indicado'}
                {' · '}
                {app.applicantYear ? `${app.applicantYear}º ano` : 'Não indicado'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {app.applicantUniversity || 'Instituição não indicada'}
              </p>
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
                <p className="text-sm font-medium text-foreground">
                  {new Date(app.moveInDate).toLocaleDateString('pt-PT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {app.message && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Mensagem do candidato</p>
            <div className="p-4 bg-muted/40 rounded-xl border border-border">
              <p className="text-sm text-foreground leading-relaxed italic">"{app.message}"</p>
            </div>
          </div>
        )}

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

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Users,
  Home,
  DoorOpen,
  DoorClosed,
  FileText,
  Shield,
  MapPin,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { useAdminUsers, useApplications, useReports } from '../../hooks/useDb';
import { useProperties } from '../../context/PropertiesContext';
import { supabase } from '../../lib/supabase';

const MONTH_LABELS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function isInCurrentMonth(date: Date, now: Date): boolean {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function AdminAnalytics() {
  const { users: adminUsers, loading: usersLoading } = useAdminUsers();
  const { properties, rooms, loading: propertiesLoading } = useProperties();
  const { applications, loading: applicationsLoading } = useApplications({ scope: 'all' });
  const { reports, loading: reportsLoading } = useReports();

  const [trustRows, setTrustRows] = useState<{ user_id: string; score: number }[]>([]);
  const [trustLoading, setTrustLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTrustLoading(true);
      const { data, error } = await supabase
        .from('trust_scores')
        .select('user_id, score');
      if (cancelled) return;
      if (error) {
        console.error('[AdminAnalytics] trust_scores fetch:', error.message);
        setTrustRows([]);
      } else {
        setTrustRows((data ?? []) as { user_id: string; score: number }[]);
      }
      setTrustLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const now = useMemo(() => new Date(), []);
  const currentMonthLabel = `${MONTH_LABELS_PT[now.getMonth()]} ${now.getFullYear()}`;

  const loading =
    usersLoading || propertiesLoading || applicationsLoading || reportsLoading || trustLoading;

  // KPIs
  const totalStudents = adminUsers.filter((u) => u.type === 'student').length;
  const totalLandlords = adminUsers.filter((u) => u.type === 'landlord').length;
  const publishedProperties = properties.filter(
    (p) => p.status === 'active' && !p.adminSuspended,
  ).length;

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(
    (r) => r.status === 'occupied' || r.status === 'reserved',
  ).length;
  const availableRooms = rooms.filter((r) => r.status === 'available').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const applicationsThisMonth = applications.filter((a) => isInCurrentMonth(a.createdAt, now)).length;

  // Trust score averages
  const trustByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of trustRows) map.set(t.user_id, t.score);
    return map;
  }, [trustRows]);

  const { avgStudentTrust, avgLandlordTrust } = useMemo(() => {
    let studSum = 0, studN = 0, landSum = 0, landN = 0;
    for (const u of adminUsers) {
      const score = trustByUser.get(u.id);
      if (score === undefined) continue;
      if (u.type === 'student') { studSum += score; studN += 1; }
      else if (u.type === 'landlord') { landSum += score; landN += 1; }
    }
    return {
      avgStudentTrust: studN > 0 ? Math.round(studSum / studN) : null,
      avgLandlordTrust: landN > 0 ? Math.round(landSum / landN) : null,
    };
  }, [adminUsers, trustByUser]);

  // Reports last 30 days
  const reportsStats = useMemo(() => {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recent = reports.filter((r) => r.createdAt >= thirtyDaysAgo);
    const resolved = recent.filter((r) => r.status === 'resolved');
    const resolutionTimesMs = resolved
      .filter((r) => r.resolvedAt)
      .map((r) => (r.resolvedAt!.getTime() - r.createdAt.getTime()));
    const avgDays = resolutionTimesMs.length > 0
      ? (resolutionTimesMs.reduce((a, b) => a + b, 0) / resolutionTimesMs.length) / (1000 * 60 * 60 * 24)
      : null;
    return {
      total: recent.length,
      resolved: resolved.length,
      percentage: recent.length > 0 ? Math.round((resolved.length / recent.length) * 100) : 0,
      avgDays,
    };
  }, [reports, now]);

  // City aggregation
  const cityStats = useMemo(() => {
    const propertyToCity = new Map<string, string>();
    for (const p of properties) {
      if (p.city) propertyToCity.set(p.id, p.city);
    }
    const roomToCity = new Map<string, string>();
    for (const r of rooms) {
      const city = propertyToCity.get(r.propertyId);
      if (city) roomToCity.set(r.id, city);
    }

    const agg = new Map<string, {
      city: string;
      properties: number;
      rooms: number;
      occupied: number;
      applications: number;
    }>();

    const get = (city: string) => {
      let entry = agg.get(city);
      if (!entry) {
        entry = { city, properties: 0, rooms: 0, occupied: 0, applications: 0 };
        agg.set(city, entry);
      }
      return entry;
    };

    for (const p of properties) {
      if (!p.city) continue;
      get(p.city).properties += 1;
    }
    for (const r of rooms) {
      const city = propertyToCity.get(r.propertyId);
      if (!city) continue;
      const entry = get(city);
      entry.rooms += 1;
      if (r.status === 'occupied' || r.status === 'reserved') entry.occupied += 1;
    }
    for (const a of applications) {
      const city = (a.propertyId && propertyToCity.get(a.propertyId))
        ?? (a.roomId && roomToCity.get(a.roomId))
        ?? null;
      if (!city) continue;
      get(city).applications += 1;
    }

    return Array.from(agg.values())
      .map((c) => ({
        ...c,
        occupancyRate: c.rooms > 0 ? Math.round((c.occupied / c.rooms) * 100) : 0,
      }))
      .sort((a, b) => b.applications - a.applications || b.properties - a.properties);
  }, [properties, rooms, applications]);

  const hasAnyData =
    totalStudents > 0 ||
    totalLandlords > 0 ||
    properties.length > 0 ||
    rooms.length > 0 ||
    applications.length > 0;

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <Loader2 className="w-10 h-10 text-gray-300 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-gray-500">A carregar analytics…</p>
        </Card>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Métricas estratégicas da plataforma UniRoom</p>
        </div>
        <Card className="p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">Ainda não há dados suficientes para apresentar analytics.</p>
          <p className="text-sm text-gray-500">As métricas aparecerão aqui assim que existirem utilizadores, propriedades e candidaturas.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Métricas estratégicas da plataforma UniRoom</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          <Calendar className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">{currentMonthLabel}</span>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Estudantes (Total)</p>
          <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Senhorios (Total)</p>
          <p className="text-3xl font-bold text-gray-900">{totalLandlords}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Home className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Casas Publicadas</p>
          <p className="text-3xl font-bold text-gray-900">{publishedProperties}</p>
          <p className="text-xs text-gray-500 mt-2">{totalRooms} quartos totais</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <DoorClosed className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Taxa de Ocupação</p>
          <p className="text-3xl font-bold text-gray-900">{occupancyRate}%</p>
          <p className="text-xs text-gray-500 mt-2">{occupiedRooms} de {totalRooms} quartos</p>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Candidaturas ({MONTH_LABELS_PT[now.getMonth()]})</p>
              <p className="text-2xl font-bold text-gray-900">{applicationsThisMonth}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <DoorClosed className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Quartos Arrendados</p>
              <p className="text-2xl font-bold text-gray-900">{occupiedRooms}</p>
            </div>
            <span className="text-xs text-gray-500">de {totalRooms}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <DoorOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Quartos Disponíveis</p>
              <p className="text-2xl font-bold text-gray-900">{availableRooms}</p>
            </div>
            <span className="text-xs text-gray-500">{totalRooms > 0 ? Math.round((availableRooms / totalRooms) * 100) : 0}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${totalRooms > 0 ? (availableRooms / totalRooms) * 100 : 0}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Top Cities */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Cidades Mais Ativas</h2>
          <Badge variant="outline">{cityStats.length} {cityStats.length === 1 ? 'cidade' : 'cidades'}</Badge>
        </div>
        {cityStats.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Sem dados de cidades para apresentar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Posição</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cidade</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Propriedades</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Quartos</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Taxa de Ocupação</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Candidaturas</th>
                </tr>
              </thead>
              <tbody>
                {cityStats.map((city, index) => (
                  <tr key={city.city} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{city.city}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">{city.properties}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">{city.rooms}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className={`h-full rounded-full ${
                              city.occupancyRate >= 85
                                ? 'bg-green-500'
                                : city.occupancyRate >= 70
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${city.occupancyRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-10">{city.occupancyRate}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-900">{city.applications}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quality Metrics */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Métricas de Qualidade</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">Denúncias Resolvidas (30d)</p>
            {reportsStats.total === 0 ? (
              <p className="text-sm text-gray-500 italic">Sem denúncias no período.</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{reportsStats.resolved}</span>
                  <span className="text-sm text-gray-500">/ {reportsStats.total}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      reportsStats.percentage >= 80 ? 'bg-green-500'
                      : reportsStats.percentage >= 60 ? 'bg-yellow-500'
                      : 'bg-red-500'
                    }`}
                    style={{ width: `${reportsStats.percentage}%` }}
                  />
                </div>
              </>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">Tempo Médio Resolução</p>
            {reportsStats.avgDays === null ? (
              <p className="text-sm text-gray-500 italic">Sem dados suficientes.</p>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {reportsStats.avgDays.toFixed(1)} dias
              </p>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">Trust Score Médio Estudantes</p>
            {avgStudentTrust === null ? (
              <p className="text-sm text-gray-500 italic">Sem dados.</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{avgStudentTrust}</span>
                  <span className="text-sm text-gray-500">/ 100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      avgStudentTrust >= 80 ? 'bg-green-500'
                      : avgStudentTrust >= 60 ? 'bg-yellow-500'
                      : 'bg-red-500'
                    }`}
                    style={{ width: `${avgStudentTrust}%` }}
                  />
                </div>
              </>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">Trust Score Médio Senhorios</p>
            {avgLandlordTrust === null ? (
              <p className="text-sm text-gray-500 italic">Sem dados.</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{avgLandlordTrust}</span>
                  <span className="text-sm text-gray-500">/ 100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      avgLandlordTrust >= 80 ? 'bg-green-500'
                      : avgLandlordTrust >= 60 ? 'bg-yellow-500'
                      : 'bg-red-500'
                    }`}
                    style={{ width: `${avgLandlordTrust}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-primary/5 to-blue-50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Resumo</h3>
            <p className="text-sm text-gray-600">
              Dados históricos mensais ainda não disponíveis — gráficos de evolução aparecerão aqui assim que existirem snapshots suficientes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

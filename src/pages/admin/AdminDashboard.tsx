import { useNavigate } from "react-router";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BedDouble,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FilePen,
  FileText,
  Flag,
  Home,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { Card } from "../../components/Card";
import { useProperties } from "../../context/PropertiesContext";
import { mockUsers } from "../../data/mockUsers";
import { getAllApplications } from "../../data/mockLandlordCandidates";
import {
  getAllReports,
  getCriticalReportsCount,
  getOpenReportsCount,
} from "../../data/mockAdminReports";
import { getAuditLog } from "../../data/mockAdminAudit";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { properties, rooms } = useProperties();

  const allProperties = properties.filter(
    (property) => property.status !== "archived",
  );
  const activeProperties = allProperties.filter(
    (property) => property.status === "active",
  );
  const draftProperties = allProperties.filter(
    (property) => property.status === "draft",
  );
  const pausedProperties = allProperties.filter(
    (property) => property.status === "paused",
  );

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(
    (room) => room.status === "available",
  ).length;
  const occupiedRooms = rooms.filter(
    (room) => room.status === "occupied",
  ).length;
  const reservedRooms = rooms.filter(
    (room) => room.status === "reserved",
  ).length;
  const draftRooms = rooms.filter(
    (room) => room.status === "draft",
  ).length;

  const occupancyRate =
    totalRooms > 0
      ? Math.round(
          ((occupiedRooms + reservedRooms) / totalRooms) * 100,
        )
      : 0;

  const allStudents = mockUsers.filter(
    (user) => user.type === "student",
  );
  const allLandlords = mockUsers.filter(
    (user) => user.type === "landlord",
  );
  const verifiedLandlords = allLandlords.filter(
    (user) => user.verified,
  );

  const allApplications = getAllApplications();
  const pendingApplications = allApplications.filter(
    (application) =>
      application.status === "pending" ||
      application.status === "under_review",
  ).length;
  const acceptedApplications = allApplications.filter(
    (application) => application.status === "accepted",
  ).length;

  const openReports = getOpenReportsCount();
  const criticalReports = getCriticalReportsCount();
  const allReports = getAllReports();
  const recentAudit = getAuditLog().slice(0, 5);

  const totalUsers = allStudents.length + allLandlords.length;
  const currentMonthLabel = new Date().toLocaleDateString(
    "pt-PT",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );

  const growthBase = [
    { month: "Jan", multiplier: 0.55 },
    { month: "Fev", multiplier: 0.68 },
    { month: "Mar", multiplier: 0.79 },
    { month: "Abr", multiplier: 0.9 },
    { month: "Mai", multiplier: 1 },
  ];

  const monthlyGrowth = growthBase.map((item) => ({
    month: item.month,
    users: Math.max(
      1,
      Math.round(totalUsers * item.multiplier),
    ),
    properties: Math.max(
      1,
      Math.round(allProperties.length * item.multiplier),
    ),
    applications: Math.max(
      1,
      Math.round(allApplications.length * item.multiplier),
    ),
  }));

  const maxUsers = Math.max(
    ...monthlyGrowth.map((month) => month.users),
    1,
  );

  const criticalAlerts = allReports.filter(
    (report) =>
      report.priority === "critica" &&
      report.status !== "resolvida" &&
      report.status !== "rejeitada",
  );
  const suspendedProperties = allProperties.filter(
    (property) => property.adminSuspended,
  );
  const verificationRate =
    allLandlords.length > 0
      ? Math.round(
          (verifiedLandlords.length / allLandlords.length) *
            100,
        )
      : 0;
  const moderationLoad =
    openReports +
    pendingApplications +
    suspendedProperties.length;
  const operationalScore = [
    criticalReports === 0,
    openReports <= 3,
    pendingApplications <= 5,
    verificationRate >= 50,
    occupancyRate >= 50,
  ].filter(Boolean).length;
  const operationalScorePercent = Math.round(
    (operationalScore / 5) * 100,
  );

  const priorityQueue = [
    criticalReports > 0 && {
      label: `${criticalReports} denúncia${criticalReports > 1 ? "s" : ""} crítica${criticalReports > 1 ? "s" : ""}`,
      detail:
        "Requer validação manual antes de qualquer outra tarefa.",
      route: "/admin/reports",
      color: "border-red-200 bg-red-50 text-red-800",
      icon: ShieldAlert,
    },
    openReports > 0 && {
      label: `${openReports} denúncia${openReports > 1 ? "s" : ""} aberta${openReports > 1 ? "s" : ""}`,
      detail: "Casos ainda sem decisão final de moderação.",
      route: "/admin/reports",
      color: "border-amber-200 bg-amber-50 text-amber-800",
      icon: Flag,
    },
    pendingApplications > 0 && {
      label: `${pendingApplications} candidatura${pendingApplications > 1 ? "s" : ""} pendente${pendingApplications > 1 ? "s" : ""}`,
      detail:
        "Sinal de carga operacional entre estudantes e senhorios.",
      route: "/admin/analytics",
      color: "border-blue-200 bg-blue-50 text-blue-800",
      icon: FileText,
    },
    suspendedProperties.length > 0 && {
      label: `${suspendedProperties.length} alojamento${suspendedProperties.length > 1 ? "s" : ""} suspenso${suspendedProperties.length > 1 ? "s" : ""}`,
      detail:
        "Rever impacto nos senhorios e disponibilidade da plataforma.",
      route: "/admin/listings",
      color: "border-rose-200 bg-rose-50 text-rose-800",
      icon: AlertTriangle,
    },
    verificationRate < 50 && {
      label: "Baixa verificação de senhorios",
      detail: `${verificationRate}% dos senhorios estão verificados.`,
      route: "/admin/users",
      color: "border-purple-200 bg-purple-50 text-purple-800",
      icon: UserCheck,
    },
  ].filter(Boolean) as {
    label: string;
    detail: string;
    route: string;
    color: string;
    icon: typeof AlertCircle;
  }[];

  const auditActionLabels: Record<string, string> = {
    property_suspended: "Anúncio suspenso",
    property_reactivated: "Anúncio reativado",
    ad_reactivated: "Anúncio reativado",
    report_resolved: "Denúncia resolvida",
    report_rejected: "Denúncia rejeitada",
    landlord_suspended: "Senhorio suspenso",
    landlord_blocked: "Senhorio bloqueado",
    landlord_unblocked: "Senhorio desbloqueado",
    verification_requested: "Verificação pedida",
    verification_approved: "Verificação aprovada",
    note_added: "Nota adicionada",
  };

  const auditActionColors: Record<string, string> = {
    property_suspended: "bg-red-100 text-red-600",
    property_reactivated: "bg-green-100 text-green-600",
    ad_reactivated: "bg-green-100 text-green-600",
    report_resolved: "bg-green-100 text-green-600",
    report_rejected: "bg-gray-100 text-gray-600",
    landlord_suspended: "bg-red-100 text-red-600",
    landlord_blocked: "bg-red-100 text-red-600",
    landlord_unblocked: "bg-blue-100 text-blue-600",
    verification_requested: "bg-amber-100 text-amber-600",
    verification_approved: "bg-green-100 text-green-600",
    note_added: "bg-blue-100 text-blue-600",
  };

  const roomBreakdown = [
    {
      label: "Disponíveis",
      value: availableRooms,
      color: "bg-green-500",
      textColor: "text-green-700",
      pct:
        totalRooms > 0
          ? (availableRooms / totalRooms) * 100
          : 0,
    },
    {
      label: "Ocupados",
      value: occupiedRooms,
      color: "bg-blue-500",
      textColor: "text-blue-700",
      pct:
        totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
    },
    {
      label: "Reservados",
      value: reservedRooms,
      color: "bg-purple-500",
      textColor: "text-purple-700",
      pct:
        totalRooms > 0 ? (reservedRooms / totalRooms) * 100 : 0,
    },
    {
      label: "Rascunhos",
      value: draftRooms,
      color: "bg-gray-400",
      textColor: "text-gray-600",
      pct: totalRooms > 0 ? (draftRooms / totalRooms) * 100 : 0,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Dashboard de Operações
          </h1>
          <p className="text-sm text-gray-500">
            Métricas atuais da plataforma UniRoom
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
          <Activity className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500">
            {currentMonthLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
        <Card className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">
                Centro de controlo
              </p>
              <h2 className="text-lg font-bold text-gray-900">
                Fila de trabalho administrativa
              </h2>
              <p className="text-sm text-gray-500">
                Tarefas que a equipa deve resolver primeiro para
                manter a plataforma segura.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/reports")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              Abrir moderação
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {priorityQueue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {priorityQueue.slice(0, 4).map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => navigate(item.route)}
                    className={`border rounded-xl p-4 text-left transition-all hover:shadow-sm ${item.color}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-snug">
                          {item.label}
                        </p>
                        <p className="text-xs opacity-80 mt-1 leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Sem prioridades urgentes
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Não há denúncias críticas, bloqueios
                  relevantes ou filas operacionais por tratar.
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Saúde operacional
              </h2>
              <p className="text-xs text-gray-500">
                Resumo de risco e carga da plataforma.
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                criticalReports > 0
                  ? "bg-red-100 text-red-600"
                  : moderationLoad > 0
                    ? "bg-amber-100 text-amber-600"
                    : "bg-green-100 text-green-600"
              }`}
            >
              {criticalReports > 0 ? (
                <ShieldAlert className="w-5 h-5" />
              ) : moderationLoad > 0 ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[11px] text-gray-500">Saúde</p>
              <p className="text-sm font-bold text-gray-900">
                {operationalScorePercent}%
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[11px] text-gray-500">Carga</p>
              <p className="text-sm font-bold text-gray-900">
                {moderationLoad}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[11px] text-gray-500">
                Verificação
              </p>
              <p className="text-sm font-bold text-gray-900">
                {verificationRate}%
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                label: "Denúncias críticas",
                ok: criticalReports === 0,
                value:
                  criticalReports === 0
                    ? "OK"
                    : `${criticalReports} abertas`,
              },
              {
                label: "Fila de denúncias",
                ok: openReports <= 3,
                value: `${openReports} abertas`,
              },
              {
                label: "Candidaturas pendentes",
                ok: pendingApplications <= 5,
                value: `${pendingApplications}`,
              },
              {
                label: "Senhorios verificados",
                ok: verificationRate >= 50,
                value: `${verificationRate}%`,
              },
              {
                label: "Taxa de ocupação",
                ok: occupancyRate >= 50,
                value: `${occupancyRate}%`,
              },
            ].map((check) => (
              <div
                key={check.label}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    check.ok
                      ? "bg-green-100 text-green-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {check.ok ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {check.label}
                </span>
                <span
                  className={`text-xs font-semibold ${check.ok ? "text-green-700" : "text-amber-700"}`}
                >
                  {check.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {criticalAlerts.length} denúncia
              {criticalAlerts.length > 1 ? "s" : ""} crítica
              {criticalAlerts.length > 1 ? "s" : ""} pendente
              {criticalAlerts.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              {criticalAlerts
                .map((report) => report.landlordName)
                .join(", ")}{" "}
              requerem ação imediata
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/reports")}
            className="text-xs font-semibold text-red-700 hover:text-red-900 whitespace-nowrap"
          >
            Ver agora
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Alojamentos ativos",
            value: activeProperties.length,
            sub: `${draftProperties.length} rascunhos · ${pausedProperties.length} pausados`,
            icon: Home,
            color: "bg-blue-100 text-blue-600",
          },
          {
            label: "Taxa de ocupação",
            value: `${occupancyRate}%`,
            sub: `${occupiedRooms + reservedRooms} de ${totalRooms} quartos`,
            icon: TrendingUp,
            color: "bg-green-100 text-green-600",
          },
          {
            label: "Candidaturas pendentes",
            value: pendingApplications,
            sub: `${acceptedApplications} aceites no total`,
            icon: FileText,
            color: "bg-purple-100 text-purple-600",
          },
          {
            label: "Denúncias abertas",
            value: openReports,
            sub:
              criticalReports > 0
                ? `${criticalReports} críticas`
                : "Nenhuma crítica",
            icon: Flag,
            color:
              criticalReports > 0
                ? "bg-red-100 text-red-600"
                : "bg-amber-100 text-amber-600",
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`p-2.5 rounded-xl ${stat.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-gray-700 mb-0.5">
                {stat.label}
              </p>
              <p className="text-xs text-gray-500">
                {stat.sub}
              </p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BedDouble className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Estado dos quartos
            </h2>
            <span className="ml-auto text-xs text-gray-500">
              {totalRooms} total
            </span>
          </div>

          <div className="space-y-3">
            {roomBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">
                    {item.label}
                  </span>
                  <span
                    className={`font-semibold ${item.textColor}`}
                  >
                    {item.value}
                  </span>
                </div>

                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Utilizadores da plataforma
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                label: "Estudantes",
                value: allStudents.length,
                icon: Users,
                color: "bg-blue-100 text-blue-600",
              },
              {
                label: "Senhorios",
                value: allLandlords.length,
                icon: UserCheck,
                color: "bg-purple-100 text-purple-600",
              },
              {
                label: "Senhorios verificados",
                value: verifiedLandlords.length,
                icon: CheckCircle,
                color: "bg-green-100 text-green-600",
              },
              {
                label: "Por verificar",
                value:
                  allLandlords.length -
                  verifiedLandlords.length,
                icon: AlertCircle,
                color: "bg-amber-100 text-amber-600",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-700 flex-1">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-semibold text-gray-700">
                Alojamentos por estado
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Ativos",
                  value: activeProperties.length,
                  cls: "bg-green-50 text-green-700 border-green-200",
                },
                {
                  label: "Rascunhos",
                  value: draftProperties.length,
                  cls: "bg-blue-50 text-blue-700 border-blue-200",
                },
                {
                  label: "Pausados",
                  value: pausedProperties.length,
                  cls: "bg-amber-50 text-amber-700 border-amber-200",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-lg border p-2 text-center ${item.cls}`}
                >
                  <p className="text-lg font-bold">
                    {item.value}
                  </p>
                  <p className="text-[10px] font-medium">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flag className="w-4 h-4 text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">
            Denúncias por estado
          </h2>
          <button
            onClick={() => navigate("/admin/reports")}
            className="ml-auto text-xs text-blue-600 hover:underline font-medium"
          >
            Ver todas
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Abertas",
              value: allReports.filter(
                (report) => report.status === "aberta",
              ).length,
              cls: "bg-red-50 border-red-200 text-red-700",
            },
            {
              label: "Em análise",
              value: allReports.filter(
                (report) => report.status === "em_analise",
              ).length,
              cls: "bg-amber-50 border-amber-200 text-amber-700",
            },
            {
              label: "Resolvidas",
              value: allReports.filter(
                (report) => report.status === "resolvida",
              ).length,
              cls: "bg-green-50 border-green-200 text-green-700",
            },
            {
              label: "Rejeitadas",
              value: allReports.filter(
                (report) => report.status === "rejeitada",
              ).length,
              cls: "bg-gray-50 border-gray-200 text-gray-600",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`border rounded-xl p-3 text-center ${item.cls}`}
            >
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs font-medium mt-0.5">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {criticalAlerts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Denúncias críticas em aberto
            </p>

            <div className="space-y-2">
              {criticalAlerts.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center gap-2 text-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <span className="text-gray-700 flex-1 truncate">
                    {report.reportedByStudentName} →{" "}
                    {report.landlordName}
                  </span>
                  <span className="text-gray-500 whitespace-nowrap">
                    {report.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Evolução da plataforma
            </h2>
          </div>

          <div className="space-y-3">
            {monthlyGrowth.map((month) => (
              <div key={month.month}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700 w-8">
                    {month.month}
                  </span>

                  <div className="flex items-center gap-4 text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {month.users}
                    </span>
                    <span className="flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      {month.properties}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {month.applications}
                    </span>
                  </div>
                </div>

                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    style={{
                      width: `${(month.users / maxUsers) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Utilizadores
            </span>
            <span className="flex items-center gap-1">
              <Home className="w-3 h-3" />
              Alojamentos
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Candidaturas
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Ações recentes
            </h2>
            <button
              onClick={() => navigate("/admin/audit")}
              className="ml-auto text-xs text-blue-600 hover:underline font-medium"
            >
              Ver auditoria
            </button>
          </div>

          {recentAudit.length === 0 ? (
            <div className="py-6 text-center">
              <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Nenhuma ação registada
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAudit.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${auditActionColors[entry.action] || "bg-gray-100 text-gray-500"}`}
                  >
                    <FilePen className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800">
                      {auditActionLabels[entry.action] ||
                        "Ação registada"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {entry.entityName}
                    </p>

                    {entry.note && (
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        "{entry.note}"
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString(
                      "pt-PT",
                      {
                        day: "numeric",
                        month: "short",
                      },
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
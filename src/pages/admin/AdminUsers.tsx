import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  ShieldOff,
  Eye,
  Ban,
  CheckCircle,
  Flag,
  Clock,
  Phone,
  Calendar,
  X,
  Home,
  UserX,
  UserCheck,
  FilePen,
  AlertTriangle,
  BookOpen,
  Building2,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useProperties } from '../../context/PropertiesContext';
import { getAllReports } from '../../data/mockAdminReports';
import {
  getAllUserStates,
  setUserSuspended,
  liftUserSuspension,
  setUserBlockedFromPublishing,
  unblockUserPublishing,
  setVerificationRequired,
  clearVerificationRequirement,
  AdminUserState,
} from '../../data/mockAdminUsersState';
import { addAuditEntry } from '../../data/mockAdminAudit';

// ─── Static user data ─────────────────────────────────────────────────────────

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: 'student' | 'landlord' | 'admin';
  verified: boolean;
  joined: string; // ISO date
  city?: string;
  university?: string; // students only
}

const PLATFORM_USERS: PlatformUser[] = [
  // Students
  {
    id: '1',
    name: 'João Silva',
    email: 'estudante@uniroom.pt',
    phone: '+351 912 345 678',
    type: 'student',
    verified: true,
    joined: '2026-01-15',
    city: 'Lisboa',
    university: 'Universidade de Lisboa',
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana.costa@student.pt',
    type: 'student',
    verified: true,
    joined: '2026-02-01',
    city: 'Coimbra',
    university: 'Universidade de Coimbra',
  },
  {
    id: '5',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@student.pt',
    type: 'student',
    verified: false,
    joined: '2026-02-15',
    city: 'Porto',
    university: 'Universidade do Porto',
  },
  {
    id: 'student-4',
    name: 'Rita Alves',
    email: 'rita.alves@student.pt',
    type: 'student',
    verified: false,
    joined: '2026-05-20',
    city: 'Aveiro',
    university: 'Universidade de Aveiro',
  },
  {
    id: 'student-5',
    name: 'Sofia Martins',
    email: 'sofia.martins@student.pt',
    type: 'student',
    verified: false,
    joined: '2026-05-18',
    city: 'Viseu',
  },
  // Landlords
  {
    id: '2',
    name: 'Maria Santos',
    email: 'senhorio@uniroom.pt',
    phone: '+351 967 890 123',
    type: 'landlord',
    verified: true,
    joined: '2026-01-10',
    city: 'Porto',
  },
  {
    id: 'landlord-1',
    name: 'Carlos Ferreira',
    email: 'carlos.ferreira@landlord.pt',
    phone: '+351 915 678 901',
    type: 'landlord',
    verified: true,
    joined: '2026-03-12',
    city: 'Lisboa',
  },
  {
    id: 'landlord-2',
    name: 'Maria Oliveira',
    email: 'maria.oliveira@landlord.pt',
    phone: '+351 966 123 456',
    type: 'landlord',
    verified: true,
    joined: '2026-04-05',
    city: 'Porto',
  },
  {
    id: 'landlord-3',
    name: 'António Silva',
    email: 'antonio.silva@landlord.pt',
    type: 'landlord',
    verified: false,
    joined: '2026-05-20',
    city: 'Lisboa',
  },
  {
    id: 'landlord-4',
    name: 'Rui Pinto',
    email: 'rui.pinto@landlord.pt',
    phone: '+351 913 987 654',
    type: 'landlord',
    verified: true,
    joined: '2026-04-18',
    city: 'Braga',
  },
  // Admin
  {
    id: '3',
    name: 'Admin UniRoom',
    email: 'admin@uniroom.pt',
    type: 'admin',
    verified: true,
    joined: '2026-01-01',
    city: 'Lisboa',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ADMIN_NAME = 'Admin UniRoom';
const ADMIN_ID = '3';

type LandlordSubFilter = 'all' | 'suspended' | 'blocked' | 'verification';
type TypeFilter = 'all' | 'student' | 'landlord' | 'admin';

// ─── AdminUsers component ─────────────────────────────────────────────────────

export function AdminUsers() {
  const { properties } = useProperties();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [landlordSubFilter, setLandlordSubFilter] = useState<LandlordSubFilter>('all');
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, AdminUserState>>(() => {
    const all = getAllUserStates();
    return Object.fromEntries(all.map(s => [s.userId, s]));
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [showReasonFor, setShowReasonFor] = useState<{ userId: string; action: string } | null>(null);

  const allReports = useMemo(() => getAllReports(), []);

  function getUserState(userId: string): AdminUserState {
    return actionStates[userId] ?? {
      userId,
      suspended: false,
      blockedFromPublishing: false,
      verificationRequired: false,
      updatedAt: new Date().toISOString(),
    };
  }

  function refreshState(userId: string) {
    const all = getAllUserStates();
    const found = all.find(s => s.userId === userId);
    if (found) {
      setActionStates(prev => ({ ...prev, [userId]: found }));
    }
  }

  function getPropertyCount(userId: string): number {
    return properties.filter(p => p.landlordId === userId || p.userId === userId).length;
  }

  function getReportCount(userId: string): number {
    return allReports.filter(r => r.landlordId === userId).length;
  }

  // ─── Action handlers ──────────────────────────────────────────────────────

  function handleSuspend(user: PlatformUser, reason: string) {
    setActionLoading(user.id + ':suspend');
    setUserSuspended(user.id, true, reason || undefined);
    addAuditEntry({
      action: 'landlord_suspended',
      entityType: 'landlord',
      entityId: user.id,
      entityName: user.name,
      adminId: ADMIN_ID,
      adminName: ADMIN_NAME,
      note: reason || undefined,
    });
    refreshState(user.id);
    setActionLoading(null);
    setShowReasonFor(null);
    setReasonInput('');
  }

  function handleLiftSuspension(user: PlatformUser) {
    setActionLoading(user.id + ':lift_suspension');
    liftUserSuspension(user.id);
    addAuditEntry({
      action: 'landlord_suspension_lifted',
      entityType: 'landlord',
      entityId: user.id,
      entityName: user.name,
      adminId: ADMIN_ID,
      adminName: ADMIN_NAME,
    });
    refreshState(user.id);
    setActionLoading(null);
  }

  function handleBlock(user: PlatformUser, reason: string) {
    setActionLoading(user.id + ':block');
    setUserBlockedFromPublishing(user.id, true, reason || undefined);
    addAuditEntry({
      action: 'landlord_blocked',
      entityType: 'landlord',
      entityId: user.id,
      entityName: user.name,
      adminId: ADMIN_ID,
      adminName: ADMIN_NAME,
      note: reason || undefined,
    });
    refreshState(user.id);
    setActionLoading(null);
    setShowReasonFor(null);
    setReasonInput('');
  }

  function handleUnblock(user: PlatformUser) {
    setActionLoading(user.id + ':unblock');
    unblockUserPublishing(user.id);
    addAuditEntry({
      action: 'landlord_unblocked',
      entityType: 'landlord',
      entityId: user.id,
      entityName: user.name,
      adminId: ADMIN_ID,
      adminName: ADMIN_NAME,
    });
    refreshState(user.id);
    setActionLoading(null);
  }

  function handleRequireVerification(user: PlatformUser) {
    setActionLoading(user.id + ':verify');
    setVerificationRequired(user.id, true);
    addAuditEntry({
      action: 'verification_requested',
      entityType: 'landlord',
      entityId: user.id,
      entityName: user.name,
      adminId: ADMIN_ID,
      adminName: ADMIN_NAME,
    });
    refreshState(user.id);
    setActionLoading(null);
  }

  function handleClearVerification(user: PlatformUser) {
    setActionLoading(user.id + ':clear_verify');
    clearVerificationRequirement(user.id);
    addAuditEntry({
      action: 'verification_cleared',
      entityType: 'landlord',
      entityId: user.id,
      entityName: user.name,
      adminId: ADMIN_ID,
      adminName: ADMIN_NAME,
    });
    refreshState(user.id);
    setActionLoading(null);
  }

  // ─── Filtering ────────────────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    let list = PLATFORM_USERS;

    if (typeFilter !== 'all') {
      list = list.filter(u => u.type === typeFilter);
    }

    if (typeFilter === 'landlord' && landlordSubFilter !== 'all') {
      list = list.filter(u => {
        const s = getUserState(u.id);
        if (landlordSubFilter === 'suspended') return s.suspended;
        if (landlordSubFilter === 'blocked') return s.blockedFromPublishing;
        if (landlordSubFilter === 'verification') return s.verificationRequired;
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    return list;
  }, [typeFilter, landlordSubFilter, searchQuery, actionStates]);

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const landlords = PLATFORM_USERS.filter(u => u.type === 'landlord');
    const states = landlords.map(u => getUserState(u.id));
    return {
      total: PLATFORM_USERS.length,
      students: PLATFORM_USERS.filter(u => u.type === 'student').length,
      landlords: landlords.length,
      admins: PLATFORM_USERS.filter(u => u.type === 'admin').length,
      suspended: states.filter(s => s.suspended).length,
      blocked: states.filter(s => s.blockedFromPublishing).length,
      verificationRequired: states.filter(s => s.verificationRequired).length,
    };
  }, [actionStates]);

  // ─── Render helpers ───────────────────────────────────────────────────────

  function UserTypeIcon({ type }: { type: PlatformUser['type'] }) {
    if (type === 'student') return <BookOpen className="w-4 h-4 text-blue-500" />;
    if (type === 'landlord') return <Building2 className="w-4 h-4 text-green-600" />;
    return <ShieldCheck className="w-4 h-4 text-primary" />;
  }

  function UserTypeBadge({ type }: { type: PlatformUser['type'] }) {
    const labels = { student: 'Estudante', landlord: 'Senhorio', admin: 'Administrador' };
    const colors = {
      student: 'bg-blue-100 text-blue-700',
      landlord: 'bg-green-100 text-green-700',
      admin: 'bg-primary/10 text-primary',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors[type]}`}>
        {labels[type]}
      </span>
    );
  }

  function RestrictionBadges({ userId }: { userId: string }) {
    const s = getUserState(userId);
    return (
      <div className="flex flex-wrap gap-1">
        {s.suspended && (
          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded">
            Conta suspensa
          </span>
        )}
        {s.blockedFromPublishing && (
          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-semibold rounded">
            Bloqueado de publicar
          </span>
        )}
        {s.verificationRequired && (
          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded">
            Verificação obrigatória
          </span>
        )}
      </div>
    );
  }

  const filterTab = (key: TypeFilter, label: string, count: number) => (
    <button
      key={key}
      onClick={() => { setTypeFilter(key); setLandlordSubFilter('all'); }}
      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
        typeFilter === key
          ? 'bg-primary text-white shadow-md'
          : 'bg-card border border-border text-foreground hover:bg-muted'
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Utilizadores</h1>
        <p className="text-sm text-gray-500">Gestão de contas, restrições e verificações na plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'bg-blue-100 text-blue-600' },
          { label: 'Estudantes', value: stats.students, icon: BookOpen, color: 'bg-blue-100 text-blue-500' },
          { label: 'Senhorios', value: stats.landlords, icon: Building2, color: 'bg-green-100 text-green-600' },
          { label: 'Admins', value: stats.admins, icon: ShieldCheck, color: 'bg-primary/10 text-primary' },
          { label: 'Suspensos', value: stats.suspended, icon: Ban, color: 'bg-red-100 text-red-600' },
          { label: 'Bloqueados', value: stats.blocked, icon: ShieldOff, color: 'bg-orange-100 text-orange-600' },
          { label: 'Verificação req.', value: stats.verificationRequired, icon: AlertTriangle, color: 'bg-amber-100 text-amber-600' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 min-h-[92px]">
              <div className="flex items-center gap-3 h-full">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-gray-900 leading-none">{stat.value}</p>
                  <p className="text-sm text-gray-600 mt-1 leading-tight break-words">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome ou email..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterTab('all', 'Todos', PLATFORM_USERS.length)}
          {filterTab('student', 'Estudantes', stats.students)}
          {filterTab('landlord', 'Senhorios', stats.landlords)}
          {filterTab('admin', 'Admins', stats.admins)}
        </div>

        {/* Landlord sub-filters */}
        {typeFilter === 'landlord' && (
          <div className="flex gap-2 flex-wrap">
            {([
              ['all', 'Todos os senhorios'],
              ['suspended', `Suspensos (${stats.suspended})`],
              ['blocked', `Bloqueados (${stats.blocked})`],
              ['verification', `Verificação obrigatória (${stats.verificationRequired})`],
            ] as [LandlordSubFilter, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setLandlordSubFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  landlordSubFilter === key
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-muted border-border text-muted-foreground hover:border-foreground/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* User list */}
      {filteredUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700">Nenhum utilizador encontrado</p>
          <p className="text-sm text-gray-500 mt-1">Altera os filtros para ver mais resultados.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map(user => {
            const state = getUserState(user.id);
            const propCount = user.type === 'landlord' ? getPropertyCount(user.id) : null;
            const reportCount = user.type === 'landlord' ? getReportCount(user.id) : null;
            const isLandlord = user.type === 'landlord';
            const hasRestriction = state.suspended || state.blockedFromPublishing || state.verificationRequired;

            return (
              <Card
                key={user.id}
                className={`p-4 transition-colors ${hasRestriction ? 'border-l-4 border-l-red-400' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                    user.type === 'student' ? 'bg-blue-500' :
                    user.type === 'landlord' ? 'bg-green-600' : 'bg-primary'
                  }`}>
                    {user.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-sm text-foreground">{user.name}</span>
                      <UserTypeBadge type={user.type} />
                      {user.verified && (
                        <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                          <ShieldCheck className="w-3 h-3" /> Verificado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}</p>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      {user.city && <span>{user.city}</span>}
                      {user.university && <span>{user.university}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Desde {formatDate(user.joined)}
                      </span>
                      {propCount !== null && (
                        <span className="flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          {propCount} alojamento{propCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {reportCount !== null && reportCount > 0 && (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <Flag className="w-3 h-3" />
                          {reportCount} denúncia{reportCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {isLandlord && hasRestriction && (
                      <div className="mt-2">
                        <RestrictionBadges userId={user.id} />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Landlord action row */}
                {isLandlord && (
                  <div className="mt-3 pt-3 border-t border-border">
                    {/* Reason input if needed */}
                    {showReasonFor?.userId === user.id && (
                      <div className="mb-2 flex gap-2">
                        <input
                          autoFocus
                          value={reasonInput}
                          onChange={e => setReasonInput(e.target.value)}
                          placeholder={
                            showReasonFor.action === 'suspend'
                              ? 'Motivo de suspensão (opcional)...'
                              : 'Motivo de bloqueio (opcional)...'
                          }
                          className="flex-1 px-3 py-1.5 border border-border rounded-lg text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              if (showReasonFor.action === 'suspend') handleSuspend(user, reasonInput);
                              else handleBlock(user, reasonInput);
                            }
                            if (e.key === 'Escape') { setShowReasonFor(null); setReasonInput(''); }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (showReasonFor.action === 'suspend') handleSuspend(user, reasonInput);
                            else handleBlock(user, reasonInput);
                          }}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => { setShowReasonFor(null); setReasonInput(''); }}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {/* Suspension */}
                      {!state.suspended ? (
                        <ActionButton
                          icon={<UserX className="w-3.5 h-3.5" />}
                          label="Suspender conta"
                          color="red"
                          loading={actionLoading === user.id + ':suspend'}
                          onClick={() => { setShowReasonFor({ userId: user.id, action: 'suspend' }); setReasonInput(''); }}
                        />
                      ) : (
                        <ActionButton
                          icon={<UserCheck className="w-3.5 h-3.5" />}
                          label="Levantar suspensão"
                          color="green"
                          loading={actionLoading === user.id + ':lift_suspension'}
                          onClick={() => handleLiftSuspension(user)}
                        />
                      )}

                      {/* Blocking */}
                      {!state.blockedFromPublishing ? (
                        <ActionButton
                          icon={<Ban className="w-3.5 h-3.5" />}
                          label="Bloquear publicação"
                          color="orange"
                          loading={actionLoading === user.id + ':block'}
                          onClick={() => { setShowReasonFor({ userId: user.id, action: 'block' }); setReasonInput(''); }}
                        />
                      ) : (
                        <ActionButton
                          icon={<CheckCircle className="w-3.5 h-3.5" />}
                          label="Permitir publicação"
                          color="green"
                          loading={actionLoading === user.id + ':unblock'}
                          onClick={() => handleUnblock(user)}
                        />
                      )}

                      {/* Verification */}
                      {!state.verificationRequired ? (
                        <ActionButton
                          icon={<FilePen className="w-3.5 h-3.5" />}
                          label="Pedir verificação"
                          color="amber"
                          loading={actionLoading === user.id + ':verify'}
                          onClick={() => handleRequireVerification(user)}
                        />
                      ) : (
                        <ActionButton
                          icon={<ShieldCheck className="w-3.5 h-3.5" />}
                          label="Remover pedido"
                          color="gray"
                          loading={actionLoading === user.id + ':clear_verify'}
                          onClick={() => handleClearVerification(user)}
                        />
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          state={getUserState(selectedUser.id)}
          propertyCount={selectedUser.type === 'landlord' ? getPropertyCount(selectedUser.id) : null}
          reportCount={selectedUser.type === 'landlord' ? getReportCount(selectedUser.id) : null}
          onClose={() => setSelectedUser(null)}
          onSuspend={reason => handleSuspend(selectedUser, reason)}
          onLiftSuspension={() => handleLiftSuspension(selectedUser)}
          onBlock={reason => handleBlock(selectedUser, reason)}
          onUnblock={() => handleUnblock(selectedUser)}
          onRequireVerification={() => handleRequireVerification(selectedUser)}
          onClearVerification={() => handleClearVerification(selectedUser)}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  color,
  loading,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'red' | 'orange' | 'green' | 'amber' | 'gray';
  loading?: boolean;
  onClick: () => void;
}) {
  const colorMap = {
    red: 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100',
    orange: 'border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100',
    green: 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100',
    amber: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100',
    gray: 'border-border text-muted-foreground bg-muted hover:bg-muted/80',
  };

  return (
    <button
      disabled={loading}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${colorMap[color]} disabled:opacity-50`}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {label}
    </button>
  );
}

function UserDetailModal({
  user,
  state,
  propertyCount,
  reportCount,
  onClose,
  onSuspend,
  onLiftSuspension,
  onBlock,
  onUnblock,
  onRequireVerification,
  onClearVerification,
  actionLoading,
}: {
  user: PlatformUser;
  state: AdminUserState;
  propertyCount: number | null;
  reportCount: number | null;
  onClose: () => void;
  onSuspend: (reason: string) => void;
  onLiftSuspension: () => void;
  onBlock: (reason: string) => void;
  onUnblock: () => void;
  onRequireVerification: () => void;
  onClearVerification: () => void;
  actionLoading: string | null;
}) {
  const [localReason, setLocalReason] = useState('');
  const isLandlord = user.type === 'landlord';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ${
                user.type === 'student' ? 'bg-blue-500' :
                user.type === 'landlord' ? 'bg-green-600' : 'bg-primary'
              }`}>
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    user.type === 'student' ? 'bg-blue-100 text-blue-700' :
                    user.type === 'landlord' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                  }`}>
                    {user.type === 'student' ? 'Estudante' : user.type === 'landlord' ? 'Senhorio' : 'Administrador'}
                  </span>
                  {user.verified && (
                    <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Verificado
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {user.phone && (
              <div className="col-span-2 flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Telefone</p>
                  <p className="text-sm font-medium text-foreground">{user.phone}</p>
                </div>
              </div>
            )}
            {user.city && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Cidade</p>
                  <p className="text-sm font-medium text-foreground">{user.city}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Registo</p>
                <p className="text-sm font-medium text-foreground">{formatDate(user.joined)}</p>
              </div>
            </div>
            {user.university && (
              <div className="col-span-2 flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Universidade</p>
                  <p className="text-sm font-medium text-foreground">{user.university}</p>
                </div>
              </div>
            )}
            {propertyCount !== null && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Home className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Alojamentos</p>
                  <p className="text-sm font-medium text-foreground">{propertyCount}</p>
                </div>
              </div>
            )}
            {reportCount !== null && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Flag className={`w-4 h-4 flex-shrink-0 ${reportCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-[10px] text-muted-foreground">Denúncias</p>
                  <p className={`text-sm font-medium ${reportCount > 0 ? 'text-red-600' : 'text-foreground'}`}>{reportCount}</p>
                </div>
              </div>
            )}
          </div>

          {/* Current restrictions */}
          {isLandlord && (state.suspended || state.blockedFromPublishing || state.verificationRequired) && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
              <p className="text-xs font-semibold text-red-800 mb-2">Restrições ativas</p>
              {state.suspended && (
                <div className="flex items-center gap-2 text-xs text-red-700">
                  <Ban className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Conta suspensa{state.reason ? ` — ${state.reason}` : ''}</span>
                </div>
              )}
              {state.blockedFromPublishing && (
                <div className="flex items-center gap-2 text-xs text-orange-700">
                  <ShieldOff className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Bloqueado de publicar</span>
                </div>
              )}
              {state.verificationRequired && (
                <div className="flex items-center gap-2 text-xs text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Verificação obrigatória pendente</span>
                </div>
              )}
            </div>
          )}

          {/* Landlord actions */}
          {isLandlord && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações administrativas</p>

              {/* Reason input */}
              <div>
                <input
                  value={localReason}
                  onChange={e => setLocalReason(e.target.value)}
                  placeholder="Motivo (opcional) — usado nas ações abaixo..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Suspension */}
                {!state.suspended ? (
                  <button
                    onClick={() => { onSuspend(localReason); }}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                    Suspender conta
                  </button>
                ) : (
                  <button
                    onClick={onLiftSuspension}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    Levantar suspensão
                  </button>
                )}

                {/* Block publishing */}
                {!state.blockedFromPublishing ? (
                  <button
                    onClick={() => onBlock(localReason)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 text-xs font-medium hover:bg-orange-100 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Bloquear publicação
                  </button>
                ) : (
                  <button
                    onClick={onUnblock}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Permitir publicação
                  </button>
                )}

                {/* Verification */}
                {!state.verificationRequired ? (
                  <button
                    onClick={onRequireVerification}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
                  >
                    <FilePen className="w-4 h-4" />
                    Pedir verificação
                  </button>
                ) : (
                  <button
                    onClick={onClearVerification}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Remover pedido
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

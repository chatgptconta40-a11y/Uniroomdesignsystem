import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  ShieldOff,
  CheckCircle,
  XCircle,
  Clock,
  GraduationCap,
  Building2,
  User,
  FileText,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import {
  useAllVerificationStatuses,
  adminApproveDocument,
  adminRejectDocument,
  adminUpsertVerification,
} from '../../hooks/useTrust';
import { useAdminUsers, type AdminUserRow } from '../../hooks/useDb';
import { useAdminAuditLogs } from '../../hooks/useAdminAuditLogs';
import { supabase } from '../../lib/supabase';

function formatDate(value?: string | Date) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getTypeLabel(type: string) {
  if (type === 'student') return 'Estudante';
  if (type === 'landlord') return 'Senhorio';
  return 'Admin';
}

function getVerificationLabel(level: string, pending: boolean) {
  if (pending) return 'Documento em análise';
  if (level === 'gold') return 'Ouro';
  if (level === 'silver') return 'Prata';
  if (level === 'bronze') return 'Bronze';
  return 'Não verificado';
}

function getVerificationClass(level: string, pending: boolean) {
  if (pending) return 'bg-blue-100 text-blue-700';
  if (level === 'gold') return 'bg-yellow-100 text-yellow-800';
  if (level === 'silver') return 'bg-slate-100 text-slate-700';
  if (level === 'bronze') return 'bg-amber-100 text-amber-800';
  return 'bg-red-50 text-red-700';
}

export function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'student' | 'landlord' | 'admin'>('all');
  const [docFilter, setDocFilter] = useState<'all' | 'pending_docs'>('all');
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [missingPendingUsers, setMissingPendingUsers] = useState<AdminUserRow[]>([]);

  const { users, loading: usersLoading, refresh: refreshUsers } = useAdminUsers();
  const { statuses: verifications, statusMap, refresh: refreshVerifications } = useAllVerificationStatuses();
  const { createLog } = useAdminAuditLogs({ limit: 1 });

  useEffect(() => {
    if (usersLoading) return;
    const pendingIds = verifications
      .filter(v => v.documentReviewStatus === 'pending')
      .map(v => v.userId);
    const missingIds = pendingIds.filter(id => !users.some(u => u.id === id));
    if (missingIds.length === 0) { setMissingPendingUsers([]); return; }
    supabase
      .from('profiles')
      .select('*')
      .in('id', missingIds)
      .then(({ data, error }) => {
        if (error) { console.error('[AdminUsers] fetch missing pending users:', error); return; }
        setMissingPendingUsers((data ?? []).map(r => ({
          id: r.id, email: r.email, fullName: r.full_name ?? '',
          type: r.type, status: r.status, verified: !!r.verified,
          onboardingCompleted: !!r.onboarding_completed,
          createdAt: new Date(r.created_at),
          lastActive: r.last_active ? new Date(r.last_active) : undefined,
        })));
      });
  }, [verifications, users, usersLoading]);

  const allUsers = [
    ...users,
    ...missingPendingUsers.filter(m => !users.some(u => u.id === m.id)),
  ];

  const entityLabelFor = (userId: string): string => {
    const u = allUsers.find(x => x.id === userId);
    return u?.fullName || u?.email || userId;
  };

  const documentInfoFor = (userId: string) => {
    const v = statusMap[userId];
    return v
      ? { documentFileName: v.documentFileName, documentReviewStatus: v.documentReviewStatus }
      : {};
  };

  const pendingDocuments = verifications.filter(item => item.documentReviewStatus === 'pending').length;
  const verifiedUsers = allUsers.filter(user => {
    const vs = statusMap[user.id];
    return vs?.level === 'gold' || vs?.level === 'silver';
  }).length;

  const filteredUsers = allUsers.filter(user => {
    const matchesType = typeFilter === 'all' || user.type === typeFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      user.fullName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q);
    const matchesPendingDoc =
      docFilter === 'all' || statusMap[user.id]?.documentReviewStatus === 'pending';
    return matchesType && matchesSearch && matchesPendingDoc;
  });

  const handleApprove = (userId: string) => {
    const label = entityLabelFor(userId);
    const docInfo = documentInfoFor(userId);
    void adminApproveDocument(userId).then(ok => {
      if (!ok) return;
      void refreshVerifications();
      void createLog({
        action: 'verification_approved',
        entityType: 'user',
        entityId: userId,
        entityLabel: label,
        note: 'Verificação aprovada pelo administrador',
        metadata: docInfo,
      }).catch(err => console.error('[AdminUsers] audit approve:', err));
    });
  };

  const handleReject = (userId: string) => {
    const reason = rejectReason || 'Documento rejeitado pelo administrador.';
    const label = entityLabelFor(userId);
    const docInfo = documentInfoFor(userId);
    void adminRejectDocument(userId, reason).then(ok => {
      if (!ok) return;
      void refreshVerifications();
      void createLog({
        action: 'verification_rejected',
        entityType: 'user',
        entityId: userId,
        entityLabel: label,
        note: reason,
        metadata: docInfo,
      }).catch(err => console.error('[AdminUsers] audit reject:', err));
    });
    setRejectingUserId(null);
    setRejectReason('');
  };

  const handleForceSilver = (userId: string) => {
    const label = entityLabelFor(userId);
    void adminUpsertVerification(userId, {
      emailVerified: true,
      universityEmailVerified: true,
      documentVerified: false,
    }).then(ok => {
      if (!ok) return;
      void refreshVerifications();
      void createLog({
        action: 'verification_approved',
        entityType: 'user',
        entityId: userId,
        entityLabel: label,
        note: 'Verificação manual atribuída como Silver',
        metadata: { level: 'silver', manual: true },
      }).catch(err => console.error('[AdminUsers] audit force-silver:', err));
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Utilizadores</h1>
              <p className="text-muted-foreground">
                Gestão de utilizadores e verificação de identidade.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Total</p>
            <p className="text-3xl font-bold text-foreground">{usersLoading ? '—' : allUsers.length}</p>
          </Card>

          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Verificados</p>
            <p className="text-3xl font-bold text-green-700">{verifiedUsers}</p>
          </Card>

          <button
            type="button"
            onClick={() => setDocFilter(f => f === 'pending_docs' ? 'all' : 'pending_docs')}
            className={`text-left rounded-2xl transition-all ${docFilter === 'pending_docs' ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'}`}
          >
            <Card className="p-5 h-full">
              <p className="text-sm text-muted-foreground mb-2">Documentos pendentes</p>
              <p className="text-3xl font-bold text-blue-700">{pendingDocuments}</p>
              {pendingDocuments > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {docFilter === 'pending_docs' ? '▲ A filtrar' : 'Clica para filtrar'}
                </p>
              )}
            </Card>
          </button>

          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Estudantes</p>
            <p className="text-3xl font-bold text-primary">
              {allUsers.filter(user => user.type === 'student').length}
            </p>
          </Card>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Pesquisar por nome ou email..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-input-background outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['all', 'student', 'landlord', 'admin'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    typeFilter === type
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-primary'
                  }`}
                >
                  {type === 'all' ? 'Todos' : getTypeLabel(type)}
                </button>
              ))}
              <button
                onClick={() => setDocFilter(f => f === 'pending_docs' ? 'all' : 'pending_docs')}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 ${
                  docFilter === 'pending_docs'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-card text-muted-foreground border-border hover:border-blue-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Docs pendentes
                {pendingDocuments > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    docFilter === 'pending_docs' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {pendingDocuments}
                  </span>
                )}
              </button>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {usersLoading && (
            <Card className="p-10 text-center">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 animate-spin" />
              <p className="text-sm text-muted-foreground">A carregar utilizadores…</p>
            </Card>
          )}

          {!usersLoading && filteredUsers.map(user => {
            const verification = statusMap[user.id] ?? null;
            const level = verification?.level || 'none';
            const pending = verification?.documentReviewStatus === 'pending';
            const rejected = verification?.documentReviewStatus === 'rejected';

            return (
              <Card key={user.id} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      {user.type === 'student' ? (
                        <GraduationCap className="w-5 h-5" />
                      ) : user.type === 'landlord' ? (
                        <Building2 className="w-5 h-5" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="font-bold text-foreground">{user.fullName || user.email}</h2>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          {getTypeLabel(user.type)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getVerificationClass(level, pending)}`}>
                          {getVerificationLabel(level, pending)}
                        </span>
                        {user.status !== 'active' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 font-semibold">
                            {user.status === 'suspended' ? 'Suspenso' : 'Bloqueado'}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Entrou em {formatDate(user.createdAt)}
                      </p>

                      {verification?.documentFileName && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {verification.documentFileName}
                        </p>
                      )}

                      {rejected && verification?.documentRejectionReason && (
                        <p className="text-xs text-red-600 mt-1">
                          Motivo: {verification.documentRejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {pending && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleApprove(user.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar documento
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => setRejectingUserId(user.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}

                    {!pending && level !== 'gold' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleForceSilver(user.id)}
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        Confirmar email institucional
                      </Button>
                    )}

                    {level === 'none' && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                        <ShieldOff className="w-3.5 h-3.5" />
                        Sem verificação
                      </span>
                    )}
                  </div>
                </div>

                {rejectingUserId === user.id && (
                  <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50">
                    <label className="block text-sm font-semibold text-red-900 mb-2">
                      Motivo da rejeição
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={event => setRejectReason(event.target.value)}
                      placeholder="Ex.: Documento ilegível ou não corresponde ao utilizador."
                      className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300 resize-none"
                      rows={3}
                    />

                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectingUserId(null);
                          setRejectReason('');
                        }}
                      >
                        Cancelar
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleReject(user.id)}
                      >
                        Confirmar rejeição
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {!usersLoading && filteredUsers.length === 0 && (
            <Card className="p-10 text-center">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h2 className="font-bold text-foreground mb-1">Sem utilizadores encontrados</h2>
              <p className="text-sm text-muted-foreground">Tenta ajustar a pesquisa ou filtros.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

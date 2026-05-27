import { useMemo, useState } from 'react';
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
  approveVerificationDocument,
  getAllVerificationStatuses,
  getVerificationStatus,
  rejectVerificationDocument,
  updateVerificationStatus,
} from '../../data/mockTrust';

const USERS_STORAGE_KEY = 'uniroom_all_users';

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  type: 'student' | 'landlord' | 'admin';
  joined?: string;
  city?: string;
  university?: string;
}

const FALLBACK_USERS: PlatformUser[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'estudante@uniroom.pt',
    type: 'student',
    joined: '2026-01-15',
    city: 'Lisboa',
    university: 'Universidade de Lisboa',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'senhorio@uniroom.pt',
    type: 'landlord',
    joined: '2026-01-10',
    city: 'Porto',
  },
  {
    id: '3',
    name: 'Admin UniRoom',
    email: 'admin@uniroom.pt',
    type: 'admin',
    joined: '2026-01-01',
    city: 'Lisboa',
  },
];

function readUsers(): PlatformUser[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];

    if (Array.isArray(parsed) && parsed.length > 0) {
      const mapped = parsed
        .filter(user => user?.id && user?.email)
        .map(user => ({
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          type: user.type || 'student',
          joined: user.createdAt || user.joined || new Date().toISOString(),
          city: user.city,
          university: user.university,
        }));

      const byId = new Map<string, PlatformUser>();
      [...FALLBACK_USERS, ...mapped].forEach(user => byId.set(user.id, user));
      return Array.from(byId.values());
    }
  } catch {
    // fallback
  }

  return FALLBACK_USERS;
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getTypeLabel(type: PlatformUser['type']) {
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
  const [typeFilter, setTypeFilter] = useState<'all' | PlatformUser['type']>('all');
  const [version, setVersion] = useState(0);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const users = useMemo(() => readUsers(), [version]);
  const verifications = useMemo(() => getAllVerificationStatuses(), [version]);

  const pendingDocuments = verifications.filter(item => item.documentReviewStatus === 'pending').length;
  const verifiedUsers = users.filter(user => {
    const verification = getVerificationStatus(user.id);
    return verification?.level === 'gold' || verification?.level === 'silver';
  }).length;

  const filteredUsers = users.filter(user => {
    const matchesType = typeFilter === 'all' || user.type === typeFilter;
    const q = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !q ||
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q);

    return matchesType && matchesSearch;
  });

  const refresh = () => setVersion(value => value + 1);

  const handleApprove = (userId: string) => {
    approveVerificationDocument(userId);
    refresh();
  };

  const handleReject = (userId: string) => {
    rejectVerificationDocument(userId, rejectReason || 'Documento rejeitado pelo administrador.');
    setRejectingUserId(null);
    setRejectReason('');
    refresh();
  };

  const handleForceSilver = (userId: string) => {
    updateVerificationStatus(userId, {
      emailVerified: true,
      universityEmailVerified: true,
      documentVerified: false,
    });
    refresh();
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
            <p className="text-3xl font-bold text-foreground">{users.length}</p>
          </Card>

          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Verificados</p>
            <p className="text-3xl font-bold text-green-700">{verifiedUsers}</p>
          </Card>

          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Documentos pendentes</p>
            <p className="text-3xl font-bold text-blue-700">{pendingDocuments}</p>
          </Card>

          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Estudantes</p>
            <p className="text-3xl font-bold text-primary">
              {users.filter(user => user.type === 'student').length}
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

            <div className="flex gap-2">
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
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {filteredUsers.map(user => {
            const verification = getVerificationStatus(user.id);
            const level = verification?.level || 'none';
            const pending = verification?.documentReviewStatus === 'pending';

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
                        <h2 className="font-bold text-foreground">{user.name}</h2>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          {getTypeLabel(user.type)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getVerificationClass(level, pending)}`}>
                          {getVerificationLabel(level, pending)}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Entrou em {formatDate(user.joined)}
                        {user.university ? ` · ${user.university}` : ''}
                      </p>

                      {verification?.documentFileName && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {verification.documentFileName}
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

          {filteredUsers.length === 0 && (
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

import { useState } from 'react';
import { Search, Filter, ChevronDown, Shield, AlertTriangle, X, Ban, CheckCircle, User } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { getAdminUsers } from '../data/mockAdmin';
import { AdminUser } from '../types/admin';
import { toast } from 'sonner';

export function AdminUsers() {
  const [users, setUsers] = useState(getAdminUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'student' | 'landlord' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'blocked'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'trustScore' | 'lastActive'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || user.type === filterType;
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'createdAt') {
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
      } else if (sortBy === 'trustScore') {
        comparison = a.trustScore - b.trustScore;
      } else if (sortBy === 'lastActive') {
        comparison = a.lastActive.getTime() - b.lastActive.getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspenso</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800">Bloqueado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'gold':
        return <Badge className="bg-amber-100 text-amber-800">Ouro</Badge>;
      case 'silver':
        return <Badge className="bg-slate-200 text-foreground">Prata</Badge>;
      case 'bronze':
        return <Badge className="bg-orange-100 text-orange-800">Bronze</Badge>;
      default:
        return <span className="text-sm text-muted-foreground">—</span>;
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 font-bold';
    if (score >= 50) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  };

  const handleSuspendUser = (userId: string) => {
    setUsers(prev => prev.map(user => user.id === userId ? { ...user, status: 'suspended' } : user));
    setSelectedUser(prev => prev?.id === userId ? { ...prev, status: 'suspended' } : prev);
    toast.success('Utilizador suspenso');
  };

  const handleBlockUser = (userId: string) => {
    setUsers(prev => prev.map(user => user.id === userId ? { ...user, status: 'blocked' } : user));
    setSelectedUser(prev => prev?.id === userId ? { ...prev, status: 'blocked' } : prev);
    toast.success('Utilizador bloqueado');
  };

  const handleActivateUser = (userId: string) => {
    setUsers(prev => prev.map(user => user.id === userId ? { ...user, status: 'active' } : user));
    setSelectedUser(prev => prev?.id === userId ? { ...prev, status: 'active' } : prev);
    toast.success('Utilizador reativado');
  };

  const getTypeLabel = (type: AdminUser['type']) => {
    if (type === 'student') return 'Estudante';
    if (type === 'landlord') return 'Senhorio';
    return 'Admin';
  };

  return (
    <AdminLayout>
      <Card className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="pl-10 pr-8 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-input-background"
            >
              <option value="all">Todos os tipos</option>
              <option value="student">Estudantes</option>
              <option value="landlord">Senhorios</option>
              <option value="admin">Admins</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-input-background pr-8"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="suspended">Suspensos</option>
              <option value="blocked">Bloqueados</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-input-background pr-8"
            >
              <option value="createdAt">Data de registo</option>
              <option value="name">Nome</option>
              <option value="trustScore">Trust Score</option>
              <option value="lastActive">Última atividade</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          {filteredUsers.length} utilizadores encontrados
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Utilizador
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Trust Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Verificação
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Denúncias
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Última Atividade
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="capitalize">{getTypeLabel(user.type)}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getTrustScoreColor(user.trustScore)}>
                      {user.trustScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {getVerificationBadge(user.verificationLevel)}
                      <span className="text-xs text-muted-foreground capitalize">{user.verificationLevel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.reportsReceived > 0 ? (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-semibold">{user.reportsReceived}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {user.lastActive.toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedUser(user)}
                    >
                      Ver Detalhes
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedUser && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setSelectedUser(null)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-card shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Detalhes do Utilizador</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <Card className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground">{selectedUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(selectedUser.status)}
                      <Badge variant="outline" className="capitalize">
                        {getTypeLabel(selectedUser.type)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Trust Score</p>
                    <p className={`text-2xl ${getTrustScoreColor(selectedUser.trustScore)}`}>
                      {selectedUser.trustScore}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Verificação</p>
                    <div className="flex items-center gap-2">
                      {getVerificationBadge(selectedUser.verificationLevel)}
                      <span className="text-sm font-medium capitalize">{selectedUser.verificationLevel}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Membro desde</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedUser.createdAt.toLocaleDateString('pt-PT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Última atividade</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedUser.lastActive.toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-bold text-foreground mb-4">Estatísticas</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedUser.type === 'student' && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total de Candidaturas</p>
                      <p className="text-2xl font-bold text-foreground">{selectedUser.totalApplications}</p>
                    </div>
                  )}
                  {selectedUser.type === 'landlord' && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total de Alojamentos</p>
                      <p className="text-2xl font-bold text-foreground">{selectedUser.totalListings}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Denúncias Recebidas</p>
                    <p className="text-2xl font-bold text-red-600">{selectedUser.reportsReceived}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Denúncias Submetidas</p>
                    <p className="text-2xl font-bold text-foreground">{selectedUser.reportsSubmitted}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-bold text-foreground mb-4">Ações Administrativas</h4>
                <div className="space-y-3">
                  {selectedUser.status === 'active' && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                        onClick={() => handleSuspendUser(selectedUser.id)}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Suspender Utilizador
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-700 border-red-300 hover:bg-red-50"
                        onClick={() => handleBlockUser(selectedUser.id)}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Bloquear Utilizador
                      </Button>
                    </>
                  )}

                  {selectedUser.status === 'suspended' && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-green-700 border-green-300 hover:bg-green-50"
                        onClick={() => handleActivateUser(selectedUser.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Reativar Utilizador
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-700 border-red-300 hover:bg-red-50"
                        onClick={() => handleBlockUser(selectedUser.id)}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Bloquear Utilizador
                      </Button>
                    </>
                  )}

                  {selectedUser.status === 'blocked' && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-green-700 border-green-300 hover:bg-green-50"
                      onClick={() => handleActivateUser(selectedUser.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Desbloquear Utilizador
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Ver Perfil Completo
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Ver Histórico de Atividade
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
import { useState } from 'react';
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
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  TrendingUp,
  X
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: 'student' | 'landlord' | 'admin';
  status: 'active' | 'suspended';
  verified: boolean;
  trustScore: number;
  reportsCount: number;
  lastActivity: string;
  joined: string;
  city?: string;
}

export function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'student' | 'landlord' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'João Silva',
      email: 'estudante@uniroom.pt',
      phone: '+351 912 345 678',
      type: 'student',
      status: 'active',
      verified: true,
      trustScore: 85,
      reportsCount: 0,
      lastActivity: 'Há 5 minutos',
      joined: '2026-01-15',
      city: 'Lisboa'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'senhorio@uniroom.pt',
      phone: '+351 967 890 123',
      type: 'landlord',
      status: 'active',
      verified: true,
      trustScore: 92,
      reportsCount: 0,
      lastActivity: 'Há 12 minutos',
      joined: '2026-01-10',
      city: 'Porto'
    },
    {
      id: '3',
      name: 'Ana Costa',
      email: 'ana@example.com',
      phone: '+351 934 567 890',
      type: 'student',
      status: 'active',
      verified: true,
      trustScore: 78,
      reportsCount: 1,
      lastActivity: 'Há 2 horas',
      joined: '2026-05-22',
      city: 'Coimbra'
    },
    {
      id: '4',
      name: 'Pedro Santos',
      email: 'pedro@example.com',
      type: 'landlord',
      status: 'active',
      verified: false,
      trustScore: 65,
      reportsCount: 2,
      lastActivity: 'Há 1 dia',
      joined: '2026-05-21',
      city: 'Braga'
    },
    {
      id: '5',
      name: 'Rita Alves',
      email: 'rita@example.com',
      type: 'student',
      status: 'suspended',
      verified: false,
      trustScore: 45,
      reportsCount: 5,
      lastActivity: 'Há 3 dias',
      joined: '2026-05-20',
      city: 'Aveiro'
    },
    {
      id: '6',
      name: 'Carlos Mendes',
      email: 'carlos@example.com',
      phone: '+351 915 678 901',
      type: 'landlord',
      status: 'active',
      verified: true,
      trustScore: 88,
      reportsCount: 0,
      lastActivity: 'Há 30 minutos',
      joined: '2026-03-12',
      city: 'Faro'
    },
    {
      id: '7',
      name: 'Sofia Martins',
      email: 'sofia@example.com',
      type: 'student',
      status: 'active',
      verified: false,
      trustScore: 72,
      reportsCount: 0,
      lastActivity: 'Há 4 horas',
      joined: '2026-05-18',
      city: 'Viseu'
    },
    {
      id: '8',
      name: 'Admin UniRoom',
      email: 'admin@uniroom.pt',
      type: 'admin',
      status: 'active',
      verified: true,
      trustScore: 100,
      reportsCount: 0,
      lastActivity: 'Há 1 minuto',
      joined: '2025-12-01',
      city: 'Lisboa'
    },
  ]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || user.type === filterType;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: users.length,
    students: users.filter(u => u.type === 'student').length,
    landlords: users.filter(u => u.type === 'landlord').length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    verified: users.filter(u => u.verified).length,
  };

  const handleSuspendUser = (userId: string) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, status: 'suspended' as const } : u
    ));
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, status: 'suspended' as const } : null);
    }
  };

  const handleActivateUser = (userId: string) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, status: 'active' as const } : u
    ));
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, status: 'active' as const } : null);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="success">
        <CheckCircle className="w-3 h-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-300">
        <Ban className="w-3 h-3 mr-1" />
        Suspenso
      </Badge>
    );
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'student': return 'Estudante';
      case 'landlord': return 'Senhorio';
      case 'admin': return 'Administrador';
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Utilizadores</h1>
        <p className="text-gray-600">Gerir todos os utilizadores da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Estudantes</p>
              <p className="text-xl font-bold text-gray-900">{stats.students}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Senhorios</p>
              <p className="text-xl font-bold text-gray-900">{stats.landlords}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Ativos</p>
              <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Ban className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Suspensos</p>
              <p className="text-xl font-bold text-gray-900">{stats.suspended}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Verificados</p>
              <p className="text-xl font-bold text-gray-900">{stats.verified}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Procurar por nome ou email..."
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('student')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'student'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Estudantes
              </button>
              <button
                onClick={() => setFilterType('landlord')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'landlord'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Senhorios
              </button>
              <button
                onClick={() => setFilterType('admin')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'admin'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Admins
              </button>
            </div>

            <div className="w-px bg-gray-300"></div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos estados
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'active'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setFilterStatus('suspended')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'suspended'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Suspensos
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Utilizador</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Verificação</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Trust Score</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Denúncias</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Última Atividade</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={user.type === 'admin' ? 'default' : 'outline'}>
                      {getTypeName(user.type)}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="py-4 px-4">
                    {user.verified ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-sm font-medium">Verificado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <ShieldOff className="w-4 h-4" />
                        <span className="text-sm">Não verificado</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                        <div
                          className={`h-full ${
                            user.trustScore >= 80
                              ? 'bg-green-500'
                              : user.trustScore >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${user.trustScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{user.trustScore}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {user.reportsCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Flag className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">{user.reportsCount}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">0</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-sm">{user.lastActivity}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {user.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuspendUser(user.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActivateUser(user.id)}
                          className="text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhum utilizador encontrado</p>
          </div>
        )}
      </Card>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                    <p className="text-gray-600">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Tipo de Conta</span>
                  </div>
                  <Badge variant={selectedUser.type === 'admin' ? 'default' : 'outline'}>
                    {getTypeName(selectedUser.type)}
                  </Badge>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Estado</span>
                  </div>
                  {getStatusBadge(selectedUser.status)}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Verificação</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {selectedUser.verified ? 'Verificado' : 'Não verificado'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Trust Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          selectedUser.trustScore >= 80
                            ? 'bg-green-500'
                            : selectedUser.trustScore >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedUser.trustScore}%` }}
                      />
                    </div>
                    <span className="font-bold text-gray-900">{selectedUser.trustScore}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Flag className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Denúncias</span>
                  </div>
                  <p className={`font-bold ${selectedUser.reportsCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {selectedUser.reportsCount}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Data de Registo</span>
                  </div>
                  <p className="font-medium text-gray-900">{selectedUser.joined}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {selectedUser.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Telefone</p>
                      <p className="font-medium text-gray-900">{selectedUser.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedUser.email}</p>
                  </div>
                </div>

                {selectedUser.city && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Cidade</p>
                      <p className="font-medium text-gray-900">{selectedUser.city}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">Última Atividade</p>
                    <p className="font-medium text-gray-900">{selectedUser.lastActivity}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {selectedUser.status === 'active' ? (
                  <Button
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      handleSuspendUser(selectedUser.id);
                    }}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Suspender Utilizador
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                    onClick={() => {
                      handleActivateUser(selectedUser.id);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Reativar Utilizador
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

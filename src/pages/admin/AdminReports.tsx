import { useState, useMemo } from 'react';
import {
  Flag,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Home,
  DoorOpen,
  MessageCircle,
  Star,
  Eye,
  Archive,
  Ban,
  X,
  AlertTriangle,
  Search,
  Calendar,
  Shield
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

type ReportType = 'user' | 'property' | 'room' | 'message' | 'review';
type ReportStatus = 'pending' | 'in_progress' | 'resolved' | 'archived';
type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

interface Report {
  id: string;
  type: ReportType;
  reporterName: string;
  reporterId: string;
  targetName: string;
  targetId: string;
  reason: string;
  description: string;
  severity: ReportSeverity;
  status: ReportStatus;
  date: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export function AdminReports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | ReportType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | ReportStatus>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | ReportSeverity>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      type: 'property',
      reporterName: 'João Silva',
      reporterId: '1',
      targetName: 'Apartamento T3 Centro Lisboa',
      targetId: 'prop-1',
      reason: 'Anúncio suspeito',
      description: 'Preço muito abaixo do mercado (350€ para T3 no centro). Possível fraude.',
      severity: 'high',
      status: 'pending',
      date: '2026-05-22'
    },
    {
      id: '2',
      type: 'user',
      reporterName: 'Ana Costa',
      reporterId: '3',
      targetName: 'Maria Santos',
      targetId: '2',
      reason: 'Perfil falso',
      description: 'Utiliza fotos de terceiros retiradas da internet. Possível scam.',
      severity: 'critical',
      status: 'in_progress',
      date: '2026-05-21'
    },
    {
      id: '3',
      type: 'message',
      reporterName: 'Pedro Santos',
      reporterId: '4',
      targetName: 'Carlos Alves',
      targetId: '5',
      reason: 'Comportamento inadequado',
      description: 'Linguagem ofensiva e ameaças em mensagens privadas. Prints em anexo.',
      severity: 'high',
      status: 'resolved',
      date: '2026-05-20',
      resolvedAt: '2026-05-21',
      resolvedBy: 'Admin UniRoom'
    },
    {
      id: '4',
      type: 'property',
      reporterName: 'Rita Alves',
      reporterId: '5',
      targetName: 'Casa T4 Coimbra',
      targetId: 'prop-3',
      reason: 'Anúncio duplicado',
      description: 'Mesma casa anunciada duas vezes com preços diferentes.',
      severity: 'medium',
      status: 'pending',
      date: '2026-05-20'
    },
    {
      id: '5',
      type: 'room',
      reporterName: 'Sofia Martins',
      reporterId: '7',
      targetName: 'Quarto individual Porto',
      targetId: 'room-12',
      reason: 'Fotos enganosas',
      description: 'As fotos do anúncio não correspondem ao quarto real. Quarto muito mais pequeno.',
      severity: 'medium',
      status: 'in_progress',
      date: '2026-05-19'
    },
    {
      id: '6',
      type: 'review',
      reporterName: 'Carlos Mendes',
      reporterId: '6',
      targetName: 'Avaliação a "João Silva"',
      targetId: 'review-1',
      reason: 'Avaliação falsa',
      description: 'Avaliação claramente falsa e difamatória sem fundamento.',
      severity: 'low',
      status: 'pending',
      date: '2026-05-18'
    },
    {
      id: '7',
      type: 'user',
      reporterName: 'Luís Ferreira',
      reporterId: '8',
      targetName: 'Pedro Oliveira',
      targetId: '9',
      reason: 'Assédio',
      description: 'Mensagens repetidas não solicitadas com conteúdo inadequado.',
      severity: 'critical',
      status: 'in_progress',
      date: '2026-05-17'
    },
    {
      id: '8',
      type: 'property',
      reporterName: 'Beatriz Costa',
      reporterId: '10',
      targetName: 'Apartamento T2 Braga',
      targetId: 'prop-5',
      reason: 'Informações incorretas',
      description: 'Distância à universidade incorreta (anúncio diz 500m, na realidade são 3km).',
      severity: 'low',
      status: 'archived',
      date: '2026-05-15',
      resolvedAt: '2026-05-16',
      resolvedBy: 'Admin UniRoom'
    },
  ]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch =
        report.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' || report.type === filterType;
      const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
      const matchesSeverity = filterSeverity === 'all' || report.severity === filterSeverity;

      return matchesSearch && matchesType && matchesStatus && matchesSeverity;
    });
  }, [reports, searchQuery, filterType, filterStatus, filterSeverity]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      inProgress: reports.filter(r => r.status === 'in_progress').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      critical: reports.filter(r => r.severity === 'critical' && r.status !== 'resolved').length,
      high: reports.filter(r => r.severity === 'high' && r.status !== 'resolved').length,
    };
  }, [reports]);

  const getTypeIcon = (type: ReportType) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'property':
        return <Home className="w-4 h-4" />;
      case 'room':
        return <DoorOpen className="w-4 h-4" />;
      case 'message':
        return <MessageCircle className="w-4 h-4" />;
      case 'review':
        return <Star className="w-4 h-4" />;
    }
  };

  const getTypeName = (type: ReportType) => {
    switch (type) {
      case 'user':
        return 'Utilizador';
      case 'property':
        return 'Casa';
      case 'room':
        return 'Quarto';
      case 'message':
        return 'Mensagem';
      case 'review':
        return 'Avaliação';
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'resolved':
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolvido
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="default">
            <Clock className="w-3 h-3 mr-1" />
            Em análise
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            <Archive className="w-3 h-3 mr-1" />
            Arquivado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const getSeverityBadge = (severity: ReportSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Crítico
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
            Alta
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
            Média
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
            Baixa
          </Badge>
        );
    }
  };

  const handleMarkInProgress = (reportId: string) => {
    setReports(prev => prev.map(r =>
      r.id === reportId ? { ...r, status: 'in_progress' as const } : r
    ));
    if (selectedReport?.id === reportId) {
      setSelectedReport(prev => prev ? { ...prev, status: 'in_progress' as const } : null);
    }
  };

  const handleResolve = (reportId: string) => {
    setReports(prev => prev.map(r =>
      r.id === reportId ? {
        ...r,
        status: 'resolved' as const,
        resolvedAt: new Date().toISOString().split('T')[0],
        resolvedBy: 'Admin UniRoom'
      } : r
    ));
    if (selectedReport?.id === reportId) {
      setSelectedReport(prev => prev ? {
        ...prev,
        status: 'resolved' as const,
        resolvedAt: new Date().toISOString().split('T')[0],
        resolvedBy: 'Admin UniRoom'
      } : null);
    }
  };

  const handleArchive = (reportId: string) => {
    setReports(prev => prev.map(r =>
      r.id === reportId ? { ...r, status: 'archived' as const } : r
    ));
    if (selectedReport?.id === reportId) {
      setSelectedReport(prev => prev ? { ...prev, status: 'archived' as const } : null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Denúncias</h1>
        <p className="text-gray-600">Gerir denúncias e reportes da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Flag className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Pendentes</p>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Em Análise</p>
              <p className="text-xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Resolvidas</p>
              <p className="text-xl font-bold text-gray-900">{stats.resolved}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Críticas</p>
              <p className="text-xl font-bold text-gray-900">{stats.critical}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Alta Prioridade</p>
              <p className="text-xl font-bold text-gray-900">{stats.high}</p>
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
              placeholder="Procurar por denunciante, alvo, motivo ou descrição..."
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
                Todos os tipos
              </button>
              <button
                onClick={() => setFilterType('user')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Utilizadores
              </button>
              <button
                onClick={() => setFilterType('property')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'property'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Casas
              </button>
              <button
                onClick={() => setFilterType('room')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'room'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Quartos
              </button>
              <button
                onClick={() => setFilterType('message')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'message'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mensagens
              </button>
              <button
                onClick={() => setFilterType('review')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'review'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Avaliações
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
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setFilterStatus('in_progress')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'in_progress'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Em análise
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'resolved'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Resolvidas
              </button>
            </div>

            <div className="w-px bg-gray-300"></div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterSeverity === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas gravidades
              </button>
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterSeverity === 'critical'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Críticas
              </button>
              <button
                onClick={() => setFilterSeverity('high')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterSeverity === 'high'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Altas
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Denunciante</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Alvo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Motivo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Gravidade</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getTypeIcon(report.type)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {getTypeName(report.type)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{report.reporterName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{report.targetName}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-900">{report.reason}</p>
                  </td>
                  <td className="py-4 px-4">
                    {getSeverityBadge(report.severity)}
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-sm">{report.date}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <Flag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhuma denúncia encontrada</p>
          </div>
        )}
      </Card>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <Flag className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedReport.reason}</h2>
                    <div className="flex items-center gap-3">
                      {getSeverityBadge(selectedReport.severity)}
                      {getStatusBadge(selectedReport.status)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(selectedReport.type)}
                    <span className="text-sm text-gray-600">Tipo de Denúncia</span>
                  </div>
                  <p className="font-medium text-gray-900">{getTypeName(selectedReport.type)}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Data da Denúncia</span>
                  </div>
                  <p className="font-medium text-gray-900">{selectedReport.date}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Denunciante</span>
                  </div>
                  <p className="font-medium text-gray-900">{selectedReport.reporterName}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Alvo da Denúncia</span>
                  </div>
                  <p className="font-medium text-gray-900">{selectedReport.targetName}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-2">Descrição Detalhada</h3>
                <p className="text-gray-600 p-4 bg-gray-50 rounded-lg">{selectedReport.description}</p>
              </div>

              {selectedReport.resolvedAt && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-green-900">Denúncia Resolvida</h3>
                  </div>
                  <div className="text-sm text-green-800">
                    <p>Resolvida em: <strong>{selectedReport.resolvedAt}</strong></p>
                    <p>Resolvida por: <strong>{selectedReport.resolvedBy}</strong></p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedReport.status === 'pending' && (
                  <>
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => {
                        handleMarkInProgress(selectedReport.id);
                      }}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Marcar em Análise
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                      onClick={() => {
                        handleResolve(selectedReport.id);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolver
                    </Button>
                  </>
                )}
                {selectedReport.status === 'in_progress' && (
                  <>
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => {
                        handleResolve(selectedReport.id);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolver Denúncia
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        alert('Funcionalidade mock: Suspender ' + selectedReport.targetName);
                      }}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Suspender Alvo
                    </Button>
                  </>
                )}
                {(selectedReport.status === 'resolved' || selectedReport.status === 'archived') && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedReport(null)}
                  >
                    Fechar
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    handleArchive(selectedReport.id);
                  }}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Arquivar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

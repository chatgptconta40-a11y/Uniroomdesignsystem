import { useState } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  X,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../components/AdminLayout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { getAdminReports } from '../data/mockAdmin';
import { AdminReport } from '../types/admin';

export function AdminReports() {
  const [reports, setReports] = useState(getAdminReports());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'listing'>('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending' | 'under_review' | 'resolved' | 'dismissed'
  >('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'severity'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [resolution, setResolution] = useState('');

  const filteredReports = reports
    .filter(report => {
      const matchesSearch =
        report.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || report.type === filterType;
      const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
      const matchesSeverity = filterSeverity === 'all' || report.severity === filterSeverity;

      return matchesSearch && matchesType && matchesStatus && matchesSeverity;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'createdAt') {
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
      } else if (sortBy === 'severity') {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800">Em Análise</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolvida</Badge>;
      case 'dismissed':
        return <Badge className="bg-muted text-gray-800">Arquivada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Média</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">Baixa</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const handleMarkUnderReview = (reportId: string) => {
    setReports(prev =>
      prev.map(report =>
        report.id === reportId ? { ...report, status: 'under_review' } : report
      )
    );
    setSelectedReport(prev =>
      prev?.id === reportId ? { ...prev, status: 'under_review' } : prev
    );
    toast.success('Denúncia marcada como em análise');
  };

  const handleResolveReport = (reportId: string, resolutionText: string) => {
    setReports(prev =>
      prev.map(report =>
        report.id === reportId
          ? {
              ...report,
              status: 'resolved',
              resolvedAt: new Date(),
              resolvedBy: 'Gestor UniRoom',
              resolution: resolutionText,
            }
          : report
      )
    );

    toast.success('Denúncia resolvida');
    setSelectedReport(null);
    setResolution('');
  };

  const handleDismissReport = (reportId: string, resolutionText: string) => {
    setReports(prev =>
      prev.map(report =>
        report.id === reportId
          ? {
              ...report,
              status: 'dismissed',
              resolvedAt: new Date(),
              resolvedBy: 'Gestor UniRoom',
              resolution: resolutionText,
            }
          : report
      )
    );

    toast.success('Denúncia arquivada');
    setSelectedReport(null);
    setResolution('');
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(report => report.status === 'pending').length,
    underReview: reports.filter(report => report.status === 'under_review').length,
    resolved: reports.filter(report => report.status === 'resolved').length,
    dismissed: reports.filter(report => report.status === 'dismissed').length,
  };

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            filterStatus === 'all' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setFilterStatus('all')}
        >
          <p className="text-xs text-muted-foreground mb-1">Total</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            filterStatus === 'pending' ? 'ring-2 ring-yellow-500' : ''
          }`}
          onClick={() => setFilterStatus('pending')}
        >
          <p className="text-xs text-muted-foreground mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            filterStatus === 'under_review' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setFilterStatus('under_review')}
        >
          <p className="text-xs text-muted-foreground mb-1">Em Análise</p>
          <p className="text-2xl font-bold text-blue-600">{stats.underReview}</p>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            filterStatus === 'resolved' ? 'ring-2 ring-green-500' : ''
          }`}
          onClick={() => setFilterStatus('resolved')}
        >
          <p className="text-xs text-muted-foreground mb-1">Resolvidas</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            filterStatus === 'dismissed' ? 'ring-2 ring-gray-500' : ''
          }`}
          onClick={() => setFilterStatus('dismissed')}
        >
          <p className="text-xs text-muted-foreground mb-1">Arquivadas</p>
          <p className="text-2xl font-bold text-muted-foreground">{stats.dismissed}</p>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar denúncias..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={filterType}
              onChange={event => setFilterType(event.target.value as any)}
              className="pl-10 pr-8 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-input-background"
            >
              <option value="all">Todos os tipos</option>
              <option value="user">Utilizadores</option>
              <option value="listing">Alojamentos</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterSeverity}
              onChange={event => setFilterSeverity(event.target.value as any)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-input-background pr-8"
            >
              <option value="all">Todas as gravidades</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={event => setSortBy(event.target.value as any)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-input-background pr-8"
            >
              <option value="createdAt">Data</option>
              <option value="severity">Gravidade</option>
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
          {filteredReports.length} denúncias encontradas
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Alvo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Denunciante
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Gravidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="bg-card divide-y divide-border">
              {filteredReports.map(report => (
                <tr key={report.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{report.targetName}</p>
                      <Badge variant="outline" className="mt-1 text-xs capitalize">
                        {report.type === 'user' ? 'Utilizador' : 'Alojamento'}
                      </Badge>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-foreground">{report.reporterName}</p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground line-clamp-2">{report.reason}</p>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSeverityBadge(report.severity)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(report.status)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {report.createdAt.toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)}>
                      Ver Detalhes
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedReport && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedReport(null)} />

          <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-card shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Detalhes da Denúncia</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {selectedReport.targetName}
                    </h3>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedReport.status)}
                      {getSeverityBadge(selectedReport.severity)}
                      <Badge variant="outline" className="capitalize">
                        {selectedReport.type === 'user' ? 'Utilizador' : 'Alojamento'}
                      </Badge>
                    </div>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Denunciante</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedReport.reporterName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Motivo</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedReport.reason}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm text-foreground">
                      {selectedReport.description}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Data da Denúncia</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedReport.createdAt.toLocaleDateString('pt-PT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </Card>

              {selectedReport.status === 'resolved' || selectedReport.status === 'dismissed' ? (
                <Card className="p-6 bg-green-50 border-green-200">
                  <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {selectedReport.status === 'resolved'
                      ? 'Resolução'
                      : 'Motivo do Arquivamento'}
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-green-700 mb-1">Resolvido por</p>
                      <p className="text-sm font-medium text-green-900">
                        {selectedReport.resolvedBy}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-green-700 mb-1">Data de resolução</p>
                      <p className="text-sm font-medium text-green-900">
                        {selectedReport.resolvedAt?.toLocaleDateString('pt-PT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-green-700 mb-1">Detalhes</p>
                      <p className="text-sm text-green-900">{selectedReport.resolution}</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6">
                  <h4 className="font-bold text-foreground mb-4">Ações Administrativas</h4>

                  {selectedReport.status === 'pending' && (
                    <div className="mb-4">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-blue-700 border-blue-300 hover:bg-blue-50"
                        onClick={() => handleMarkUnderReview(selectedReport.id)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Marcar Como Em Análise
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Resolução / Comentários
                      </label>
                      <textarea
                        value={resolution}
                        onChange={event => setResolution(event.target.value)}
                        placeholder="Descreve a ação tomada e a resolução..."
                        className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full justify-start text-green-700 border-green-300 hover:bg-green-50"
                      onClick={() => handleResolveReport(selectedReport.id, resolution)}
                      disabled={!resolution}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar Como Resolvida
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start text-foreground border-border hover:bg-muted"
                      onClick={() => handleDismissReport(selectedReport.id, resolution)}
                      disabled={!resolution}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Arquivar Denúncia
                    </Button>
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <h4 className="font-bold text-foreground mb-4">Ações Rápidas</h4>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    {selectedReport.type === 'user' ? 'Ver Perfil do Utilizador' : 'Ver Anúncio'}
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Perfil do Denunciante
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Ver Outras Denúncias Relacionadas
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
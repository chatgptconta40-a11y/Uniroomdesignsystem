import { useState } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Users,
  Activity,
  Info,
  Save,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  X,
  Mail,
  UserPlus
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';
import { toast } from 'sonner';

export function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'moderator' | 'support'>('moderator');

  // Platform Data
  const [platformName, setPlatformName] = useState('UniRoom');
  const [platformEmail, setPlatformEmail] = useState('admin@uniroom.pt');
  const [supportEmail, setSupportEmail] = useState('suporte@uniroom.pt');

  // Moderation Rules
  const [autoApproveProperties, setAutoApproveProperties] = useState(false);
  const [requireVerification, setRequireVerification] = useState(true);
  const [autoFlagSuspicious, setAutoFlagSuspicious] = useState(true);
  const [maxReportsBeforeSuspension, setMaxReportsBeforeSuspension] = useState('3');

  // System Limits
  const [maxPropertiesPerLandlord, setMaxPropertiesPerLandlord] = useState('10');
  const [maxApplicationsPerStudent, setMaxApplicationsPerStudent] = useState('5');
  const [maxImagesPerProperty, setMaxImagesPerProperty] = useState('10');
  const [maxMessageLength, setMaxMessageLength] = useState('2000');

  // Admin Management
  const [admins] = useState([
    { id: '1', name: 'Admin UniRoom', email: 'admin@uniroom.pt', role: 'Super Admin', active: true },
    { id: '2', name: 'Moderador 1', email: 'mod1@uniroom.pt', role: 'Moderador', active: true },
    { id: '3', name: 'Suporte 1', email: 'suporte1@uniroom.pt', role: 'Suporte', active: false },
  ]);

  // Trust Score Parameters
  const [verificationBonus, setVerificationBonus] = useState('10');
  const [completeProfileBonus, setCompleteProfileBonus] = useState('5');
  const [successfulApplicationBonus, setSuccessfulApplicationBonus] = useState('3');
  const [reportPenalty, setReportPenalty] = useState('15');

  // Notification Preferences
  const [notifyNewReports, setNotifyNewReports] = useState(true);
  const [notifyCriticalReports, setNotifyCriticalReports] = useState(true);
  const [notifyNewProperties, setNotifyNewProperties] = useState(false);
  const [notifyNewUsers, setNotifyNewUsers] = useState(false);
  const [notifySystemAlerts, setNotifySystemAlerts] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    // Mock invite - in real app would send email
    toast.success(`Convite enviado com sucesso para ${inviteEmail}!`);

    // Reset form and close modal
    setInviteEmail('');
    setInviteRole('moderator');
    setShowInviteModal(false);
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Gestor';
      case 'moderator':
        return 'Moderador';
      case 'support':
        return 'Suporte';
      default:
        return role;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
          <p className="text-gray-600">Gerir configurações administrativas da plataforma</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Guardar Alterações
        </Button>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">Configurações guardadas com sucesso!</span>
        </div>
      )}

      {/* Platform Data */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Dados da Plataforma</h3>
            <p className="text-sm text-gray-600">Informações gerais e configurações de identidade</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Plataforma</label>
            <Input
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="Nome da plataforma"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Principal</label>
            <Input
              type="email"
              value={platformEmail}
              onChange={(e) => setPlatformEmail(e.target.value)}
              placeholder="admin@plataforma.pt"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email de Suporte</label>
            <Input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="suporte@plataforma.pt"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Versão da Plataforma</label>
            <Input
              value="1.0.0"
              disabled
              className="bg-gray-100"
            />
          </div>
        </div>
      </Card>

      {/* Moderation Rules */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 rounded-xl">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Regras de Moderação</h3>
            <p className="text-sm text-gray-600">Configurar políticas de aprovação e segurança</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Aprovação Automática de Propriedades</p>
              <p className="text-sm text-gray-600">Publicar casas sem revisão manual</p>
            </div>
            <button
              onClick={() => setAutoApproveProperties(!autoApproveProperties)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoApproveProperties ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  autoApproveProperties ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Exigir Verificação de Email</p>
              <p className="text-sm text-gray-600">Utilizadores devem verificar email para usar plataforma</p>
            </div>
            <button
              onClick={() => setRequireVerification(!requireVerification)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                requireVerification ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  requireVerification ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Deteção Automática de Anúncios Suspeitos</p>
              <p className="text-sm text-gray-600">Marcar automaticamente preços fora do normal</p>
            </div>
            <button
              onClick={() => setAutoFlagSuspicious(!autoFlagSuspicious)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoFlagSuspicious ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  autoFlagSuspicious ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Denúncias Antes de Suspensão Automática
            </label>
            <Input
              type="number"
              value={maxReportsBeforeSuspension}
              onChange={(e) => setMaxReportsBeforeSuspension(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-gray-500 mt-2">Suspender conta após N denúncias válidas</p>
          </div>
        </div>
      </Card>

      {/* System Limits */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Database className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Limites do Sistema</h3>
            <p className="text-sm text-gray-600">Definir restrições e limites operacionais</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Propriedades por Senhorio
            </label>
            <Input
              type="number"
              value={maxPropertiesPerLandlord}
              onChange={(e) => setMaxPropertiesPerLandlord(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Candidaturas Simultâneas por Estudante
            </label>
            <Input
              type="number"
              value={maxApplicationsPerStudent}
              onChange={(e) => setMaxApplicationsPerStudent(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Imagens por Propriedade
            </label>
            <Input
              type="number"
              value={maxImagesPerProperty}
              onChange={(e) => setMaxImagesPerProperty(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprimento Máximo de Mensagem (caracteres)
            </label>
            <Input
              type="number"
              value={maxMessageLength}
              onChange={(e) => setMaxMessageLength(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Admin Management */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 rounded-xl">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Gestão de Administradores</h3>
            <p className="text-sm text-gray-600">Gerir contas administrativas da plataforma</p>
          </div>
        </div>
        <div className="space-y-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {admin.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{admin.name}</p>
                  <p className="text-sm text-gray-600">{admin.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={admin.role === 'Super Admin' ? 'default' : 'outline'}>
                  {admin.role}
                </Badge>
                <Badge variant={admin.active ? 'success' : 'outline'}>
                  {admin.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => setShowInviteModal(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Convidar Novo Gestor
          </Button>
        </div>
      </Card>

      {/* Trust Score Parameters */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-yellow-100 rounded-xl">
            <TrendingUp className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Parâmetros de Trust Score</h3>
            <p className="text-sm text-gray-600">Configurar pontuações de confiança dos utilizadores</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bónus por Verificação de Conta (+)
            </label>
            <Input
              type="number"
              value={verificationBonus}
              onChange={(e) => setVerificationBonus(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bónus por Perfil Completo (+)
            </label>
            <Input
              type="number"
              value={completeProfileBonus}
              onChange={(e) => setCompleteProfileBonus(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bónus por Candidatura Bem Sucedida (+)
            </label>
            <Input
              type="number"
              value={successfulApplicationBonus}
              onChange={(e) => setSuccessfulApplicationBonus(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Penalização por Denúncia Válida (-)
            </label>
            <Input
              type="number"
              value={reportPenalty}
              onChange={(e) => setReportPenalty(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Trust Score Base</p>
              <p className="text-sm text-blue-700">
                Todos os utilizadores começam com 50 pontos. O score máximo é 100 e o mínimo é 0.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-100 rounded-xl">
            <Bell className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Preferências de Notificações</h3>
            <p className="text-sm text-gray-600">Configurar alertas para administradores</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Novas Denúncias</p>
              <p className="text-sm text-gray-600">Notificar quando uma nova denúncia é criada</p>
            </div>
            <button
              onClick={() => setNotifyNewReports(!notifyNewReports)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifyNewReports ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  notifyNewReports ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-gray-900">Denúncias Críticas</p>
                <p className="text-sm text-gray-600">Alertas imediatos para denúncias de alta prioridade</p>
              </div>
            </div>
            <button
              onClick={() => setNotifyCriticalReports(!notifyCriticalReports)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifyCriticalReports ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  notifyCriticalReports ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Novas Propriedades</p>
              <p className="text-sm text-gray-600">Notificar quando uma nova propriedade é publicada</p>
            </div>
            <button
              onClick={() => setNotifyNewProperties(!notifyNewProperties)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifyNewProperties ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  notifyNewProperties ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Novos Utilizadores</p>
              <p className="text-sm text-gray-600">Notificar quando um novo utilizador se regista</p>
            </div>
            <button
              onClick={() => setNotifyNewUsers(!notifyNewUsers)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifyNewUsers ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  notifyNewUsers ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Alertas de Sistema</p>
                <p className="text-sm text-gray-600">Notificações sobre erros e problemas técnicos</p>
              </div>
            </div>
            <button
              onClick={() => setNotifySystemAlerts(!notifySystemAlerts)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifySystemAlerts ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  notifySystemAlerts ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2 px-8">
          <Save className="w-4 h-4" />
          Guardar Todas as Configurações
        </Button>
      </div>

      {/* Invite Admin Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Convidar Gestor</h2>
                    <p className="text-sm text-gray-600">Enviar convite para novo membro da equipa</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email do Convidado
                  </label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemplo.pt"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    O convite será enviado para este endereço de email
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Acesso
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setInviteRole('admin')}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        inviteRole === 'admin'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Gestor</p>
                          <p className="text-sm text-gray-600">Acesso total a todas as funcionalidades</p>
                        </div>
                        {inviteRole === 'admin' && (
                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInviteRole('moderator')}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        inviteRole === 'moderator'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Moderador</p>
                          <p className="text-sm text-gray-600">Gerir utilizadores, denúncias e propriedades</p>
                        </div>
                        {inviteRole === 'moderator' && (
                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInviteRole('support')}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        inviteRole === 'support'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Suporte</p>
                          <p className="text-sm text-gray-600">Acesso apenas a mensagens e suporte</p>
                        </div>
                        {inviteRole === 'support' && (
                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Enviar Convite
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

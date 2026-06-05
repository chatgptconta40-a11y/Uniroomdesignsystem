import { useEffect, useState } from 'react';
import {
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
  UserPlus,
  Loader2,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';
import { toast } from 'sonner';
import { useAppSettings, type AppSettings } from '../../hooks/useAppSettings';
import { useAdminAuditLogs } from '../../hooks/useAdminAuditLogs';
import { supabase } from '../../lib/supabase';

interface AdminRow {
  id: string;
  fullName: string;
  email: string;
  verified: boolean;
}

export function AdminSettings() {
  const { settings, loading, saving, save } = useAppSettings();
  const { createLog } = useAdminAuditLogs({ limit: 1 });

  const [draft, setDraft] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'moderator' | 'support'>('moderator');

  // Real admins from profiles
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);

  useEffect(() => { setDraft(settings); }, [settings]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAdminsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, verified')
        .eq('type', 'admin')
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error('[AdminSettings] admins fetch error:', error.message);
        setAdmins([]);
      } else {
        setAdmins((data ?? []).map(r => ({
          id: r.id,
          fullName: r.full_name ?? '',
          email: r.email ?? '',
          verified: !!r.verified,
        })));
      }
      setAdminsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const ok = await save(draft);
    if (!ok) {
      toast.error('Erro ao guardar configurações.');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    void createLog({
      action: 'settings_updated',
      entityType: 'settings',
      entityId: 'global',
      entityLabel: 'Configurações da plataforma',
    });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Por favor, insira um email válido');
      return;
    }
    toast.info('Funcionalidade não disponível. O convite de administradores ainda não está implementado.');
  };

  const numberField = (key: keyof AppSettings, value: number) => (
    <Input
      type="number"
      value={String(value)}
      onChange={(e) => update(key, Number(e.target.value) as AppSettings[typeof key])}
    />
  );

  const toggle = (key: keyof AppSettings, value: boolean) => (
    <button
      onClick={() => update(key, !value as AppSettings[typeof key])}
      className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-gray-300'}`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : ''}`}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-10 h-10 text-gray-300 mx-auto mb-3 animate-spin" />
        <p className="text-sm text-gray-500">A carregar configurações…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
          <p className="text-gray-600">Gerir configurações administrativas da plataforma</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'A guardar…' : 'Guardar Alterações'}
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
            <Input value={draft.platform_name} onChange={(e) => update('platform_name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Principal</label>
            <Input type="email" value={draft.main_email} onChange={(e) => update('main_email', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email de Suporte</label>
            <Input type="email" value={draft.support_email} onChange={(e) => update('support_email', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Versão da Plataforma</label>
            <Input value={draft.platform_version} onChange={(e) => update('platform_version', e.target.value)} />
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
            {toggle('auto_approve_properties', draft.auto_approve_properties)}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Exigir Verificação de Email</p>
              <p className="text-sm text-gray-600">Utilizadores devem verificar email para usar plataforma</p>
            </div>
            {toggle('require_email_verification', draft.require_email_verification)}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Deteção Automática de Anúncios Suspeitos</p>
              <p className="text-sm text-gray-600">Marcar automaticamente preços fora do normal</p>
            </div>
            {toggle('detect_suspicious_listings', draft.detect_suspicious_listings)}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Denúncias Antes de Suspensão Automática
            </label>
            <div className="max-w-xs">{numberField('reports_before_auto_suspension', draft.reports_before_auto_suspension)}</div>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Máximo de Propriedades por Senhorio</label>
            {numberField('max_properties_per_landlord', draft.max_properties_per_landlord)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Máximo de Candidaturas Simultâneas por Estudante</label>
            {numberField('max_applications_per_student', draft.max_applications_per_student)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Máximo de Imagens por Propriedade</label>
            {numberField('max_images_per_property', draft.max_images_per_property)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comprimento Máximo de Mensagem (caracteres)</label>
            {numberField('max_message_length', draft.max_message_length)}
          </div>
        </div>
      </Card>

      {/* Admin Management — real profiles where type='admin' */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 rounded-xl">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Gestão de Administradores</h3>
            <p className="text-sm text-gray-600">Contas com tipo "admin" na plataforma</p>
          </div>
        </div>
        <div className="space-y-3">
          {adminsLoading ? (
            <div className="py-6 text-center">
              <Loader2 className="w-6 h-6 text-gray-300 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-gray-500">A carregar administradores…</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Ainda não há administradores registados.
            </div>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {(admin.fullName || admin.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{admin.fullName || '(sem nome)'}</p>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">Admin</Badge>
                  <Badge variant={admin.verified ? 'success' : 'outline'}>
                    {admin.verified ? 'Verificado' : 'Por verificar'}
                  </Badge>
                </div>
              </div>
            ))
          )}
          <Button variant="outline" className="w-full mt-2" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Convidar Novo Gestor
          </Button>
        </div>
      </Card>

      {/* Trust Score */}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Bónus por Verificação de Conta (+)</label>
            {numberField('trust_bonus_verified', draft.trust_bonus_verified)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bónus por Perfil Completo (+)</label>
            {numberField('trust_bonus_complete_profile', draft.trust_bonus_complete_profile)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bónus por Candidatura Bem Sucedida (+)</label>
            {numberField('trust_bonus_successful_application', draft.trust_bonus_successful_application)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Penalização por Denúncia Válida (-)</label>
            {numberField('trust_penalty_valid_report', draft.trust_penalty_valid_report)}
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

      {/* Notifications */}
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
            {toggle('notify_new_reports', draft.notify_new_reports)}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-gray-900">Denúncias Críticas</p>
                <p className="text-sm text-gray-600">Alertas imediatos para denúncias de alta prioridade</p>
              </div>
            </div>
            {toggle('notify_critical_reports', draft.notify_critical_reports)}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Novas Propriedades</p>
              <p className="text-sm text-gray-600">Notificar quando uma nova propriedade é publicada</p>
            </div>
            {toggle('notify_new_properties', draft.notify_new_properties)}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Novos Utilizadores</p>
              <p className="text-sm text-gray-600">Notificar quando um novo utilizador se regista</p>
            </div>
            {toggle('notify_new_users', draft.notify_new_users)}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Alertas de Sistema</p>
                <p className="text-sm text-gray-600">Notificações sobre erros e problemas técnicos</p>
              </div>
            </div>
            {toggle('notify_system_alerts', draft.notify_system_alerts)}
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2 px-8">
          <Save className="w-4 h-4" />
          {saving ? 'A guardar…' : 'Guardar Todas as Configurações'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email do Convidado</label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemplo.pt"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">O convite será enviado para este endereço de email</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Acesso</label>
                  <div className="space-y-2">
                    {(['admin', 'moderator', 'support'] as const).map((role) => {
                      const labels = {
                        admin: { name: 'Gestor', desc: 'Acesso total a todas as funcionalidades' },
                        moderator: { name: 'Moderador', desc: 'Gerir utilizadores, denúncias e propriedades' },
                        support: { name: 'Suporte', desc: 'Acesso apenas a mensagens e suporte' },
                      };
                      const isSelected = inviteRole === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setInviteRole(role)}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{labels[role].name}</p>
                              <p className="text-sm text-gray-600">{labels[role].desc}</p>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 gap-2">
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

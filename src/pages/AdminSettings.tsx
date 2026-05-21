import { useState } from 'react';
import { Save, Plus, Trash2, Edit2, Shield, Settings as SettingsIcon, Users, AlertTriangle } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { getSystemSettings, getModerationRules } from '../data/mockAdmin';
import { toast } from 'sonner';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'branding' | 'admins' | 'limits' | 'moderation'>('branding');
  const [systemSettings, setSystemSettings] = useState(getSystemSettings());
  const [moderationRules, setModerationRules] = useState(getModerationRules());
  const [brandingSettings, setBrandingSettings] = useState({
    platformName: 'UniRoom',
    tagline: 'Alojamento Universitário',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    logoUrl: '',
  });

  const [adminUsers] = useState([
    { id: '1', name: 'Admin Principal', email: 'admin@uniroom.pt', role: 'Super Admin', addedAt: new Date('2026-01-01') },
    { id: '2', name: 'Moderador 1', email: 'mod1@uniroom.pt', role: 'Moderator', addedAt: new Date('2026-02-15') },
    { id: '3', name: 'Moderador 2', email: 'mod2@uniroom.pt', role: 'Moderator', addedAt: new Date('2026-03-20') },
  ]);

  const handleSaveBranding = () => {
    toast.success('Configurações de branding guardadas com sucesso!');
  };

  const handleSaveLimits = () => {
    toast.success('Limites do sistema atualizados com sucesso!');
  };

  const handleToggleRule = (ruleId: string) => {
    setModerationRules(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    toast.success('Regra de moderação atualizada!');
  };

  const tabs = [
    { id: 'branding' as const, label: 'Branding', icon: SettingsIcon },
    { id: 'admins' as const, label: 'Administradores', icon: Users },
    { id: 'limits' as const, label: 'Limites do Sistema', icon: Shield },
    { id: 'moderation' as const, label: 'Regras de Moderação', icon: AlertTriangle },
  ];

  return (
    <AdminLayout>
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'branding' && (
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Configurações de Branding</h3>
            <p className="text-sm text-slate-600">Personalize a aparência da plataforma</p>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Nome da Plataforma
              </label>
              <input
                type="text"
                value={brandingSettings.platformName}
                onChange={(e) => setBrandingSettings({ ...brandingSettings, platformName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Tagline
              </label>
              <input
                type="text"
                value={brandingSettings.tagline}
                onChange={(e) => setBrandingSettings({ ...brandingSettings, tagline: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Cor Primária
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={brandingSettings.primaryColor}
                    onChange={(e) => setBrandingSettings({ ...brandingSettings, primaryColor: e.target.value })}
                    className="w-16 h-10 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingSettings.primaryColor}
                    onChange={(e) => setBrandingSettings({ ...brandingSettings, primaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Cor Secundária
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={brandingSettings.secondaryColor}
                    onChange={(e) => setBrandingSettings({ ...brandingSettings, secondaryColor: e.target.value })}
                    className="w-16 h-10 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingSettings.secondaryColor}
                    onChange={(e) => setBrandingSettings({ ...brandingSettings, secondaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                URL do Logótipo
              </label>
              <input
                type="text"
                value={brandingSettings.logoUrl}
                onChange={(e) => setBrandingSettings({ ...brandingSettings, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveBranding}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Alterações
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'admins' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Administradores</h3>
                <p className="text-sm text-slate-600">Gerir utilizadores com acesso administrativo</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Admin
              </Button>
            </div>

            <div className="space-y-3">
              {adminUsers.map(admin => (
                <Card key={admin.id} className="p-4 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                        {admin.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{admin.name}</p>
                        <p className="text-xs text-slate-600">{admin.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {admin.role}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            Adicionado em {admin.addedAt.toLocaleDateString('pt-PT')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      {admin.role !== 'Super Admin' && (
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'limits' && (
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Limites do Sistema</h3>
            <p className="text-sm text-slate-600">Configure os limites operacionais da plataforma</p>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Máximo de Alojamentos por Senhorio
              </label>
              <input
                type="number"
                value={systemSettings.maxListingsPerLandlord}
                onChange={(e) => setSystemSettings({ ...systemSettings, maxListingsPerLandlord: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-slate-500 mt-1">
                Número máximo de anúncios que um senhorio pode ter ativos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Máximo de Candidaturas por Estudante
              </label>
              <input
                type="number"
                value={systemSettings.maxApplicationsPerStudent}
                onChange={(e) => setSystemSettings({ ...systemSettings, maxApplicationsPerStudent: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-slate-500 mt-1">
                Número máximo de candidaturas simultâneas por estudante
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Trust Score Mínimo para Publicar
              </label>
              <input
                type="number"
                value={systemSettings.minTrustScoreForListing}
                onChange={(e) => setSystemSettings({ ...systemSettings, minTrustScoreForListing: parseInt(e.target.value) })}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-slate-500 mt-1">
                Trust score mínimo necessário para publicar alojamentos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Threshold de Suspensão Automática
              </label>
              <input
                type="number"
                value={systemSettings.autoSuspendThreshold}
                onChange={(e) => setSystemSettings({ ...systemSettings, autoSuspendThreshold: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-slate-500 mt-1">
                Número de denúncias que desencadeia suspensão automática
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Limite de Tempo para Revisão de Denúncias (horas)
              </label>
              <input
                type="number"
                value={systemSettings.reportReviewTimeLimit}
                onChange={(e) => setSystemSettings({ ...systemSettings, reportReviewTimeLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-slate-500 mt-1">
                Tempo máximo para revisão de denúncias antes de escalar
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveLimits}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Limites
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Regras de Moderação</h3>
                <p className="text-sm text-slate-600">Configure as regras automáticas de moderação</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Regra
              </Button>
            </div>

            <div className="space-y-4">
              {moderationRules.map(rule => {
                const getSeverityColor = (severity: string) => {
                  switch (severity) {
                    case 'high':
                      return 'bg-red-100 text-red-800';
                    case 'medium':
                      return 'bg-yellow-100 text-yellow-800';
                    case 'low':
                      return 'bg-blue-100 text-blue-800';
                    default:
                      return 'bg-muted text-muted-foreground';
                  }
                };

                const getActionBadge = (action: string) => {
                  switch (action) {
                    case 'block':
                      return <Badge className="bg-red-600 text-white">Bloquear</Badge>;
                    case 'suspend':
                      return <Badge className="bg-yellow-600 text-white">Suspender</Badge>;
                    case 'flag':
                      return <Badge className="bg-blue-600 text-white">Sinalizar</Badge>;
                    default:
                      return <Badge variant="outline">{action}</Badge>;
                  }
                };

                return (
                  <Card key={rule.id} className={`p-4 ${rule.enabled ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h4 className="font-bold text-slate-900">{rule.name}</h4>
                          <Badge className={getSeverityColor(rule.severity)}>
                            {rule.severity === 'high' ? 'Alta' : rule.severity === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                          {getActionBadge(rule.action)}
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{rule.description}</p>
                        <p className="text-xs text-slate-500">
                          Threshold: {rule.threshold}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => handleToggleRule(rule.id)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                        <Button size="sm" variant="outline">
                          <Edit2 className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-yellow-900 mb-1">Atenção</h4>
                <p className="text-sm text-yellow-800">
                  Alterações às regras de moderação afetam imediatamente o comportamento da plataforma.
                  Teste cuidadosamente antes de ativar regras que possam impactar muitos utilizadores.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
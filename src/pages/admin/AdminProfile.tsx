import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Save,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Calendar,
  Edit2,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface ProfileRow {
  full_name: string | null;
  email: string | null;
  type: string | null;
  status: string | null;
  verified: boolean;
  created_at: string | null;
  avatar_url: string | null;
}

export function AdminProfile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Edit name state
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Change password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, type, status, verified, created_at, avatar_url')
        .eq('id', user.id)
        .single();
      if (cancelled) return;
      if (error) {
        toast.error('Erro ao carregar perfil: ' + error.message);
      } else {
        setProfile(data);
        setDraftName(data.full_name ?? '');
      }
      setProfileLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleSaveName = async () => {
    if (!user?.id || !draftName.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: draftName.trim(), updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSavingName(false);
    if (error) {
      toast.error('Erro ao guardar nome: ' + error.message);
    } else {
      setProfile(prev => prev ? { ...prev, full_name: draftName.trim() } : prev);
      setEditingName(false);
      toast.success('Nome atualizado com sucesso!');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('A password deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As passwords não coincidem.');
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error('Erro ao alterar password: ' + error.message);
    } else {
      toast.success('Password alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-10 h-10 text-gray-300 mx-auto mb-3 animate-spin" />
        <p className="text-sm text-gray-500">A carregar perfil…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Não foi possível carregar o perfil.</p>
      </div>
    );
  }

  const displayName = profile.full_name || profile.email || 'Admin';
  const initials = displayName.charAt(0).toUpperCase();
  const createdAt = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">O Meu Perfil</h1>
        <p className="text-gray-600">Informações pessoais e definições de segurança da sua conta</p>
      </div>

      {/* Avatar + identity */}
      <Card className="p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{profile.full_name || '(sem nome)'}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="default">Administrador</Badge>
              <Badge variant={profile.verified ? 'success' : 'outline'}>
                {profile.verified ? 'Verificado' : 'Por verificar'}
              </Badge>
              {profile.status && profile.status !== 'active' && (
                <Badge variant="error">{profile.status}</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Account info */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Informações da Conta</h3>
        </div>

        {/* Full name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          {editingName ? (
            <div className="flex gap-2">
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="O seu nome"
                autoFocus
              />
              <Button onClick={handleSaveName} disabled={savingName || !draftName.trim()} className="gap-1 shrink-0">
                {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </Button>
              <Button variant="outline" onClick={() => { setEditingName(false); setDraftName(profile.full_name ?? ''); }} className="shrink-0">
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-900">{profile.full_name || <span className="text-gray-400 italic">Não definido</span>}</span>
              <button
                onClick={() => setEditingName(true)}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900">{profile.email}</span>
            <span className="ml-auto text-xs text-gray-400">Gerido pelo Supabase Auth</span>
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de conta</label>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-4 h-4 text-purple-500" />
            <span className="text-gray-900 capitalize">{profile.type ?? 'admin'}</span>
          </div>
        </div>

        {/* Created at */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Membro desde</label>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900">{createdAt}</span>
          </div>
        </div>

        {/* Verification */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado de verificação</label>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {profile.verified
              ? <CheckCircle className="w-4 h-4 text-green-500" />
              : <AlertCircle className="w-4 h-4 text-yellow-500" />}
            <span className="text-gray-900">
              {profile.verified ? 'Conta verificada' : 'Conta por verificar'}
            </span>
          </div>
        </div>
      </Card>

      {/* Change password */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Lock className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Segurança</h3>
        </div>

        {!showPasswordSection ? (
          <Button variant="outline" onClick={() => setShowPasswordSection(true)}>
            Alterar Password
          </Button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova password</label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova password</label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={savingPassword} className="gap-2">
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingPassword ? 'A guardar…' : 'Alterar Password'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowPasswordSection(false); setNewPassword(''); setConfirmPassword(''); }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

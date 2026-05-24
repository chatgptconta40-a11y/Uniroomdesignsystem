import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { TrustBadge } from '../components/TrustBadge';
import { getProfile, saveProfile } from '../data/mockProfiles';
import { toast } from 'sonner';
import {
  StudentProfile,
  PersonalProfile,
  LifestyleProfile,
  AccommodationPreferences,
} from '../types/profile';
import {
  PersonalEditModal,
  LifestyleEditModal,
  PreferencesEditModal,
} from '../components/ProfileEditModals';
import {
  User,
  Users,
  Home,
  Edit,
  CheckCircle,
  AlertCircle,
  MapPin,
  GraduationCap,
  Calendar,
  Globe,
  Shield,
} from 'lucide-react';

export function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'lifestyle' | 'preferences'>('personal');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false);
  const [isLifestyleModalOpen, setIsLifestyleModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const userProfile = getProfile(user.id);
      setProfile(userProfile);
    }
  }, [user]);

  const handleSavePersonal = (updatedPersonal: PersonalProfile) => {
    if (profile) {
      const updatedProfile = { ...profile, personal: updatedPersonal };
      setProfile(updatedProfile);
      saveProfile(updatedProfile);
      toast.success('Alterações guardadas com sucesso.');
    }
  };

  const handleSaveLifestyle = (updatedLifestyle: LifestyleProfile) => {
    if (profile) {
      const updatedProfile = { ...profile, lifestyle: updatedLifestyle };
      setProfile(updatedProfile);
      saveProfile(updatedProfile);
      toast.success('Alterações guardadas com sucesso.');
    }
  };

  const handleSavePreferences = (updatedPreferences: AccommodationPreferences) => {
    if (profile) {
      const updatedProfile = { ...profile, preferences: updatedPreferences };
      setProfile(updatedProfile);
      saveProfile(updatedProfile);
      toast.success('Alterações guardadas com sucesso.');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h3 className="mb-3">Perfil não encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Ainda não completaste o teu perfil.
          </p>
          <Link to="/onboarding">
            <Button variant="primary">Completar perfil</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'personal' as const, label: 'Pessoal', icon: User },
    { id: 'lifestyle' as const, label: 'Convivência', icon: Users },
    { id: 'preferences' as const, label: 'Preferências', icon: Home },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Card className="mb-6 relative overflow-hidden">
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {profile.personal.fullName?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <h1 className="mb-0">{profile.personal.fullName}</h1>

                {profile.completeness.overall >= 80 && (
                  <Badge variant="success">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Perfil completo
                  </Badge>
                )}
              </div>

              <div className="mb-3">
                <TrustBadge userId={user?.id || ''} size="md" showLabel />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                {profile.personal.course && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>{profile.personal.course}</span>
                  </div>
                )}

                {profile.personal.institution && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.personal.institution}</span>
                  </div>
                )}

                {profile.personal.yearOfStudy && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{profile.personal.yearOfStudy}º ano</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Link to="/verification">
                  <Button variant="outline" size="sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Melhorar verificação
                  </Button>
                </Link>
              </div>

              <div className="max-w-xl">
                <ProgressBar
                  progress={profile.completeness.overall}
                  showLabel
                  size="md"
                  color="primary"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="flex gap-6 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {activeTab === 'personal' && (
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Informação pessoal</h3>
              </div>

              <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsPersonalModalOpen(true)}>
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Nome completo</p>
                <p className="text-foreground">{profile.personal.fullName || '-'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Idade</p>
                <p className="text-foreground">{profile.personal.age || '-'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Curso</p>
                <p className="text-foreground">{profile.personal.course || '-'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Instituição</p>
                <p className="text-foreground">{profile.personal.institution || '-'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Ano de curso</p>
                <p className="text-foreground">
                  {profile.personal.yearOfStudy ? `${profile.personal.yearOfStudy}º ano` : '-'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Cidade de origem</p>
                <p className="text-foreground">{profile.personal.hometown || '-'}</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground mb-1">Bio</p>
                <p className="text-foreground">{profile.personal.bio || '-'}</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground mb-1">Idiomas</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.personal.languages && profile.personal.languages.length > 0 ? (
                    profile.personal.languages.map((language, index) => (
                      <Badge key={index} variant="outline">
                        <Globe className="w-3 h-3 mr-1" />
                        {language}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-foreground">-</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'lifestyle' && (
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Users className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="text-xl font-bold">Perfil de convivência</h3>
              </div>

              <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsLifestyleModalOpen(true)}>
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="mb-3 font-semibold text-foreground">Horários</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Deitar</p>
                    <p className="font-medium">
                      {profile.lifestyle.bedtime === 'early' && 'Cedo (antes 22h)'}
                      {profile.lifestyle.bedtime === 'moderate' && 'Normal (22h-00h)'}
                      {profile.lifestyle.bedtime === 'late' && 'Tarde (depois 00h)'}
                      {!profile.lifestyle.bedtime && '-'}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Acordar</p>
                    <p className="font-medium">
                      {profile.lifestyle.wakeupTime === 'early' && 'Cedo (antes 7h)'}
                      {profile.lifestyle.wakeupTime === 'moderate' && 'Normal (7h-9h)'}
                      {profile.lifestyle.wakeupTime === 'late' && 'Tarde (depois 9h)'}
                      {!profile.lifestyle.wakeupTime && '-'}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Personalidade</p>
                    <p className="font-medium capitalize">{profile.lifestyle.personality || '-'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-semibold text-foreground">Hábitos</h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Badge variant={profile.lifestyle.smoking ? 'warning' : 'success'}>
                    {profile.lifestyle.smoking ? 'Fumador' : 'Não fumador'}
                  </Badge>

                  <Badge variant={profile.lifestyle.pets ? 'default' : 'outline'}>
                    {profile.lifestyle.pets ? 'Tem animais' : 'Sem animais'}
                  </Badge>

                  <Badge variant="outline">
                    Cozinha: {profile.lifestyle.cooking || '-'}
                  </Badge>

                  <Badge variant="outline">
                    Limpeza: {profile.lifestyle.cleanliness || '-'}/5
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'preferences' && (
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Home className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl font-bold">Preferências de alojamento</h3>
              </div>

              <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsPreferencesModalOpen(true)}>
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Orçamento máximo</p>
                <p className="text-foreground text-xl font-bold">
                  {profile.preferences.maxBudget ? `€${profile.preferences.maxBudget}/mês` : '-'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Tipo de quarto</p>
                <p className="text-foreground capitalize">{profile.preferences.roomType || '-'}</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">Cidades preferenciais</p>
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.preferredCities && profile.preferences.preferredCities.length > 0 ? (
                    profile.preferences.preferredCities.map((city, index) => (
                      <Badge key={index} variant="default">
                        <MapPin className="w-3 h-3 mr-1" />
                        {city}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-foreground">-</p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">Comodidades desejadas</p>
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.amenities?.furnished && <Badge variant="outline">Mobilado</Badge>}
                  {profile.preferences.amenities?.wifi && <Badge variant="outline">WiFi</Badge>}
                  {profile.preferences.amenities?.kitchen && <Badge variant="outline">Cozinha</Badge>}
                  {profile.preferences.amenities?.washingMachine && <Badge variant="outline">Máquina de lavar</Badge>}
                  {profile.preferences.amenities?.balcony && <Badge variant="outline">Varanda</Badge>}
                  {profile.preferences.amenities?.parking && <Badge variant="outline">Estacionamento</Badge>}
                  {!Object.values(profile.preferences.amenities || {}).some(value => value) && (
                    <p className="text-foreground">-</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {profile && (
          <>
            <PersonalEditModal
              isOpen={isPersonalModalOpen}
              onClose={() => setIsPersonalModalOpen(false)}
              profile={profile.personal}
              onSave={handleSavePersonal}
            />

            <LifestyleEditModal
              isOpen={isLifestyleModalOpen}
              onClose={() => setIsLifestyleModalOpen(false)}
              profile={profile.lifestyle}
              onSave={handleSaveLifestyle}
            />

            <PreferencesEditModal
              isOpen={isPreferencesModalOpen}
              onClose={() => setIsPreferencesModalOpen(false)}
              profile={profile.preferences}
              onSave={handleSavePreferences}
            />
          </>
        )}
      </div>
    </div>
  );
}
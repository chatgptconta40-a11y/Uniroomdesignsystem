import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Bath,
  Calendar,
  Check,
  DoorOpen,
  Euro,
  Home,
  MapPin,
  ShieldCheck,
  Users,
  Sparkles,
  Moon,
  PartyPopper,
  Cigarette,
  PawPrint,
  HeartHandshake,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LocationMap } from '../components/LocationMap';
import { RoomCard } from '../components/RoomCard';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { useStudentProfile } from '../hooks/useDb';
import { getPersonalizedCompatibility } from '../utils/profileCompatibility';

function getScoreTone(score: number) {
  if (score >= 85) {
    return {
      text: 'Excelente compatibilidade',
      color: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
      bar: 'bg-green-500',
    };
  }

  if (score >= 70) {
    return {
      text: 'Boa compatibilidade',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      bar: 'bg-blue-500',
    };
  }

  if (score >= 55) {
    return {
      text: 'Compatibilidade moderada',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      bar: 'bg-amber-500',
    };
  }

  return {
    text: 'Compatibilidade baixa',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    bar: 'bg-red-500',
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return clampScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getProperty, getRoomsByProperty } = useProperties();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const property = getProperty(id || '');
  const rooms = property ? getRoomsByProperty(property.id) : [];
  const publicRooms = rooms.filter(room => room.status !== 'draft');
  const availableRooms = publicRooms.filter(room => room.status === 'available');

  const { profile: studentProfile, loading: profileLoading } = useStudentProfile(user?.id);

  const priceSummary = useMemo(() => {
    const prices = availableRooms.map(room => room.price);
    if (prices.length === 0) return null;

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [availableRooms]);

  const compatibilityItems = useMemo(() => {
    if (profileLoading || !studentProfile || !property) return [];

    return availableRooms
      .map(room => getPersonalizedCompatibility(studentProfile, room, property))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [availableRooms, property, studentProfile, profileLoading]);

  const houseCompatibility = useMemo(() => {
    if (compatibilityItems.length === 0) return null;

    return {
      overall: average(compatibilityItems.map(item => item.overall)),
      categories: {
        schedule: average(compatibilityItems.map(item => item.categories.schedule)),
        cleanliness: average(compatibilityItems.map(item => item.categories.cleanliness)),
        noise: average(compatibilityItems.map(item => item.categories.noise)),
        habits: average(compatibilityItems.map(item => item.categories.habits)),
        guests: average(compatibilityItems.map(item => item.categories.guests)),
        social: average(compatibilityItems.map(item => item.categories.social)),
        budget: average(compatibilityItems.map(item => item.categories.budget)),
        location: average(compatibilityItems.map(item => item.categories.location)),
        rules: average(compatibilityItems.map(item => item.categories.rules)),
      },
    };
  }, [compatibilityItems]);

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Casa não encontrada</h1>
          <p className="text-muted-foreground mb-5">Esta página pode ter sido removida ou arquivada.</p>
          <Button onClick={() => navigate('/search')}>Voltar à pesquisa</Button>
        </Card>
      </div>
    );
  }

  const coverImage = property.images[selectedImageIndex] || property.images[0];
  const compatibilityTone = houseCompatibility ? getScoreTone(houseCompatibility.overall) : null;

  const amenities = [
    { enabled: property.amenities.wifi, label: 'Wi-Fi' },
    { enabled: property.amenities.kitchen, label: 'Cozinha equipada' },
    { enabled: property.amenities.livingRoom, label: 'Sala comum' },
    { enabled: property.amenities.laundry, label: 'Lavandaria' },
    { enabled: property.amenities.parking, label: 'Estacionamento' },
    { enabled: property.amenities.heating, label: 'Aquecimento' },
    { enabled: property.amenities.airConditioning, label: 'Ar condicionado' },
    { enabled: property.amenities.elevator, label: 'Elevador' },
    { enabled: property.amenities.backyard, label: 'Jardim/terraço' },
    { enabled: property.amenities.dishwasher, label: 'Máquina de lavar loiça' },
  ].filter(item => item.enabled);

  const houseAtmosphere = [
    {
      icon: Moon,
      label: property.houseRules?.quietHours ? `Silêncio ${property.houseRules.quietHours}` : 'Rotina flexível',
      detail: property.houseRules?.quietHours ? 'Boa opção para estudar e descansar.' : 'Confirma o ambiente com o senhorio.',
      tone: property.houseRules?.quietHours ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-muted-foreground bg-muted/50 border-border',
    },
    {
      icon: PartyPopper,
      label: property.houseRules?.parties === false ? 'Sem festas' : 'Festas a confirmar',
      detail: property.houseRules?.parties === false ? 'Ambiente mais calmo e previsível.' : 'Pode ser uma casa mais social.',
      tone: property.houseRules?.parties === false ? 'text-green-700 bg-green-50 border-green-100' : 'text-amber-700 bg-amber-50 border-amber-100',
    },
    {
      icon: Cigarette,
      label: property.houseRules?.smoking ? 'Fumar permitido' : 'Não fumadores',
      detail: property.houseRules?.smoking ? 'Confirma as zonas permitidas.' : 'Mais adequado para quem prefere ar limpo.',
      tone: property.houseRules?.smoking ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-green-700 bg-green-50 border-green-100',
    },
    {
      icon: PawPrint,
      label: property.houseRules?.pets ? 'Animais permitidos' : 'Sem animais',
      detail: property.houseRules?.pets ? 'Boa opção para quem aceita animais.' : 'Ambiente previsível para alergias ou ruído.',
      tone: property.houseRules?.pets ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-muted-foreground bg-muted/50 border-border',
    },
  ];

  const compatibilityRows = houseCompatibility
    ? [
        { label: 'Rotina', score: houseCompatibility.categories.schedule },
        { label: 'Limpeza', score: houseCompatibility.categories.cleanliness },
        { label: 'Ruído', score: houseCompatibility.categories.noise },
        { label: 'Hábitos', score: houseCompatibility.categories.habits },
        { label: 'Visitas', score: houseCompatibility.categories.guests },
        { label: 'Social', score: houseCompatibility.categories.social },
        { label: 'Orçamento', score: houseCompatibility.categories.budget },
        { label: 'Regras', score: houseCompatibility.categories.rules },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-5 md:px-6 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-5 md:px-6 py-6 space-y-6">
        {/* HERO */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.28fr_0.72fr] gap-5">
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl bg-muted shadow-sm border border-border">
              <img
                src={coverImage}
                alt={property.title}
                className="h-[390px] w-full object-cover"
              />

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <Badge className="bg-white/95 text-primary border border-white shadow-sm">
                  <Home className="w-3.5 h-3.5 mr-1" />
                  Casa
                </Badge>

                {property.verified && (
                  <Badge variant="success" className="shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Verificada
                  </Badge>
                )}

                {houseCompatibility && compatibilityTone && (
                  <Badge className={`shadow-sm border ${compatibilityTone.bg} ${compatibilityTone.border} ${compatibilityTone.color}`}>
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    {houseCompatibility.overall}% compatível
                  </Badge>
                )}
              </div>
            </div>

            {property.images.length > 1 && (
              <div className="grid grid-cols-5 md:grid-cols-6 gap-2">
                {property.images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-16 overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-border'
                    }`}
                  >
                    <img src={image} alt={`${property.title} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <Card className="p-5">
              <div className="mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">{property.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{property.zone}, {property.city}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-primary/5 border border-primary/15 p-4">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <DoorOpen className="w-4 h-4" />
                    <span className="text-xs font-semibold">Quartos</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{property.totalRooms}</p>
                  <p className="text-xs text-muted-foreground">{availableRooms.length} disponíveis</p>
                </div>

                <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-1">
                    <Euro className="w-4 h-4" />
                    <span className="text-xs font-semibold">Preço desde</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {priceSummary ? `€${priceSummary.min}` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {priceSummary && priceSummary.min !== priceSummary.max ? `até €${priceSummary.max}/mês` : 'por mês'}
                  </p>
                </div>
              </div>

              {houseCompatibility && compatibilityTone ? (
                <div className={`mb-4 rounded-xl border p-4 ${compatibilityTone.bg} ${compatibilityTone.border}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${compatibilityTone.color}`}>
                        Compatibilidade com a casa
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Média dos quartos disponíveis.
                      </p>
                    </div>
                    <div className={`text-3xl font-bold ${compatibilityTone.color}`}>
                      {houseCompatibility.overall}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-950">Compatibilidade personalizada</p>
                      <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                        Cria conta e completa o perfil para veres se esta casa combina contigo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                className="w-full"
                onClick={() => document.getElementById('quartos-disponiveis')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver quartos disponíveis
              </Button>
            </Card>

            <Card className="p-5">
              <h2 className="font-bold text-foreground mb-4">Resumo da casa</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Capacidade
                  </span>
                  <span className="font-semibold">{property.totalRooms} quartos</span>
                </div>

                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Estado
                  </span>
                  <span className="font-semibold">{property.status === 'active' ? 'Ativa' : 'Indisponível'}</span>
                </div>

                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Distância
                  </span>
                  <span className="font-semibold">{property.distanceToUniversity} km</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Verificação
                  </span>
                  <span className="font-semibold">{property.verified ? 'Verificada' : 'Por confirmar'}</span>
                </div>
              </div>
            </Card>
          </aside>
        </section>

        {/* MASONRY / TWO INDEPENDENT COLUMNS */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-5 items-start">
          <div className="space-y-5">
            <Card className="p-5">
              <h2 className="text-xl font-bold text-foreground mb-3">Sobre esta casa</h2>
              <p className="text-muted-foreground leading-relaxed">{property.description}</p>
            </Card>

            {houseCompatibility && compatibilityTone && (
              <Card className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Compatibilidade com esta casa</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Convivência, regras, orçamento e preferências do teu perfil.
                    </p>
                  </div>

                  <div className={`rounded-2xl border px-5 py-3 text-center ${compatibilityTone.bg} ${compatibilityTone.border}`}>
                    <p className={`text-3xl font-bold ${compatibilityTone.color}`}>{houseCompatibility.overall}%</p>
                    <p className={`text-xs font-semibold ${compatibilityTone.color}`}>{compatibilityTone.text}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {compatibilityRows.map(row => {
                    const tone = getScoreTone(row.score);

                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">{row.label}</span>
                          <span className="text-sm font-semibold text-foreground">{row.score}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${row.score}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <HeartHandshake className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Ambiente da casa</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-5">
                Percebe se a rotina da casa combina com o teu estilo de vida.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {houseAtmosphere.map(item => (
                  <div key={item.label} className={`rounded-xl border p-4 ${item.tone}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="w-4 h-4" />
                      <p className="font-semibold text-sm">{item.label}</p>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-xl font-bold text-foreground mb-4">Comodidades</h2>
              {amenities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {amenities.map(item => (
                    <div key={item.label} className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ainda não foram indicadas comodidades para esta casa.</p>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="p-5">
              <h2 className="text-xl font-bold text-foreground mb-4">Localização</h2>
              <LocationMap address={property.address} zone={property.zone} city={property.city} />
            </Card>

            <Card className="p-5 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/15">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Confiança</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Anúncio</span>
                  <span className="font-semibold">{property.verified ? 'Verificado' : 'Em validação'}</span>
                </div>

                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Estado</span>
                  <span className="font-semibold">{property.status === 'active' ? 'Ativo' : 'Indisponível'}</span>
                </div>

                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Disponibilidade</span>
                  <span className="font-semibold">{availableRooms.length} quarto{availableRooms.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Qualidade dos dados</span>
                  <span className="font-semibold">{amenities.length >= 4 && property.description ? 'Boa' : 'A melhorar'}</span>
                </div>
              </div>
            </Card>

            {property.houseRules && (
              <Card className="p-5">
                <h2 className="text-xl font-bold text-foreground mb-4">Regras da casa</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm text-muted-foreground">Fumar</span>
                    <span className="text-sm font-semibold">{property.houseRules.smoking ? 'Permitido' : 'Não permitido'}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm text-muted-foreground">Animais</span>
                    <span className="text-sm font-semibold">{property.houseRules.pets ? 'Permitidos' : 'Não permitidos'}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm text-muted-foreground">Festas</span>
                    <span className="text-sm font-semibold">{property.houseRules.parties ? 'Permitidas' : 'Não permitidas'}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm text-muted-foreground">Apenas estudantes</span>
                    <span className="text-sm font-semibold">{property.houseRules.studentsOnly ? 'Sim' : 'Não obrigatório'}</span>
                  </div>

                  {property.houseRules.quietHours && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">Silêncio</span>
                      <span className="text-sm font-semibold">{property.houseRules.quietHours}</span>
                    </div>
                  )}

                  {property.houseRules.cleaningPolicy && (
                    <div className="sm:col-span-2 rounded-lg bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">Limpeza</span>
                      <p className="text-sm font-semibold mt-1">{property.houseRules.cleaningPolicy}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card className="p-5 border-amber-200 bg-amber-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-950 mb-1">Antes de escolher</h3>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Confirma regras, despesas incluídas e disponibilidade do quarto antes de te candidatares.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="quartos-disponiveis" className="space-y-4 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Quartos desta casa</h2>
              </div>
              <p className="text-muted-foreground">
                Escolhe o quarto que melhor combina contigo dentro desta casa. A compatibilidade junta casa + quarto.
              </p>
            </div>

            <Badge variant="default" className="w-fit bg-primary/10 text-primary border-primary/20">
              {availableRooms.length} disponível{availableRooms.length !== 1 ? 'eis' : ''}
            </Badge>
          </div>

          {publicRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {publicRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  property={property}
                  studentProfile={profileLoading ? null : studentProfile}
                  variant="public"
                  showFavorite={!!user && (user.type === 'student' || user.type === 'landlord')}
                  showPropertyContext={false}
                  availableRooms={availableRooms.length}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <DoorOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground">Ainda não há quartos publicados nesta casa.</p>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}

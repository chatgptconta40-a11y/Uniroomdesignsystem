import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Bath,
  Calendar,
  Check,
  DoorOpen,
  Euro,
  Home,
  Images,
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
  Navigation,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ESTGVRouteSection } from '../components/ESTGVRouteSection';
import { RoomCard } from '../components/RoomCard';
import type { Property } from '../types/property';
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
  const { getProperty, getRoomsByProperty, fetchPropertyDetail } = useProperties();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const lightProperty = getProperty(id || '');
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setDetailLoading(true);
    fetchPropertyDetail(id)
      .then(detail => { if (detail) setDetailProperty(detail); })
      .finally(() => setDetailLoading(false));
  }, [id]);

  const property = detailProperty ?? lightProperty;
  const rooms = property ? getRoomsByProperty(property.id) : [];
  const publicRooms = rooms.filter(room => room.status !== 'draft');
  const availableRooms = publicRooms.filter(room => room.status === 'available');
  const unavailableRooms = publicRooms.filter(room => room.status !== 'available');

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
        {detailLoading ? (
          <Card className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-64 bg-muted rounded-3xl mt-4" />
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Casa não encontrada</h1>
            <p className="text-muted-foreground mb-5">Esta página pode ter sido removida ou arquivada.</p>
            <Button onClick={() => navigate('/search')}>Voltar à pesquisa</Button>
          </Card>
        )}
      </div>
    );
  }

  const images = property.images;
  const heroMain = images[0];
  const heroSecondary = images.slice(1, 5);
  const compatibilityTone = houseCompatibility ? getScoreTone(houseCompatibility.overall) : null;

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => setSelectedImageIndex(prev => (prev + 1) % images.length);
  const prevImage = () => setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length);

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
      {/* Top bar */}
      <div className="sticky top-16 z-30 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm text-muted-foreground truncate">{property.zone}, {property.city}</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-8 space-y-8">
        {/* ============ TITLE ============ */}
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Home className="w-3.5 h-3.5 mr-1" />
              Casa
            </Badge>
            {property.verified && (
              <Badge variant="success">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Verificada
              </Badge>
            )}
            {houseCompatibility && compatibilityTone && (
              <Badge className={`border ${compatibilityTone.bg} ${compatibilityTone.border} ${compatibilityTone.color}`}>
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {houseCompatibility.overall}% compatível
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight">
            {property.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              {property.zone}, {property.city}
            </span>
            <span className="flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-primary" />
              {property.distanceToUniversity} km da universidade
            </span>
            <span className="flex items-center gap-1.5">
              <DoorOpen className="w-4 h-4 text-primary" />
              {property.totalRooms} quartos · {availableRooms.length} disponíveis
            </span>
          </div>
        </header>

        {/* ============ GALLERY (Airbnb-style mosaic) ============ */}
        <section>
          {images.length > 0 ? (
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 md:gap-3 rounded-3xl overflow-hidden">
                {/* Main image */}
                <button
                  type="button"
                  onClick={() => openLightbox(0)}
                  className="relative md:col-span-2 md:row-span-2 group overflow-hidden bg-muted"
                >
                  <img
                    src={heroMain}
                    alt={property.title}
                    className="h-[260px] sm:h-[360px] md:h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>

                {/* Secondary images — only desktop */}
                {heroSecondary.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => openLightbox(index + 1)}
                    className="relative hidden md:block group overflow-hidden bg-muted"
                  >
                    <img
                      src={image}
                      alt={`${property.title} ${index + 2}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </button>
                ))}

                {/* Filler placeholders to keep mosaic complete on desktop */}
                {Array.from({ length: Math.max(0, 4 - heroSecondary.length) }).map((_, i) => (
                  <div key={`filler-${i}`} className="hidden md:block bg-muted" />
                ))}
              </div>

              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => openLightbox(0)}
                  className="absolute bottom-3 right-3 md:bottom-4 md:right-4 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-4 py-2 text-sm font-semibold text-foreground shadow-md border border-border hover:bg-white transition-colors"
                >
                  <Images className="w-4 h-4" />
                  Ver todas as fotos ({images.length})
                </button>
              )}
            </div>
          ) : detailLoading ? (
            <div className="h-64 md:h-[360px] rounded-3xl bg-muted animate-pulse" />
          ) : (
            <div className="h-64 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground">
              Sem fotos disponíveis
            </div>
          )}
        </section>

        {/* ============ TWO-COL: CONTENT + STICKY SIDEBAR ============ */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          {/* ----- LEFT CONTENT ----- */}
          <div className="space-y-6 min-w-0">
            {/* RESUMO em pílulas */}
            <Card className="p-5">
              <h2 className="font-bold text-foreground mb-4">Resumo da casa</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <DoorOpen className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                  <p className="font-bold text-foreground">{property.totalRooms}</p>
                  <p className="text-xs text-muted-foreground">Quartos</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                  <p className="font-bold text-foreground">{availableRooms.length}</p>
                  <p className="text-xs text-muted-foreground">Disponíveis</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <Navigation className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                  <p className="font-bold text-foreground">{property.distanceToUniversity}<span className="text-xs font-normal"> km</span></p>
                  <p className="text-xs text-muted-foreground">Universidade</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <ShieldCheck className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                  <p className="font-bold text-foreground">{property.verified ? 'Sim' : '—'}</p>
                  <p className="text-xs text-muted-foreground">Verificada</p>
                </div>
              </div>
            </Card>

            {/* Descrição */}
            <Card className="p-5 md:p-6">
              <h2 className="text-xl font-bold text-foreground mb-3">Sobre esta casa</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{property.description}</p>
            </Card>

            {/* Compatibilidade */}
            {houseCompatibility && compatibilityTone && (
              <Card className="p-5 md:p-6">
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

            {/* Ambiente */}
            <Card className="p-5 md:p-6">
              <div className="flex items-center gap-2 mb-3">
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

            {/* Comodidades */}
            <Card className="p-5 md:p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Comodidades</h2>
              {amenities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {amenities.map(item => (
                    <div key={item.label} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ainda não foram indicadas comodidades para esta casa.</p>
              )}
            </Card>

            {/* Regras da casa */}
            {property.houseRules && (
              <Card className="p-5 md:p-6">
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

            {/* Localização e percurso até à ESTGV */}
            <Card className="p-5 md:p-6">
              <ESTGVRouteSection property={property} />
            </Card>
          </div>

          {/* ----- RIGHT STICKY SIDEBAR ----- */}
          <aside className="lg:sticky lg:top-32 space-y-4">
            <Card className="p-5 shadow-sm border-border/80">
              {/* Price */}
              <div className="pb-4 border-b border-border">
                {priceSummary ? (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-foreground">€{priceSummary.min}</span>
                      <span className="text-sm text-muted-foreground">/ mês</span>
                    </div>
                    {priceSummary.min !== priceSummary.max && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Quartos desde €{priceSummary.min} até €{priceSummary.max}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem quartos disponíveis no momento.</p>
                )}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="text-center rounded-lg bg-primary/5 border border-primary/15 p-3">
                  <DoorOpen className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold text-foreground">{availableRooms.length}</p>
                  <p className="text-[11px] text-muted-foreground">disponíveis</p>
                </div>
                <div className="text-center rounded-lg bg-green-50 border border-green-100 p-3">
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-green-700" />
                  <p className="text-lg font-bold text-foreground">{property.status === 'active' ? 'Ativa' : '—'}</p>
                  <p className="text-[11px] text-muted-foreground">listagem</p>
                </div>
              </div>

              {/* Compatibility highlight */}
              {houseCompatibility && compatibilityTone ? (
                <div className={`rounded-xl border p-3.5 mb-4 ${compatibilityTone.bg} ${compatibilityTone.border}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold uppercase tracking-wide ${compatibilityTone.color}`}>
                        Compatibilidade
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {compatibilityTone.text}
                      </p>
                    </div>
                    <div className={`text-2xl font-bold ${compatibilityTone.color} flex-shrink-0`}>
                      {houseCompatibility.overall}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 mb-4">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900 leading-relaxed">
                      Cria conta e completa o perfil para veres se esta casa combina contigo.
                    </p>
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => document.getElementById('quartos-disponiveis')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Ver quartos disponíveis
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => document.getElementById('localizacao')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Ver localização
                </Button>
              </div>
            </Card>

            {/* Confiança */}
            <Card className="p-5 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/15">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm">Confiança</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Anúncio</span>
                  <span className="font-semibold">{property.verified ? 'Verificado' : 'Em validação'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <span className="font-semibold">{property.status === 'active' ? 'Ativo' : 'Indisponível'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Qualidade dos dados</span>
                  <span className="font-semibold">{amenities.length >= 4 && property.description ? 'Boa' : 'A melhorar'}</span>
                </div>
              </div>
            </Card>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  Confirma regras, despesas incluídas e disponibilidade do quarto antes de te candidatares.
                </p>
              </div>
            </div>
          </aside>
        </section>

        {/* ============ QUARTOS ============ */}
        <section id="quartos-disponiveis" className="space-y-5 scroll-mt-32 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Quartos desta casa</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                Escolhe o quarto que melhor combina contigo. A compatibilidade junta casa + quarto.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-green-50 text-green-700 border-green-200">
                {availableRooms.length} disponível{availableRooms.length !== 1 ? 'eis' : ''}
              </Badge>
              {unavailableRooms.length > 0 && (
                <Badge className="bg-muted text-muted-foreground border-border">
                  {unavailableRooms.length} indisponível{unavailableRooms.length !== 1 ? 'eis' : ''}
                </Badge>
              )}
            </div>
          </div>

          {publicRooms.length > 0 ? (
            <>
              {availableRooms.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Disponíveis agora
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                    {availableRooms.map(room => (
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
                </div>
              )}

              {unavailableRooms.length > 0 && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Outros quartos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 opacity-75">
                    {unavailableRooms.map(room => (
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
                </div>
              )}
            </>
          ) : (
            <Card className="p-10 text-center">
              <DoorOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground">Ainda não há quartos publicados nesta casa.</p>
            </Card>
          )}
        </section>
      </main>

      {/* ============ LIGHTBOX ============ */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Seguinte"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <img
            src={images[selectedImageIndex]}
            alt={`${property.title} ${selectedImageIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-white/10 px-3 py-1 rounded-full">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}

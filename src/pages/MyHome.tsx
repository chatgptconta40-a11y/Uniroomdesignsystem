import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Bath,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Flame,
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Users,
  Wifi,
  Wrench,
  ArrowRight,
  Sparkles,
  KeyRound,
  ChevronRight,
  Star,
  Activity,
  BedDouble,
  Coffee,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { MaintenanceModal } from '../components/MaintenanceModal';
import { StartConversationModal } from '../components/StartConversationModal';
import { useMaintenance } from '../hooks/useDb';
import { formatCurrency } from '../utils/format';
import { supabase } from '../lib/supabase';
import { Accommodation, ActiveHome } from '../types/accommodation';
import { MaintenanceRequest, maintenanceCategoryLabels, maintenanceStatusLabels, maintenanceUrgencyLabels } from '../types/maintenance';
import { toast } from 'sonner';

interface RealHousemate {
  id: string;
  propertyId: string;
  name: string;
  course: string;
  room: string;
  initials: string;
  since: string;
  avatarUrl?: string;
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function formatShortDate(date: Date | string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date));
}

function getDaysSince(date: Date | string) {
  return Math.max(
    0,
    Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'E';
}

function dbRowToActiveHome(row: any): ActiveHome {
  return {
    id: row.id,
    studentId: row.student_id,
    propertyId: row.property_id,
    roomId: row.room_id || '',
    applicationId: row.application_id || '',
    landlordId: row.landlord_id,
    landlordName: '',
    moveInDate: row.move_in_date ? new Date(row.move_in_date) : new Date(),
    contractEndDate: new Date(0),
    paymentDay: 1,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  };
}

export function MyHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getProperty, getRoom, refreshProperties } = useProperties();

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const { requests: maintenanceRequests, refresh: refreshMaintenanceRequests } = useMaintenance({ scope: 'student' });
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);

  const [activeHomeRow, setActiveHomeRow] = useState<ActiveHome | null>(null);

  const [acceptedAppRow, setAcceptedAppRow] = useState<{
    id: string;
    userId: string;
    landlordId: string;
    propertyId: string;
    roomId?: string;
    status: string;
    moveInDate?: string | null;
  } | null>(null);
  const [housemates, setHousemates] = useState<RealHousemate[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setActiveHomeRow(null);
      setAcceptedAppRow(null);
      setHomeLoading(false);
      return;
    }
    (async () => {
      setHomeLoading(true);
      const { data, error } = await supabase
        .from('active_homes')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error('[MY_HOME] fetch active_homes failed', error);
        toast.error('Não foi possível carregar a tua casa ativa.', { description: error.message });
        setActiveHomeRow(null);
      } else {
        setActiveHomeRow(data ? dbRowToActiveHome(data) : null);
      }

      if (!data) {
        const { data: accepted, error: accErr } = await supabase
          .from('applications')
          .select('id,user_id,landlord_id,property_id,room_id,status,move_in_date')
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(1);
        if (cancelled) return;
        if (accErr) {
          console.error('[MY_HOME] fetch accepted application failed', accErr);
        }
        const row = accepted?.[0];
        setAcceptedAppRow(
          row
            ? {
                id: row.id,
                userId: row.user_id,
                landlordId: row.landlord_id,
                propertyId: row.property_id,
                roomId: row.room_id || undefined,
                status: row.status,
                moveInDate: row.move_in_date,
              }
            : null,
        );
      } else {
        setAcceptedAppRow(null);
      }
      setHomeLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, homeRefreshKey]);

  useEffect(() => {
    let cancelled = false;
    if (!activeHomeRow || !user) {
      setHousemates([]);
      return;
    }
    (async () => {
      const { data: homesData, error: homesError } = await supabase
        .from('active_homes')
        .select('id,student_id,room_id,move_in_date')
        .eq('property_id', activeHomeRow.propertyId)
        .neq('student_id', user.id);
      if (cancelled || homesError || !homesData || homesData.length === 0) {
        if (homesError) console.error('[MY_HOME] fetch housemates failed', homesError);
        setHousemates([]);
        return;
      }

      const studentIds = homesData.map(r => r.student_id).filter(Boolean);

      const [profilesResult, personalResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id,full_name,avatar_url')
          .in('id', studentIds),
        supabase
          .from('personal_profiles')
          .select('user_id,course,institution')
          .in('user_id', studentIds),
      ]);
      if (cancelled) return;

      const profileMap = new Map(
        (profilesResult.data ?? []).map(p => [p.id, p]),
      );
      const personalMap = new Map(
        (personalResult.data ?? []).map(p => [p.user_id, p]),
      );

      setHousemates(
        homesData.map(row => {
          const moveIn = row.move_in_date ? new Date(row.move_in_date) : new Date();
          const since = Number.isNaN(moveIn.getTime())
            ? 'Data não definida'
            : new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(moveIn);
          const r = row.room_id ? getRoom(row.room_id) : undefined;
          const profile = profileMap.get(row.student_id);
          const personal = personalMap.get(row.student_id);
          const name = profile?.full_name || 'Estudante confirmado';
          const course = [personal?.course, personal?.institution].filter(Boolean).join(' · ') || 'Estudante';
          return {
            id: `mate_${row.id}`,
            propertyId: activeHomeRow.propertyId,
            name,
            course,
            room: r?.roomNumber || r?.title || 'Quarto',
            initials: getInitials(name),
            since,
            avatarUrl: profile?.avatar_url ?? undefined,
          };
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [activeHomeRow?.id, user?.id, getRoom]);

  const activeHome = useMemo(() => {
    if (!activeHomeRow) return null;
    if (!user || (user.type !== 'student' && user.type !== 'landlord')) return null;

    const activeHomeData = activeHomeRow;
    const property = getProperty(activeHomeData.propertyId);
    const room = getRoom(activeHomeData.roomId);

    if (!property || !room || room.propertyId !== property.id) {
      return null;
    }

    const accommodation: Accommodation = {
      id: room.id,
      title: room.title,
      description: room.description,
      city: property.city,
      zone: property.zone,
      address: property.address,
      price: room.price,
      images: [...room.images, ...property.images],
      landlordId: property.landlordId,
      roomType: room.roomType,
      currentOccupants: room.occupiedBy ? 1 : 0,
      maxOccupants: room.maxOccupants,
      coordinates: property.coordinates || { lat: 40.6582, lng: -7.9138 },
      distanceToUniversity: property.distanceToUniversity,
      universityName: 'Instituto Politécnico de Viseu',
      amenities: {
        furnished: true,
        wifi: property.amenities.wifi,
        utilitiesIncluded: false,
        kitchen: property.amenities.kitchen,
        washingMachine: property.amenities.laundry,
        balcony: room.balcony,
        parking: property.amenities.parking,
        airConditioning: room.airConditioning || property.amenities.airConditioning,
        heating: property.amenities.heating,
        elevator: property.amenities.elevator,
      },
      utilities: room.utilities,
      availableFrom: room.availableFrom,
      minimumStay: room.minimumStay,
      status: 'active',
      verified: property.verified,
      compatibilityScore: room.compatibilityScore,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      views: room.views,
    };

    return {
      property,
      room,
      accommodation,
      activeHomeData,
    };
  }, [activeHomeRow, user?.id, user?.type, getProperty, getRoom]);

  useEffect(() => {
    refreshProperties();
  }, [user?.id, refreshProperties]);

  if (!activeHome) {
    if (homeLoading) {
      return (
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 animate-pulse">
            <div className="h-10 w-64 bg-muted/60 rounded-lg" />
            <div className="h-72 bg-muted/40 rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted/40 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-muted/30 rounded-2xl" />
              <div className="h-96 bg-muted/30 rounded-2xl" />
            </div>
          </div>
        </div>
      );
    }
    const acceptedApp = acceptedAppRow;
    const acceptedRoom = acceptedApp?.roomId ? getRoom(acceptedApp.roomId) : undefined;
    const acceptedProperty = acceptedApp?.propertyId ? getProperty(acceptedApp.propertyId) : undefined;

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-16">
          {acceptedApp ? (
            <Card className="overflow-hidden">
              {acceptedRoom && acceptedProperty && (
                <div className="relative h-48 bg-muted">
                  <img
                    src={acceptedRoom.images[0] || acceptedProperty.images[0]}
                    alt={acceptedRoom.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-semibold">{acceptedRoom.title}</p>
                    <p className="text-sm text-white/80">
                      {acceptedProperty.address}, {acceptedProperty.city}
                    </p>
                  </div>
                </div>
              )}

              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Candidatura aceite!</h2>
                <p className="text-muted-foreground mb-2 max-w-sm mx-auto">
                  O senhorio aceitou a tua candidatura
                  {acceptedRoom ? ` para ${acceptedRoom.title}` : ' para este quarto'}.
                  Confirma a estadia para ativar a tua casa.
                </p>

                {acceptedApp.moveInDate && (
                  <p className="text-sm text-primary font-medium mb-6">
                    Entrada prevista:{' '}
                    {new Date(acceptedApp.moveInDate).toLocaleDateString('pt-PT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/applications')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <HomeIcon className="w-4 h-4 mr-2" />
                    Confirmar estadia
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/applications')}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Ver candidaturas
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <HomeIcon className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Ainda não tens uma casa ativa</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Quando uma candidatura for aceite e confirmares a estadia, esta página passa a mostrar
                todas as informações do teu alojamento.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                <Link to="/search">
                  <Button variant="primary">Procurar alojamento</Button>
                </Link>
                <Link to="/applications">
                  <Button variant="outline">Ver candidaturas</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  const { property, room, accommodation, activeHomeData } = activeHome;
  const monthlyRent = activeHomeData.monthlyRent ?? room.price;
  const utilitiesAmount = activeHomeData.utilities ?? room.utilities ?? 0;
  const monthlyTotal = monthlyRent + utilitiesAmount;
  const daysInHome = getDaysSince(activeHomeData.moveInDate);
  const galleryImages = [...property.images, ...room.images].filter(Boolean).slice(0, 5);
  const heroImage = galleryImages[activeImageIdx] || galleryImages[0] || '';

  const visibleMaintenanceRequests = maintenanceRequests.filter(request =>
    request.roomId === room.id ||
    request.roomId === accommodation.id ||
    request.landlordId === property.landlordId,
  );

  const pendingRequests = visibleMaintenanceRequests.filter(request => request.status === 'pending').length;
  const inProgressRequests = visibleMaintenanceRequests.filter(request => request.status === 'in_progress').length;
  const resolvedRequests = visibleMaintenanceRequests.filter(request => request.status === 'resolved' || request.status === 'closed').length;
  const urgentRequests = visibleMaintenanceRequests.filter(
    request => request.urgency === 'high' && request.status !== 'resolved' && request.status !== 'closed',
  ).length;
  const openMaintenance = pendingRequests + inProgressRequests;

  const amenities = [
    { label: 'WiFi', value: property.amenities.wifi ? 'Incluído' : 'Não incluído', icon: Wifi },
    { label: 'Aquecimento', value: property.amenities.heating ? 'Disponível' : 'Não disponível', icon: Flame },
    { label: 'Casa de banho', value: room.privateBathroom ? 'Privativa' : 'Partilhada', icon: Bath },
    { label: 'Moradores', value: `${housemates.length + 1} pessoas`, icon: Users },
  ];

  const rules = [
    property.houseRules?.smoking ? 'Fumar permitido apenas nas zonas indicadas' : 'Não é permitido fumar dentro de casa',
    property.houseRules?.pets ? 'Animais permitidos mediante aviso prévio' : 'Animais não permitidos',
    property.houseRules?.parties ? 'Eventos permitidos com acordo dos moradores' : 'Festas não permitidas',
    `Horas de silêncio: ${property.houseRules?.quietHours || '22:00 - 08:00'}`,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-7">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
                </span>
                <span className="text-xs font-semibold text-secondary uppercase tracking-wide">Casa ativa</span>
              </div>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">Há {daysInHome} dia{daysInHome === 1 ? '' : 's'} contigo</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">A Minha Casa</h1>
            <p className="text-muted-foreground mt-1.5 max-w-xl">
              Tudo sobre a tua estadia em <span className="font-semibold text-foreground">{property.title}</span> — colegas, casa e pedidos de manutenção.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button variant="outline" onClick={() => setShowContactModal(true)} className="shadow-sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contactar senhorio
            </Button>
            <Button variant="primary" onClick={() => setShowMaintenanceModal(true)} className="shadow-sm">
              <Wrench className="w-4 h-4 mr-2" />
              Reportar problema
            </Button>
          </div>
        </div>

        <Card className="p-0 mb-6 overflow-hidden border-border/60 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
            <div className="relative min-h-[340px] bg-muted">
              {heroImage && (
                <img
                  src={heroImage}
                  alt={property.title}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

              <div className="absolute top-5 left-5 right-5 flex items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-foreground text-xs font-semibold shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                    Verificado
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur text-white border border-white/20 text-xs font-medium">
                    <BedDouble className="w-3.5 h-3.5" />
                    {property.totalRooms} quartos
                  </span>
                </div>
              </div>

              <div className="absolute left-6 right-6 bottom-6 text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-sm">{property.title}</h2>
                <p className="text-sm text-white/95 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {property.address} · {property.zone}, {property.city}
                </p>

                {galleryImages.length > 1 && (
                  <div className="mt-4 flex gap-2">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={`${img}-${idx}`}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        aria-label={`Imagem ${idx + 1}`}
                        className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === activeImageIdx
                            ? 'border-white scale-105'
                            : 'border-white/30 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 lg:p-8 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">O teu quarto</p>
                  <h3 className="text-2xl font-bold text-foreground">{room.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {room.roomNumber ? `${room.roomNumber} · ` : ''}{room.size ? `${room.size} m² · ` : ''}
                    {room.privateBathroom ? 'WC privativo' : 'WC partilhado'}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5 text-secondary" />
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/15 p-5 mb-5">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Total mensal</p>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(monthlyTotal)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t border-primary/10">
                  <div>
                    <p className="text-xs text-muted-foreground">Renda</p>
                    <p className="font-semibold text-foreground">{formatCurrency(monthlyRent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Despesas</p>
                    <p className="font-semibold text-foreground">{formatCurrency(utilitiesAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-sm mb-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Entrada
                  </span>
                  <span className="font-semibold text-foreground">{formatDate(activeHomeData.moveInDate)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    À universidade
                  </span>
                  <span className="font-semibold text-foreground">{property.distanceToUniversity} km</span>
                </div>
              </div>

              <Link to={`/room/${room.id}`} className="block mt-auto">
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Ver anúncio original
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: 'Dias na casa', value: daysInHome.toString(), sub: 'desde a entrada', icon: Activity, tone: 'text-primary bg-primary/10' },
            { label: 'Total mensal', value: formatCurrency(monthlyTotal), sub: `${formatCurrency(monthlyRent)} renda`, icon: Sparkles, tone: 'text-accent bg-accent/10' },
            { label: 'Colegas de casa', value: housemates.length.toString(), sub: housemates.length === 0 ? 'à tua espera' : 'confirmados', icon: Users, tone: 'text-secondary bg-secondary/10' },
            { label: 'Pedidos abertos', value: openMaintenance.toString(), sub: urgentRequests > 0 ? `${urgentRequests} urgente${urgentRequests > 1 ? 's' : ''}` : 'tudo em ordem', icon: Wrench, tone: urgentRequests > 0 ? 'text-red-600 bg-red-50' : 'text-muted-foreground bg-muted' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-4 border-border/60 hover:shadow-md hover:border-border transition-all">
                <div className={`w-10 h-10 rounded-xl ${stat.tone} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">{stat.sub}</p>
              </Card>
            );
          })}
        </div>

        <Card className="p-4 mb-6 border-border/60">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {amenities.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="font-semibold text-sm text-foreground truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-border/60">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Casa e comodidades</h3>
                  <p className="text-sm text-muted-foreground">O que esta casa partilhada oferece.</p>
                </div>
                <Badge variant="outline" className="flex-shrink-0">
                  <MapPin className="w-3 h-3 mr-1" />
                  {property.zone}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {[
                  ['Cozinha equipada', property.amenities.kitchen, Coffee],
                  ['Sala comum', property.amenities.livingRoom, HomeIcon],
                  ['Máquina de lavar', property.amenities.laundry, Sparkles],
                  ['Micro-ondas', property.amenities.microwave, Flame],
                  ['Estacionamento', property.amenities.parking, MapPin],
                  ['Elevador', property.amenities.elevator, ArrowRight],
                ].map(([label, enabled, IconCmp]: any) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                      enabled
                        ? 'bg-secondary/5 border-secondary/20'
                        : 'bg-muted/20 border-border/40 opacity-60'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      enabled ? 'bg-secondary/15 text-secondary' : 'bg-muted text-muted-foreground'
                    }`}>
                      <IconCmp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${enabled ? 'text-foreground' : 'text-muted-foreground line-through decoration-1'}`}>
                        {label}
                      </p>
                    </div>
                    {enabled && <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-border/60">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Colegas de casa</h3>
                  <p className="text-sm text-muted-foreground">
                    {housemates.length === 0 ? 'Ainda ninguém confirmado nesta casa' : `${housemates.length} ${housemates.length === 1 ? 'pessoa' : 'pessoas'} a viver contigo`}
                  </p>
                </div>
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {housemates.length + 1}/{property.totalRooms}
                </Badge>
              </div>
              <div className="space-y-3">
                {housemates.length === 0 ? (
                  <div className="p-8 bg-muted/20 border border-dashed border-border rounded-xl text-center">
                    <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">És o primeiro a chegar</h4>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Quando outros estudantes confirmarem estadia, aparecem aqui com a sua informação.
                    </p>
                  </div>
                ) : (
                  housemates.map(housemate => (
                    <div key={housemate.id} className="flex items-center gap-4 p-4 border border-border/60 rounded-xl hover:border-border hover:bg-muted/20 transition-all">
                      {housemate.avatarUrl ? (
                        <img
                          src={housemate.avatarUrl}
                          alt={housemate.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-background"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0 ring-2 ring-background">
                          {housemate.initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h4 className="font-semibold text-foreground truncate">{housemate.name}</h4>
                          <Badge variant="outline" className="text-xs">{housemate.room}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{housemate.course}</p>
                        <p className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Desde {housemate.since}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card className="p-6 border-border/60">
              <h3 className="text-lg font-bold text-foreground mb-1">Regras principais</h3>
              <p className="text-sm text-muted-foreground mb-5">Acordos a respeitar enquanto vives aqui.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {rules.map((rule, idx) => (
                  <div key={rule} className="flex items-start gap-3 p-3.5 bg-muted/30 rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{rule}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Pedidos de manutenção</h2>
                  <p className="text-sm text-muted-foreground">Acompanha problemas reportados no quarto ou na casa.</p>
                </div>
                {visibleMaintenanceRequests.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowMaintenanceModal(true)} className="flex-shrink-0">
                    <Wrench className="w-4 h-4 mr-1.5" />
                    Novo pedido
                  </Button>
                )}
              </div>

              {visibleMaintenanceRequests.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3">
                    <p className="text-2xl font-bold text-amber-700 tabular-nums">{pendingRequests}</p>
                    <p className="text-xs text-amber-700/80 mt-0.5">Pendentes</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-200/60 p-3">
                    <p className="text-2xl font-bold text-blue-700 tabular-nums">{inProgressRequests}</p>
                    <p className="text-xs text-blue-700/80 mt-0.5">Em resolução</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200/60 p-3">
                    <p className="text-2xl font-bold text-emerald-700 tabular-nums">{resolvedRequests}</p>
                    <p className="text-xs text-emerald-700/80 mt-0.5">Resolvidos</p>
                  </div>
                </div>
              )}

              {visibleMaintenanceRequests.length > 0 ? (
                <div className="space-y-3">
                  {visibleMaintenanceRequests.map(request => {
                    const isResolved = request.status === 'resolved' || request.status === 'closed';
                    const dotColor = isResolved
                      ? 'bg-emerald-500'
                      : request.status === 'in_progress'
                      ? 'bg-blue-500'
                      : 'bg-amber-500';
                    return (
                      <div key={request.id} className="relative p-4 border border-border/60 rounded-xl hover:border-primary/30 hover:bg-muted/20 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
                            <span className={`w-2.5 h-2.5 rounded-full ${dotColor} ring-4 ring-background`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <h3 className="font-bold text-foreground">{request.title}</h3>
                              <Badge
                                variant={
                                  isResolved ? 'success' : request.status === 'in_progress' ? 'default' : 'warning'
                                }
                              >
                                {maintenanceStatusLabels[request.status]}
                              </Badge>
                              {request.urgency === 'high' && (
                                <Badge variant="outline" className="text-destructive bg-destructive/10 border-destructive/20">
                                  {maintenanceUrgencyLabels[request.urgency]}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{request.description}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Wrench className="w-3 h-3" />
                                {maintenanceCategoryLabels[request.category]}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Há {getDaysSince(request.createdAt)} dia{getDaysSince(request.createdAt) === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center border border-dashed border-border rounded-xl bg-muted/10">
                  <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-7 h-7 text-secondary" />
                  </div>
                  <h3 className="font-bold mb-1">Tudo a funcionar</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                    Ainda não reportaste problemas. Se algo falhar, podes reportá-lo aqui.
                  </p>
                  <Button variant="primary" onClick={() => setShowMaintenanceModal(true)}>
                    <Wrench className="w-4 h-4 mr-2" />
                    Reportar primeiro problema
                  </Button>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6 lg:row-start-1">
            <Card className="p-6 border-border/60 bg-gradient-to-br from-card via-card to-secondary/5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-secondary" />
                <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Senhorio</h3>
              </div>
              <div className="flex items-center gap-4 mb-5">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground rounded-2xl flex items-center justify-center text-xl font-bold ring-4 ring-background shadow-sm">
                    {activeHomeData.landlordName
                      .split(' ')
                      .map(name => name[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase() || 'S'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground truncate">{activeHomeData.landlordName || 'Senhorio'}</h4>
                  <p className="text-sm text-muted-foreground">Verificado pela UniRoom</p>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">Excelente</span>
                  </div>
                </div>
              </div>
              <Button variant="primary" className="w-full" onClick={() => setShowContactModal(true)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar mensagem
              </Button>
              <Link to="/messages" className="block mt-2">
                <Button variant="outline" className="w-full" size="sm">
                  Ver conversas anteriores
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </Card>

            <Card className="p-6 border-border/60">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Cronologia</h3>
              </div>
              <div className="space-y-4 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                <div className="relative flex items-start gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-secondary ring-4 ring-background mt-1 flex-shrink-0 z-10" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Entrada na casa</p>
                    <p className="text-xs text-muted-foreground">{formatDate(activeHomeData.moveInDate)}</p>
                  </div>
                </div>
                <div className="relative flex items-start gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-background mt-1 flex-shrink-0 z-10 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Hoje</p>
                    <p className="text-xs text-muted-foreground">{formatShortDate(new Date())} · há {daysInHome} dia{daysInHome === 1 ? '' : 's'} contigo</p>
                  </div>
                </div>
                <div className="relative flex items-start gap-3 opacity-60">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-border bg-background mt-1 flex-shrink-0 z-10" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted-foreground">Próximos passos</p>
                    <p className="text-xs text-muted-foreground">Continua a desfrutar da estadia</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <MaintenanceModal
        isOpen={showMaintenanceModal}
        onClose={() => {
          setShowMaintenanceModal(false);
          void refreshMaintenanceRequests();
        }}
        accommodationId={room.id}
        landlordId={property.landlordId}
      />

      {showContactModal && (
        <StartConversationModal
          accommodation={accommodation}
          landlordId={property.landlordId}
          landlordName={activeHomeData.landlordName}
          roomId={room.id}
          propertyId={property.id}
          isActiveHome={true}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </div>
  );
}

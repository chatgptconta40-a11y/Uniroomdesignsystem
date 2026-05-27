import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Bath,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  FileText,
  Flame,
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Upload,
  Users,
  Wifi,
  Wrench,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { MaintenanceModal } from '../components/MaintenanceModal';
import { StartConversationModal } from '../components/StartConversationModal';
import { getMaintenanceRequests } from '../data/mockMaintenance';
import { getHouseGroupConversation, getMessagesForConversation } from '../data/mockMessages';
import { getActiveHomeForStudent, getApplicationsForUser, confirmStay } from '../data/mockApplications';
import {
  formatCurrency,
  getContractStatusLabel,
  getOrCreateRentalContract,
  getPaymentMethodForHome,
  getPaymentMethodLabel,
  getPaymentMethodMainValue,
  getPaymentStatusLabel,
  getRentPaymentsForHome,
  uploadPaymentProof,
  ensureFinanceForHome,
  refreshHousingFinanceState,
} from '../data/mockHousingFinance';
import { Accommodation } from '../types/accommodation';
import { MaintenanceRequest, maintenanceCategoryLabels, maintenanceStatusLabels, maintenanceUrgencyLabels } from '../types/maintenance';

const HOUSEMATES_KEY = 'uniroom_active_home_housemates';

interface MockHousemate {
  id: string;
  propertyId: string;
  name: string;
  course: string;
  room: string;
  initials: string;
  since: string;
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

function readHousemates(propertyId: string, currentRoomNumber: string): MockHousemate[] {
  const stored = localStorage.getItem(HOUSEMATES_KEY);
  const all: MockHousemate[] = stored ? JSON.parse(stored) : [];
  const existing = all.filter(housemate => housemate.propertyId === propertyId);

  if (existing.length > 0) {
    return existing;
  }

  const generated: MockHousemate[] = [
    {
      id: `mate_${propertyId}_1`,
      propertyId,
      name: 'Inês Ferreira',
      course: 'Enfermagem',
      room: currentRoomNumber === 'Quarto 2' ? 'Quarto 1' : 'Quarto 2',
      initials: 'IF',
      since: 'Setembro 2025',
    },
    {
      id: `mate_${propertyId}_2`,
      propertyId,
      name: 'Miguel Costa',
      course: 'Engenharia Informática',
      room: currentRoomNumber === 'Quarto 3' ? 'Quarto 1' : 'Quarto 3',
      initials: 'MC',
      since: 'Outubro 2025',
    },
  ];

  localStorage.setItem(HOUSEMATES_KEY, JSON.stringify([...all, ...generated]));
  return generated;
}

export function MyHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getProperty, getRoom, refreshProperties } = useProperties();

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  const [financeRefreshKey, setFinanceRefreshKey] = useState(0);

  const activeHome = useMemo(() => {
    if (!user || user.type !== 'student') {
      return null;
    }

    const activeHomeData = getActiveHomeForStudent(user.id);

    if (!activeHomeData) {
      return null;
    }

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
  }, [user?.id, user?.type, homeRefreshKey, getProperty, getRoom]);

  const refreshMaintenanceRequests = () => {
    if (!user) {
      setMaintenanceRequests([]);
      return;
    }

    setMaintenanceRequests(getMaintenanceRequests(user.id));
  };

  useEffect(() => {
    refreshProperties();
    refreshMaintenanceRequests();
  }, [user?.id]);

  useEffect(() => {
    if (!activeHome) return;

    const { activeHomeData, room } = activeHome;
    const rent = activeHomeData.monthlyRent ?? room.price;
    const utilities = activeHomeData.utilities ?? room.utilities ?? 0;

    ensureFinanceForHome(activeHomeData, rent, utilities)
      .then(() => refreshHousingFinanceState())
      .then(() => setFinanceRefreshKey(key => key + 1))
      .catch(error => {
        console.warn('Erro ao sincronizar finanças da casa:', error);
      });
  }, [activeHome?.activeHomeData.id]);

  if (!activeHome) {
    const acceptedApp = user
      ? getApplicationsForUser(user.id).find(application => application.status === 'accepted')
      : null;

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
                    onClick={() => {
                      const home = confirmStay(acceptedApp.id);
                      if (home) {
                        refreshProperties();
                        setHomeRefreshKey(key => key + 1);
                      }
                    }}
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

  const paymentMethod = getPaymentMethodForHome(activeHomeData);
  const contract = getOrCreateRentalContract(activeHomeData, monthlyRent, utilitiesAmount);
  const rentPayments = getRentPaymentsForHome(activeHomeData, monthlyRent, utilitiesAmount);

  const housemates = readHousemates(property.id, room.roomNumber);
  const nextPayment = rentPayments.find(payment => payment.status !== 'paid') || rentPayments[0];
  const paidPayments = rentPayments.filter(payment => payment.status === 'paid');
  const paymentsWithProof = rentPayments.filter(payment => Boolean(payment.proofUrl));

  const visibleMaintenanceRequests = maintenanceRequests.filter(request =>
    request.accommodationId === room.id ||
    request.accommodationId === accommodation.id ||
    request.landlordId === property.landlordId,
  );

  const pendingRequests = visibleMaintenanceRequests.filter(request => request.status === 'pending').length;
  const inProgressRequests = visibleMaintenanceRequests.filter(request => request.status === 'in_progress').length;
  const urgentRequests = visibleMaintenanceRequests.filter(
    request => request.urgency === 'high' && request.status !== 'resolved' && request.status !== 'closed',
  ).length;

  const handleCopyPaymentData = async () => {
    const value = getPaymentMethodMainValue(paymentMethod);

    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      alert('Dados de pagamento copiados.');
    } catch {
      alert(value);
    }
  };

  const handleUploadPaymentProof = (paymentId: string) => {
    const updated = uploadPaymentProof(paymentId, `comprovativo-${new Date().toISOString().slice(0, 10)}.pdf`);

    if (updated) {
      setFinanceRefreshKey(key => key + 1);
      alert('Comprovativo enviado ao senhorio.');
    }
  };

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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">A Minha Casa</h1>
              <Badge variant="success">
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Casa ativa
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Gere a tua estadia, pagamentos, colegas de casa e pedidos de manutenção.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowContactModal(true)}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Contactar senhorio
            </Button>
            <Button variant="primary" onClick={() => setShowMaintenanceModal(true)}>
              <Wrench className="w-4 h-4 mr-2" />
              Reportar problema
            </Button>
          </div>
        </div>

        <Card className="p-0 mb-6 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative min-h-[280px]">
              <img
                src={property.images[0] || room.images[0]}
                alt={property.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute left-6 right-6 bottom-6 text-white">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="success" className="bg-white/95 text-secondary border-white/60">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Propriedade verificada
                  </Badge>
                  <Badge variant="outline" className="bg-white/15 text-white border-white/30">
                    {property.totalRooms} quartos
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold mb-2">{property.title}</h2>
                <p className="text-sm text-white/90 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {property.address}, {property.zone}, {property.city}
                </p>
              </div>
            </div>

            <div className="p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm font-semibold text-primary mb-1">Quarto arrendado</p>
                  <h3 className="text-xl font-bold text-foreground">{room.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {room.roomNumber} · {room.size || '—'} m² ·{' '}
                    {room.privateBathroom ? 'casa de banho privativa' : 'casa de banho partilhada'}
                  </p>
                </div>
                <Badge variant="success">Ocupado</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Renda mensal</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(monthlyRent)}</p>
                </div>
                <div className="p-4 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Despesas</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(utilitiesAmount)}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data de entrada
                  </span>
                  <span className="font-semibold text-foreground">{formatDate(activeHomeData.moveInDate)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Contrato até
                  </span>
                  <span className="font-semibold text-foreground">{formatDate(activeHomeData.contractEndDate)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Distância à universidade
                  </span>
                  <span className="font-semibold text-foreground">{property.distanceToUniversity} km</span>
                </div>
              </div>

              <Link to={`/room/${room.id}`} className="block mt-6">
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Ver anúncio original
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {amenities.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-semibold text-sm">{value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Casa e comodidades</h3>
                  <p className="text-sm text-muted-foreground">Informação prática da casa partilhada.</p>
                </div>
                <Badge variant="outline">{property.zone}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['Cozinha equipada', property.amenities.kitchen],
                  ['Sala comum', property.amenities.livingRoom],
                  ['Máquina de lavar', property.amenities.laundry],
                  ['Micro-ondas', property.amenities.microwave],
                  ['Estacionamento', property.amenities.parking],
                  ['Elevador', property.amenities.elevator],
                ].map(([label, enabled]) => (
                  <div key={label as string} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <CheckCircle className={`w-4 h-4 ${enabled ? 'text-secondary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {label as string}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-5">Colegas de casa</h3>
              <div className="space-y-4">
                {housemates.map(housemate => (
                  <div key={housemate.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      {housemate.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{housemate.name}</h4>
                        <Badge variant="outline" className="text-xs">{housemate.room}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{housemate.course}</p>
                      <p className="text-xs text-muted-foreground mt-1">Em casa desde {housemate.since}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {(() => {
              const houseChat = getHouseGroupConversation(property.id, user?.id || '');
              if (!houseChat) return null;

              const lastMessages = getMessagesForConversation(houseChat.id).slice(-3);

              return (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Chat da casa</h3>
                      <p className="text-sm text-muted-foreground">Conversa com os teus colegas</p>
                    </div>
                    {houseChat.unreadCount > 0 && (
                      <Badge variant="default" className="bg-primary">
                        {houseChat.unreadCount} nova{houseChat.unreadCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    {lastMessages.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        Nenhuma mensagem ainda. Começa a conversa!
                      </div>
                    ) : (
                      lastMessages.map(message => (
                        <div key={message.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {message.senderName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-foreground">
                                {message.senderName.split(' ')[0]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {message.createdAt.toLocaleTimeString('pt-PT', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">{message.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Link to={`/messages?conversation=${houseChat.id}`} className="block">
                    <Button variant="primary" className="w-full">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Abrir chat da casa
                    </Button>
                  </Link>
                </Card>
              );
            })()}

            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-5">Regras principais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rules.map(rule => (
                  <div key={rule} className="flex items-start gap-3 p-4 border border-border rounded-lg">
                    <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{rule}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Pedidos de manutenção</h2>
                  <p className="text-sm text-muted-foreground">Acompanha problemas reportados no quarto ou na casa.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {pendingRequests > 0 && <Badge variant="warning">{pendingRequests} pendentes</Badge>}
                  {inProgressRequests > 0 && <Badge variant="default">{inProgressRequests} em resolução</Badge>}
                  {urgentRequests > 0 && (
                    <Badge variant="outline" className="text-destructive bg-destructive/10 border-destructive/20">
                      {urgentRequests} urgentes
                    </Badge>
                  )}
                </div>
              </div>

              {visibleMaintenanceRequests.length > 0 ? (
                <div className="space-y-3">
                  {visibleMaintenanceRequests.map(request => (
                    <div key={request.id} className="p-5 border border-border rounded-lg hover:border-primary/40 transition-all">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-bold text-foreground">{request.title}</h3>
                            <Badge
                              variant={
                                request.status === 'resolved' || request.status === 'closed'
                                  ? 'success'
                                  : request.status === 'in_progress'
                                  ? 'default'
                                  : 'warning'
                              }
                            >
                              {maintenanceStatusLabels[request.status]}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                request.urgency === 'high'
                                  ? 'text-destructive bg-destructive/10 border-destructive/20'
                                  : request.urgency === 'medium'
                                  ? 'text-accent bg-accent/10 border-accent/20'
                                  : 'text-secondary bg-secondary/10 border-secondary/20'
                              }
                            >
                              {maintenanceUrgencyLabels[request.urgency]}
                            </Badge>
                          </div>

                          <Badge variant="outline" className="mb-3">
                            {maintenanceCategoryLabels[request.category]}
                          </Badge>
                          <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Reportado há {getDaysSince(request.createdAt)} dias
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" size="sm" className="w-full" onClick={() => setShowMaintenanceModal(true)}>
                    <Wrench className="w-4 h-4 mr-2" />
                    Reportar novo problema
                  </Button>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Wrench className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-bold mb-2">Sem pedidos de manutenção</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Quando tiveres algum problema no alojamento, podes reportá-lo aqui.
                  </p>
                  <Button variant="primary" onClick={() => setShowMaintenanceModal(true)}>
                    <Wrench className="w-4 h-4 mr-2" />
                    Reportar primeiro problema
                  </Button>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Senhorio responsável</h3>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                  {activeHomeData.landlordName
                    .split(' ')
                    .map(name => name[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-foreground">{activeHomeData.landlordName}</h4>
                    <CheckCircle className="w-4 h-4 text-secondary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Senhorio verificado</p>
                </div>
              </div>
              <Button variant="primary" className="w-full" onClick={() => setShowContactModal(true)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Contactar senhorio
              </Button>
            </Card>

            <Card key={`payment-${financeRefreshKey}`} className="p-0 overflow-hidden border-primary/10">
              <div className="bg-gradient-to-br from-primary to-blue-700 p-5 text-white">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <p className="text-sm text-white/80 mb-1">Pagamento deste mês</p>
                    <p className="text-3xl font-bold">{formatCurrency(nextPayment?.totalAmount || monthlyTotal)}</p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/12 border border-white/15 px-3 py-2">
                    <p className="text-[11px] text-white/70">Estado</p>
                    <p className="text-sm font-bold">{getPaymentStatusLabel(nextPayment?.status || 'pending')}</p>
                  </div>
                  <div className="rounded-xl bg-white/12 border border-white/15 px-3 py-2">
                    <p className="text-[11px] text-white/70">Data limite</p>
                    <p className="text-sm font-bold">
                      {nextPayment ? formatShortDate(nextPayment.dueDate) : `Dia ${activeHomeData.paymentDay}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="rounded-2xl border border-border bg-muted/25 p-4 mb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{getPaymentMethodLabel(paymentMethod)}</p>
                      <p className="text-xs text-muted-foreground">Pagamento fora da plataforma.</p>
                    </div>
                    <Badge variant="outline">Dados do senhorio</Badge>
                  </div>

                  <p className="text-sm font-semibold text-foreground break-all mb-1">
                    {getPaymentMethodMainValue(paymentMethod)}
                  </p>
                  {paymentMethod.holderName && (
                    <p className="text-xs text-muted-foreground">Titular: {paymentMethod.holderName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyPaymentData}>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copiar
                  </Button>
                  {nextPayment && nextPayment.status !== 'paid' ? (
                    <Button size="sm" onClick={() => handleUploadPaymentProof(nextPayment.id)}>
                      <Upload className="w-4 h-4 mr-1.5" />
                      Comprovativo
                    </Button>
                  ) : (
                    <Button size="sm" disabled>
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Pago
                    </Button>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A UniRoom não processa pagamentos. Usa estes dados e guarda sempre comprovativo.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Contrato</h3>
                  <p className="text-sm text-muted-foreground">Documento da tua estadia.</p>
                </div>
                <Badge variant={contract.status === 'active' ? 'success' : 'outline'}>
                  {getContractStatusLabel(contract.status)}
                </Badge>
              </div>

              <div className="rounded-2xl bg-muted/25 border border-border p-4 mb-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{contract.title}</p>
                    <p className="text-xs text-muted-foreground">N.º {contract.contractNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Início</p>
                    <p className="font-semibold text-foreground">{formatShortDate(contract.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fim</p>
                    <p className="font-semibold text-foreground">
                      {contract.endDate ? formatShortDate(contract.endDate) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Caução</p>
                    <p className="font-semibold text-foreground">{formatCurrency(contract.depositAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recibos</p>
                    <p className="font-semibold text-foreground">{paidPayments.length}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => alert('A abrir contrato demonstrativo.')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Ver contrato
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled={paymentsWithProof.length === 0}>
                  <Receipt className="w-4 h-4 mr-2" />
                  {paymentsWithProof.length} comprovativo{paymentsWithProof.length === 1 ? '' : 's'} enviado{paymentsWithProof.length === 1 ? '' : 's'}
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Histórico</h3>
                  <p className="text-sm text-muted-foreground">Pagamentos recentes.</p>
                </div>
                <Receipt className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                {rentPayments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground capitalize">
                        {new Date(payment.periodMonth).toLocaleDateString('pt-PT', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.status === 'paid' && payment.paidAt
                          ? `Pago em ${formatShortDate(payment.paidAt)}`
                          : `Vence em ${formatShortDate(payment.dueDate)}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-foreground">{formatCurrency(payment.totalAmount)}</p>
                      <Badge
                        variant={
                          payment.status === 'paid'
                            ? 'success'
                            : payment.status === 'late'
                            ? 'outline'
                            : 'warning'
                        }
                        className="text-[10px]"
                      >
                        {getPaymentStatusLabel(payment.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <MaintenanceModal
        isOpen={showMaintenanceModal}
        onClose={() => {
          setShowMaintenanceModal(false);
          refreshMaintenanceRequests();
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

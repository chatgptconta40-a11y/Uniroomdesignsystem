import { useParams, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Users, Home, Check, MessageCircle, Heart, Maximize, Bath, Building, Calendar, Clock, Star, Edit, Pause, Play, FileText, BarChart3 } from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { LocationMap } from '../components/LocationMap';
import { ApplicationModal } from '../components/ApplicationModal';
import { ReviewModal } from '../components/ReviewModal';
import { ReportModal } from '../components/ReportModal';
import { StartConversationModal } from '../components/StartConversationModal';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useProperties } from '../context/PropertiesContext';
import { Accommodation } from '../types/accommodation';
import { getReviewsForAccommodation, getAverageRatingBreakdown } from '../data/mockTrust';
import { getExistingApplicationForRoom } from '../data/mockApplications';
import { hasCompletedCompatibilityProfile } from '../data/mockProfiles';
import { mockUsers } from '../data/mockUsers';
import { toast } from 'sonner';
import { ComfortScorePanel } from '../components/ComfortScorePanel';
import { TrustSignals } from '../components/TrustSignals';

export function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getRoom, getProperty, getRoomsByProperty, updatePropertyStatus } = useProperties();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [, setReviewsVersion] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const room = getRoom(id || '');
  const property = room ? getProperty(room.propertyId) : null;
  const otherRooms = room ? getRoomsByProperty(room.propertyId).filter(r => r.id !== room.id) : [];
  const galleryImages = room && property
    ? Array.from(new Set([...room.images, ...property.images]))
    : [];
  const reviews = room ? getReviewsForAccommodation(room.id) : [];
  const ratingBreakdown = room ? getAverageRatingBreakdown(room.id) : null;

  const isLandlordOwner = user?.type === 'landlord' && room?.landlordId === user?.id;
  const existingApplication = user?.type === 'student' && room
    ? getExistingApplicationForRoom(user.id, room.id)
    : null;
  const canShowCompatibility = Boolean(
    user?.type === 'student' &&
    hasCompletedCompatibilityProfile(user.id) &&
    room?.compatibilityScore
  );
  const shouldInviteProfileCompletion = user?.type === 'student' && !canShowCompatibility;

  if (!room || !property) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Quarto não encontrado</h1>
          <Button onClick={() => navigate('/search')}>Voltar à pesquisa</Button>
        </div>
      </div>
    );
  }

  const getRoomTypeBadge = () => {
    const types = {
      private: { label: 'Privado', variant: 'default' as const },
      shared: { label: 'Partilhado', variant: 'default' as const },
      studio: { label: 'Estúdio', variant: 'success' as const },
      apartment: { label: 'Apartamento', variant: 'success' as const },
    };
    return types[room.roomType];
  };

  const roomTypeBadge = getRoomTypeBadge();
  const availableFrom = new Date(room.availableFrom).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const applicationAccommodation: Accommodation = {
    id: room.id,
    title: room.title,
    description: room.description,
    city: property.city,
    zone: property.zone,
    address: property.address,
    price: room.price,
    images: galleryImages,
    landlordId: room.landlordId,
    roomType: room.roomType,
    currentOccupants: property.totalRooms - otherRooms.filter(item => item.status === 'available').length - (room.status === 'available' ? 1 : 0),
    maxOccupants: property.totalRooms,
    coordinates: property.coordinates || { lat: 40.6566, lng: -7.9133 },
    distanceToUniversity: property.distanceToUniversity,
    universityName: 'Universidade',
    amenities: {
      furnished: true,
      wifi: property.amenities.wifi,
      utilitiesIncluded: !room.utilities,
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
    status: property.status === 'active' && room.status === 'available' ? 'active' : 'paused',
    verified: property.verified,
    compatibilityScore: room.compatibilityScore,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    views: room.views,
  };

  const APP_STATUS_LABELS: Record<string, { label: string; description: string; bgCls: string; textCls: string }> = {
    pending: { label: 'Candidatura enviada', description: 'A aguardar análise pelo senhorio', bgCls: 'bg-blue-50 border-blue-200', textCls: 'text-blue-700' },
    under_review: { label: 'Em análise', description: 'O senhorio está a rever a tua candidatura', bgCls: 'bg-amber-50 border-amber-200', textCls: 'text-amber-700' },
    accepted: { label: 'Candidatura aceite', description: 'O senhorio aceitou a tua candidatura', bgCls: 'bg-green-50 border-green-200', textCls: 'text-green-700' },
    confirmed: { label: 'Entrada confirmada', description: 'A tua entrada neste quarto foi confirmada', bgCls: 'bg-green-50 border-green-200', textCls: 'text-green-700' },
  };

  const requestAuthentication = () => {
    setShowAuthModal(true);
  };

  const handleApply = () => {
    if (!user) {
      requestAuthentication();
      return;
    }
    setShowApplicationModal(true);
  };

  const handleContact = () => {
    if (!user) {
      requestAuthentication();
      return;
    }

    setShowContactModal(true);
  };

  const handleToggleFavorite = () => {
    if (!user) {
      requestAuthentication();
      return;
    }
    toggleFavorite(room.id);
    toast.success(isFavorite(room.id) ? 'Removido dos favoritos' : 'Guardado nos favoritos');
  };

  const handleReview = () => {
    if (!user) {
      requestAuthentication();
      return;
    }
    setShowReviewModal(true);
  };

  const handleReport = () => {
    if (!user) {
      requestAuthentication();
      return;
    }
    setShowReportModal(true);
  };

  const handlePauseListing = () => {
    updatePropertyStatus(property.id, 'paused');
    toast.success('Anúncio pausado com sucesso');
  };

  const handleReactivateListing = () => {
    updatePropertyStatus(property.id, 'active');
    toast.success('Anúncio reativado com sucesso');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl bg-muted">
                <img
                  src={galleryImages[selectedImageIndex] || room.images[0] || property.images[0]}
                  alt={room.title}
                  className="w-full h-96 object-cover rounded-xl"
                />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <Badge className="bg-white/95 text-foreground border border-white shadow-sm">
                    {room.roomNumber}
                  </Badge>
                  {property.verified && (
                    <Badge variant="success" className="shadow-sm">
                      Verificado
                    </Badge>
                  )}
                </div>
              </div>
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`h-20 overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImageIndex === idx
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-border'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${room.title} ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge variant={roomTypeBadge.variant} className="mb-3">
                    {roomTypeBadge.label}
                  </Badge>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {room.title}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-5 h-5" />
                    <span>{property.zone}, {property.city}</span>
                  </div>
                </div>
              </div>

              <Card className="p-4 bg-blue-50 border-blue-200 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">Este quarto faz parte de:</p>
                      <button
                        type="button"
                        onClick={() => navigate(`/property/${property.id}`)}
                        className="text-left text-sm font-semibold text-blue-700 hover:underline"
                      >
                        {property.title}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/property/${property.id}`)}
                    className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <Home className="w-3 h-3 mr-1" />
                    Ver página da casa
                  </button>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Sobre o quarto</h2>
              <p className="text-foreground leading-relaxed mb-6">{room.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {room.size && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Maximize className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Área</p>
                      <p className="font-semibold">{room.size}m²</p>
                    </div>
                  </div>
                )}
                {room.privateBathroom && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Bath className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">WC</p>
                      <p className="font-semibold">Privativo</p>
                    </div>
                  </div>
                )}
                {room.balcony && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Varanda</p>
                      <p className="font-semibold">Sim</p>
                    </div>
                  </div>
                )}
                {room.desk && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Secretária</p>
                      <p className="font-semibold">Sim</p>
                    </div>
                  </div>
                )}
                {room.wardrobe && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Roupeiro</p>
                      <p className="font-semibold">Sim</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Disponibilidade</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Disponível a partir de</p>
                    <p className="font-semibold">{availableFrom}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Estadia mínima</p>
                    <p className="font-semibold">{room.minimumStay} meses</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Comodidades da casa</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.amenities.wifi && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Wi-Fi</span>
                  </div>
                )}
                {property.amenities.kitchen && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Cozinha</span>
                  </div>
                )}
                {property.amenities.livingRoom && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Sala Comum</span>
                  </div>
                )}
                {property.amenities.laundry && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Lavandaria</span>
                  </div>
                )}
                {property.amenities.parking && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Estacionamento</span>
                  </div>
                )}
                {property.amenities.heating && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Aquecimento</span>
                  </div>
                )}
              </div>
            </Card>

            {property.houseRules && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Regras da casa</h2>
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
                  {property.houseRules.quietHours && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">Horário de silêncio</span>
                      <span className="text-sm font-semibold">{property.houseRules.quietHours}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card className="p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-xl font-bold">Avaliações</h2>
                <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {ratingBreakdown && ratingBreakdown.total > 0
                    ? `${ratingBreakdown.average.toFixed(1)} média`
                    : 'Sem avaliações'}
                </div>
              </div>
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map(review => (
                    <div key={review.id} className="rounded-xl border border-border p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{review.reviewerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString('pt-PT')}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`w-3.5 h-3.5 ${index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                      <p className="mt-3 text-xs font-medium text-foreground">
                        {review.recommend ? 'Recomenda este quarto' : 'Não recomenda este quarto'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-5 bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                      Ainda não existem avaliações para este quarto.
                    </p>
                  </div>
                )}
                {!isLandlordOwner && (
                  <Button variant="outline" size="sm" onClick={handleReview}>
                    <Star className="w-4 h-4 mr-2" />
                    Deixar avaliação
                  </Button>
                )}
              </div>
            </Card>

          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {!isLandlordOwner && (
                <Card className="p-6 shadow-lg">
                  <div className="mb-5 pb-4 border-b border-border">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">€{room.price}</span>
                      <span className="text-muted-foreground text-sm">/mês</span>
                    </div>
                    {room.utilities && room.utilities > 0 ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        + €{room.utilities} despesas
                        <span className="ml-1 font-semibold text-foreground">= €{room.price + room.utilities} total</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-green-600 font-medium">Despesas incluídas</p>
                    )}
                  </div>

                  {canShowCompatibility && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 rounded-lg border border-green-100">
                      <Users className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <span className="text-xs text-green-700">Compatibilidade</span>
                      <span className={`ml-auto text-sm font-bold ${
                        (room.compatibilityScore ?? 0) >= 80 ? 'text-green-700' :
                        (room.compatibilityScore ?? 0) >= 60 ? 'text-amber-600' : 'text-muted-foreground'
                      }`}>
                        {room.compatibilityScore ?? 0}%
                      </span>
                    </div>
                  )}

                  {shouldInviteProfileCompletion && (
                    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                        <div>
                          <p className="text-sm font-bold text-blue-950">
                            Completa o teu perfil de convivência
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-blue-800">
                            Depois do onboarding, a UniRoom desbloqueia compatibilidade personalizada para este quarto.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
                            onClick={() => navigate('/onboarding')}
                          >
                            Preencher perfil
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {existingApplication ? (
                      <div className={`rounded-xl border p-3.5 ${APP_STATUS_LABELS[existingApplication.status]?.bgCls || 'bg-muted border-border'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className={`w-4 h-4 flex-shrink-0 ${APP_STATUS_LABELS[existingApplication.status]?.textCls || 'text-foreground'}`} />
                          <span className={`text-sm font-semibold ${APP_STATUS_LABELS[existingApplication.status]?.textCls || 'text-foreground'}`}>
                            {APP_STATUS_LABELS[existingApplication.status]?.label || 'Candidatura submetida'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {APP_STATUS_LABELS[existingApplication.status]?.description}
                        </p>
                        <button
                          onClick={() => navigate('/applications')}
                          className="mt-2 text-xs text-primary hover:underline font-medium"
                        >
                          Ver as minhas candidaturas →
                        </button>
                      </div>
                    ) : (
                      <Button variant="primary" className="w-full" onClick={handleApply}>
                        Candidatar-me
                      </Button>
                    )}
                    <Button variant="outline" className="w-full" onClick={handleContact}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enviar mensagem
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleToggleFavorite}>
                      <Heart className={`w-4 h-4 mr-2 ${isFavorite(room.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      {isFavorite(room.id) ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
                    </Button>
                  </div>
                </Card>
              )}

              {!isLandlordOwner && (
                <ComfortScorePanel room={room} property={property} canUseCompatibility={canShowCompatibility} />
              )}

              {!isLandlordOwner && (
                <TrustSignals
                  room={room}
                  property={property}
                  onReport={handleReport}
                />
              )}

              <Card className="p-6">
                <h3 className="font-bold mb-4">Localização</h3>
                <div className="mb-4">
                  <LocationMap
                    address={property.address}
                    zone={property.zone}
                    city={property.city}
                  />
                </div>
                {property.address && (
                  <p className="text-sm text-muted-foreground mb-4 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
                    {property.address}
                  </p>
                )}
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      Universidade mais próxima
                    </span>
                    <span className="font-semibold">{property.distanceToUniversity} km</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      A pé
                    </span>
                    <span className="font-semibold">~{Math.round(property.distanceToUniversity * 13)} min</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Transporte público
                    </span>
                    <span className="font-semibold">~{Math.round(property.distanceToUniversity * 5)} min</span>
                  </div>
                </div>
              </Card>

              {isLandlordOwner && (
                <Card className="p-6 border-primary/20 bg-primary/5">
                  <div className="mb-5">
                    <Badge variant={property.status === 'active' ? 'success' : property.status === 'paused' ? 'warning' : 'default'}>
                      {property.status === 'active' ? 'Ativo' : property.status === 'paused' ? 'Pausado' : property.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                    </Badge>
                    <h3 className="font-bold mt-3 mb-1">Gestão do anúncio</h3>
                    <p className="text-sm text-muted-foreground">
                      Estás a ver este quarto como senhorio responsável.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Button variant="primary" onClick={() => toast.info('Edição rápida disponível em Os Meus Alojamentos.')}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    {property.status === 'active' && (
                      <Button variant="outline" onClick={handlePauseListing}>
                        <Pause className="w-4 h-4 mr-2" />
                        Pausar
                      </Button>
                    )}
                    {property.status === 'paused' && (
                      <Button variant="primary" onClick={handleReactivateListing}>
                        <Play className="w-4 h-4 mr-2" />
                        Reativar
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => navigate(`/landlord/applications?listing=${room.id}`)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Ver candidaturas
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/messages')}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Ver mensagens
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/landlord/analytics')}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Precisas de iniciar sessão"
        size="sm"
        footer={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/login')}
            >
              Entrar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => navigate('/register')}
            >
              Criar conta
            </Button>
          </div>
        }
      >
        <p className="text-muted-foreground leading-relaxed">
          Para te candidatares, guardar favoritos ou contactar o senhorio, tens de ter uma conta UniRoom.
        </p>
      </Modal>

      {showApplicationModal && (
        <ApplicationModal
          accommodation={applicationAccommodation}
          roomId={room.id}
          propertyId={property.id}
          propertyTitle={property.title}
          onClose={() => setShowApplicationModal(false)}
          onSuccess={() => {}}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          accommodationId={room.id}
          landlordId={room.landlordId}
          userId={user?.id || ''}
          userName={user?.name || ''}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => setReviewsVersion(version => version + 1)}
        />
      )}

      {showReportModal && (() => {
        const landlord = mockUsers.find(u => u.id === room.landlordId);
        return (
          <ReportModal
            reportedType="accommodation"
            reportedId={room.id}
            reportedName={room.title}
            userId={user?.id || ''}
            userName={user?.name}
            onClose={() => setShowReportModal(false)}
            propertyId={property.id}
            propertyTitle={property.title}
            roomId={room.id}
            roomTitle={room.title}
            landlordId={room.landlordId}
            landlordName={landlord?.name}
          />
        );
      })()}

      {showContactModal && (() => {
        const landlord = mockUsers.find(u => u.id === room.landlordId);
        const contactAccommodation: Accommodation = {
          id: room.id,
          title: room.title,
          description: room.description,
          city: property.city,
          zone: property.zone,
          address: property.address,
          price: room.price,
          images: [...room.images, ...property.images],
          landlordId: room.landlordId,
          roomType: room.roomType,
          currentOccupants: 1,
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

        return (
          <StartConversationModal
            accommodation={contactAccommodation}
            landlordId={room.landlordId}
            landlordName={landlord?.name}
            roomId={room.id}
            propertyId={property.id}
            defaultMessage={`Olá, vi este quarto no UniRoom e tenho interesse. Gostava de confirmar se ainda está disponível, quais são as condições de entrada e se seria possível agendar uma visita. Obrigado.`}
            onClose={() => setShowContactModal(false)}
          />
        );
      })()}
    </div>
  );
}

import { useParams, useNavigate } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Users,
  Star,
  Check,
  MessageCircle,
  Calendar,
  Heart,
  Flag,
  Navigation,
  Bus,
  ShoppingCart,
  Coffee,
  Wrench,
} from 'lucide-react';
import { ImageGallery } from '../components/ImageGallery';
import { ApplicationModal } from '../components/ApplicationModal';
import { StartConversationModal } from '../components/StartConversationModal';
import { ReviewModal } from '../components/ReviewModal';
import { ReportModal } from '../components/ReportModal';
import { MaintenanceModal } from '../components/MaintenanceModal';
import { LandlordStatsCard } from '../components/LandlordStatsCard';
import { LandlordManagementPanel } from '../components/LandlordManagementPanel';
import { ESTGVRouteSection } from '../components/ESTGVRouteSection';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAccommodations } from '../context/AccommodationsContext';
import { useProperties } from '../context/PropertiesContext';
import type { Property } from '../types/property';
import { usePropertyExtras } from '../hooks/usePropertyExtras';
import { useReviews } from '../hooks/useTrust';
import { calculateComfortScore } from '../utils/compatibility';
import { toast } from 'sonner';

const getLocationInfo = (accommodationId: string) => {
  const locationData: Record<string, any> = {
    '1': { publicTransport: ['34', '103'], supermarket: 450, cafes: 12, walkTime: 15 },
    '2': { publicTransport: ['Metro Vermelha', '47', '83'], supermarket: 200, cafes: 25, walkTime: 20 },
    '3': { publicTransport: ['200', '207', 'Metro D'], supermarket: 350, cafes: 8, walkTime: 10 },
    '4': { publicTransport: ['103', '34B'], supermarket: 180, cafes: 15, walkTime: 6 },
    '5': { publicTransport: ['2', '20', 'Metro'], supermarket: 500, cafes: 10, walkTime: 25 },
  };

  return locationData[accommodationId] || {
    publicTransport: ['34', '103'],
    supermarket: 400,
    cafes: 10,
    walkTime: 15,
  };
};

export function AccommodationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, studentProfile } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { accommodations } = useAccommodations();
  const { fetchPropertyDetail } = useProperties();

  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const isCurrentHome = user?.id === 'estudante' && id === '2';

  const accommodation = accommodations.find(item => item.id === id);
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const detailFetchId = accommodation?.propertyId ?? accommodation?.id ?? '';

  useEffect(() => {
    if (!detailFetchId) return;
    setDetailLoading(true);
    fetchPropertyDetail(detailFetchId)
      .then(prop => { if (prop) setDetailProperty(prop); })
      .finally(() => setDetailLoading(false));
  }, [detailFetchId]);

  const displayAcc = useMemo(() => {
    if (!accommodation) return null;
    if (!detailProperty) return accommodation;
    return {
      ...accommodation,
      images: detailProperty.images.length > 0 ? detailProperty.images : accommodation.images,
      description: detailProperty.description || accommodation.description,
      amenities: {
        ...accommodation.amenities,
        wifi: detailProperty.amenities.wifi,
        parking: detailProperty.amenities.parking,
        washingMachine: detailProperty.amenities.laundry,
        kitchen: detailProperty.amenities.kitchen,
        airConditioning: detailProperty.amenities.airConditioning,
        heating: detailProperty.amenities.heating,
        elevator: detailProperty.amenities.elevator,
      },
    };
  }, [accommodation, detailProperty]);

  const isLandlordOwner = user?.type === 'landlord' && accommodation?.landlordId === user?.id;
  const propertyId = accommodation?.propertyId ?? accommodation?.id;
  const { roommates, houseRules } = usePropertyExtras(propertyId);
  const { reviews, averageRating: averageRating } = useReviews({ propertyId });
  const locationInfo = getLocationInfo(id || '');

  if (!accommodation) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Alojamento não encontrado</h1>
          <Button onClick={() => navigate('/search')}>Voltar à pesquisa</Button>
        </div>
      </div>
    );
  }

  const comfortScore = calculateComfortScore(
    accommodation,
    0,
    averageRating,
  );

  const handleApply = () => {
    if (!user) {
      toast.error('Precisas de fazer login para te candidatares');
      navigate('/login');
      return;
    }

    setShowApplicationModal(true);
  };

  const handleContact = () => {
    if (!user) {
      toast.error('Precisas de fazer login para enviar mensagens');
      navigate('/login');
      return;
    }

    setShowConversationModal(true);
  };

  const handleToggleFavorite = () => {
    if (!user) {
      toast.error('Precisas de fazer login para guardar favoritos');
      navigate('/login');
      return;
    }

    const newState = toggleFavorite(accommodation.id);
    toast.success(newState ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar à pesquisa</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-8">
          {detailLoading && !detailProperty && (
            <div className="h-1 bg-primary/20 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-primary/50 animate-pulse rounded-full" />
            </div>
          )}
          <ImageGallery images={displayAcc?.images ?? []} title={accommodation.title} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    <h1 className="text-3xl font-bold">{accommodation.title}</h1>

                    {accommodation.verified && (
                      <Badge variant="success">
                        <Check className="w-3 h-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {accommodation.address}, {accommodation.city}
                    </span>

                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {roommates.length} moradores
                    </span>

                    {reviews.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {averageRating} ({reviews.length} avaliações)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-foreground leading-relaxed">{displayAcc?.description ?? accommodation.description}</p>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Badge>
                  {accommodation.roomType === 'private' ? 'Quarto privado' : 'Quarto partilhado'}
                </Badge>
                <Badge variant="outline">{accommodation.distanceToUniversity}km da universidade</Badge>
              </div>
            </section>

            {roommates.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Moradores atuais</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roommates.map(roommate => (
                    <Card key={roommate.id} hover className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                          {roommate.name.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1">{roommate.name}</h3>
                          {roommate.course && (
                            <p className="text-sm text-muted-foreground mb-1">{roommate.course}</p>
                          )}
                          {roommate.institution && (
                            <p className="text-xs text-muted-foreground">{roommate.institution}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {houseRules && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Regras da casa</h2>

                <Card className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Fumar</h3>
                      <p className="text-muted-foreground">
                        {houseRules.smokingAllowed ? 'Permitido' : 'Não permitido'}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Animais</h3>
                      <p className="text-muted-foreground">
                        {houseRules.petsAllowed ? 'Permitido' : 'Não permitido'}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Festas</h3>
                      <p className="text-muted-foreground">
                        {houseRules.partiesAllowed ? 'Permitido' : 'Não permitido'}
                      </p>
                    </div>

                    {houseRules.visitorsPolicy && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">Visitas</h3>
                        <p className="text-muted-foreground">{houseRules.visitorsPolicy}</p>
                      </div>
                    )}

                    {houseRules.quietHours && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">Horário de silêncio</h3>
                        <p className="text-muted-foreground">{houseRules.quietHours}</p>
                      </div>
                    )}

                    {houseRules.cleaningPolicy && (
                      <div className="md:col-span-2">
                        <h3 className="font-semibold text-foreground mb-3">Limpeza</h3>
                        <p className="text-muted-foreground">{houseRules.cleaningPolicy}</p>
                      </div>
                    )}

                    {houseRules.studentsOnly && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          Exclusivo para estudantes
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-bold mb-4">Comodidades</h2>

              <Card className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(displayAcc ?? accommodation).amenities.furnished && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Mobilado</span>
                    </div>
                  )}

                  {(displayAcc ?? accommodation).amenities.wifi && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Wi-Fi</span>
                    </div>
                  )}

                  {(displayAcc ?? accommodation).amenities.parking && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Estacionamento</span>
                    </div>
                  )}

                  {(displayAcc ?? accommodation).amenities.washingMachine && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Máquina de lavar</span>
                    </div>
                  )}

                  {(displayAcc ?? accommodation).amenities.kitchen && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Cozinha</span>
                    </div>
                  )}

                  {(displayAcc ?? accommodation).amenities.airConditioning && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Ar condicionado</span>
                    </div>
                  )}

                  {(displayAcc ?? accommodation).amenities.heating && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Aquecimento</span>
                    </div>
                  )}

                  {(displayAcc ?? accommodation).amenities.elevator && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Elevador</span>
                    </div>
                  )}

                  {(displayAcc ?? accommodation).amenities.balcony && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Varanda</span>
                    </div>
                  )}
                </div>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-8">Localização e mobilidade</h2>

              <Card className="p-6 md:p-8 mb-8">
                <ESTGVRouteSection property={accommodation} />
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card className="p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Navigation className="w-7 h-7 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-primary mb-2 uppercase tracking-wide">Universidade</p>
                      <p className="text-2xl font-bold text-foreground mb-2">{accommodation.distanceToUniversity}km</p>
                      <p className="text-xs text-muted-foreground font-medium">{locationInfo.walkTime} min a pé</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bus className="w-7 h-7 text-secondary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground mb-2">Transportes</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {locationInfo.publicTransport.map((line: string, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-2.5 py-1 bg-secondary/15 border-secondary/40 font-bold text-secondary"
                          >
                            {line}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">2 min a pé</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-7 h-7 text-accent" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground mb-2">Supermercado</p>
                      <p className="text-2xl font-bold text-foreground mb-2">{locationInfo.supermarket}m</p>
                      <p className="text-xs text-muted-foreground font-medium">5 min a pé</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Coffee className="w-7 h-7 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground mb-2">Zona envolvente</p>
                      <p className="text-2xl font-bold text-foreground mb-2">{locationInfo.cafes}+</p>
                      <p className="text-xs text-muted-foreground font-medium">Cafés/restaurantes</p>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {reviews.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Avaliações ({reviews.length})</h2>

                <div className="space-y-4">
                  {reviews.map(review => (
                    <Card key={review.id} className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{review.reviewerName ?? 'Estudante'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString('pt-PT', {
                              year: 'numeric',
                              month: 'long',
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`w-4 h-4 ${
                                index < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-foreground leading-relaxed mb-3">{review.comment}</p>

                      <div className="text-sm text-muted-foreground">
                        {review.helpful} pessoas acharam útil
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {isLandlordOwner ? (
                <LandlordManagementPanel accommodation={accommodation} />
              ) : (
                <>
                  <Card className="p-6 shadow-lg">
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-foreground">€{accommodation.price}</span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>

                      {accommodation.utilities && (
                        <p className="text-sm text-muted-foreground">
                          + Despesas: €{accommodation.utilities}/mês
                        </p>
                      )}
                    </div>

                    <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">Índice de conforto</span>
                        <span className="text-2xl font-bold text-green-600">{comfortScore.overall}/10</span>
                      </div>

                      <Badge variant="success" className="w-full justify-center mb-3">
                        {comfortScore.label}
                      </Badge>

                      <div className="space-y-3 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Compatibilidade</span>
                          <span className="font-medium">{comfortScore.breakdown.compatibility}/4</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Avaliações</span>
                          <span className="font-medium">{comfortScore.breakdown.reviews}/2.5</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Localização</span>
                          <span className="font-medium">{comfortScore.breakdown.location}/2</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Comodidades</span>
                          <span className="font-medium">{comfortScore.breakdown.amenities}/1.5</span>
                        </div>
                      </div>
                    </div>

                    {isCurrentHome ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Check className="w-5 h-5 text-accent" />
                            <p className="text-sm font-bold text-foreground">Esta é a tua casa</p>
                          </div>
                          <p className="text-xs text-muted-foreground">A viver aqui desde setembro 2025</p>
                        </div>

                        <Button onClick={() => setShowMaintenanceModal(true)} variant="primary" className="w-full" size="lg">
                          <Wrench className="w-5 h-5 mr-2" />
                          Reportar problema
                        </Button>

                        <Button onClick={handleContact} variant="outline" className="w-full" size="lg">
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Contactar senhorio
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button onClick={handleApply} className="w-full" size="lg">
                          <Calendar className="w-5 h-5 mr-2" />
                          Candidatar-me
                        </Button>

                        <Button onClick={handleContact} variant="outline" className="w-full" size="lg">
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Enviar mensagem
                        </Button>

                        <Button onClick={handleToggleFavorite} variant="ghost" className="w-full" size="lg">
                          <Heart className={`w-5 h-5 mr-2 ${isFavorite(id || '') ? 'fill-red-500 text-red-500' : ''}`} />
                          {isFavorite(id || '') ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
                        </Button>
                      </div>
                    )}
                  </Card>

                  <LandlordStatsCard landlordId={accommodation.landlordId} />

                  {!isCurrentHome && (
                    <Card className="p-6">
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full text-sm"
                          onClick={() => setShowReviewModal(true)}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Deixar avaliação
                        </Button>

                        <Button
                          variant="ghost"
                          className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setShowReportModal(true)}
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Denunciar anúncio
                        </Button>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg z-20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">€{accommodation.price}</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            <p className="text-xs text-muted-foreground">Conforto: {comfortScore.overall}/10</p>
          </div>

          <Button onClick={handleApply} size="lg">
            Candidatar-me
          </Button>
        </div>
      </div>

      {showApplicationModal && (
        <ApplicationModal
          accommodation={accommodation}
          onClose={() => setShowApplicationModal(false)}
          onSuccess={() => {}}
        />
      )}

      {showConversationModal && (
        <StartConversationModal
          accommodation={accommodation}
          landlordId={accommodation.landlordId}
          landlordName="Senhorios Lda."
          onClose={() => setShowConversationModal(false)}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          accommodationId={accommodation.id}
          landlordId={accommodation.landlordId}
          userId={user?.id || ''}
          userName={user?.name || ''}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {}}
        />
      )}

      {showReportModal && (
        <ReportModal
          reportedType="accommodation"
          reportedId={accommodation.id}
          reportedName={accommodation.title}
          userId={user?.id || ''}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showMaintenanceModal && (
        <MaintenanceModal
          isOpen={showMaintenanceModal}
          onClose={() => setShowMaintenanceModal(false)}
          accommodationId={accommodation.id}
          landlordId={accommodation.landlordId}
        />
      )}
    </div>
  );
}
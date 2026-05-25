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
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LocationMap } from '../components/LocationMap';
import { RoomCard } from '../components/RoomCard';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';

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

  const priceSummary = useMemo(() => {
    const prices = availableRooms.map(room => room.price);
    if (prices.length === 0) return null;
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [availableRooms]);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
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

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.9fr] gap-8">
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <img
                src={coverImage}
                alt={property.title}
                className="h-[420px] w-full object-cover"
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
              </div>
            </div>

            {property.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {property.images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-20 overflow-hidden rounded-lg border-2 transition-all ${
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
            <Card className="p-6">
              <div className="mb-5">
                <h1 className="text-3xl font-bold text-foreground mb-3">{property.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{property.zone}, {property.city}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
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
                    <span className="text-xs font-semibold">Preço</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {priceSummary ? `€${priceSummary.min}` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {priceSummary && priceSummary.min !== priceSummary.max ? `até €${priceSummary.max}/mês` : 'por mês'}
                  </p>
                </div>
              </div>

              <Button variant="primary" className="w-full" onClick={() => document.getElementById('quartos-disponiveis')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver quartos disponíveis
              </Button>
            </Card>

            <Card className="p-6">
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
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Bath className="w-4 h-4" />
                    Distância à universidade
                  </span>
                  <span className="font-semibold">{property.distanceToUniversity} km</span>
                </div>
              </div>
            </Card>
          </aside>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_0.75fr] gap-8">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-3">Sobre esta casa</h2>
              <p className="text-muted-foreground leading-relaxed">{property.description}</p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Comodidades</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {amenities.map(item => (
                  <div key={item.label} className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {property.houseRules && (
              <Card className="p-6">
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
                  {property.houseRules.quietHours && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">Silêncio</span>
                      <span className="text-sm font-semibold">{property.houseRules.quietHours}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          <Card className="p-6 h-fit">
            <h2 className="text-xl font-bold text-foreground mb-4">Localização</h2>
            <LocationMap address={property.address} zone={property.zone} city={property.city} />
          </Card>
        </section>

        <section id="quartos-disponiveis" className="space-y-4 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Quartos desta casa</h2>
              <p className="text-muted-foreground">
                Escolhe um quarto para abrir a página específica desse quarto.
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
                  variant="public"
                  showFavorite={!!user && user.type === 'student'}
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

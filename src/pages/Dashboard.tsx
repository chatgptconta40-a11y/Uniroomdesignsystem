import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Calendar,
  Heart,
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  Search,
  AlertCircle,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RoomCard } from '../components/RoomCard';
import { getMaintenanceRequests } from '../data/mockMaintenance';
import { getApplicationsForUser, getActiveHomeForStudent } from '../data/mockApplications';
import { getTotalUnreadCount } from '../data/mockMessages';
import { getProperty, getRoom } from '../data/mockProperties';
import { hasCompletedCompatibilityProfile } from '../data/mockProfiles';
import type { Property, Room } from '../types/property';

export function Dashboard() {
  const { user } = useAuth();
  const { rooms, properties } = useProperties();

  const [suggestions, setSuggestions] = useState<{ room: Room; property: Property; availableRooms: number }[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);

  const activeHome = useMemo(() => {
    if (!user || user.type !== 'student') return null;

    const activeHomeData = getActiveHomeForStudent(user.id);
    if (!activeHomeData) return null;

    const property = getProperty(activeHomeData.propertyId);
    const room = getRoom(activeHomeData.roomId);

    if (!property || !room) return null;

    return { property, room, activeHomeData };
  }, [user]);

  const canUseCompatibility = Boolean(user?.type === 'student' && hasCompletedCompatibilityProfile(user.id));
  const shouldShowProfileNotice = user?.type === 'student' && !canUseCompatibility;

  useEffect(() => {
    if (!user) return;

    const updateCounters = () => {
      const storedFavorites = JSON.parse(localStorage.getItem('uniroom_favorites') || '[]');
      const userFavorites = storedFavorites.filter((favorite: any) => favorite.userId === user.id);

      const applications = getApplicationsForUser(user.id);
      const activeApplications = applications.filter(
        application =>
          application.status === 'pending' ||
          application.status === 'under_review' ||
          application.status === 'accepted'
      );

      setFavoritesCount(userFavorites.length);
      setApplicationsCount(activeApplications.length);
      setUnreadMessagesCount(getTotalUnreadCount(user.id));
    };

    updateCounters();

    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === 'uniroom_favorites' ||
        event.key === 'uniroom_applications' ||
        event.key === 'uniroom_notifications'
      ) {
        updateCounters();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = window.setInterval(updateCounters, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const activeProperties = properties.filter(property => property.status === 'active');
    const propertyById = new Map(activeProperties.map(property => [property.id, property]));

    let topSuggestions = rooms
      .filter(room => room.status === 'available' && propertyById.has(room.propertyId))
      .map(room => {
        const property = propertyById.get(room.propertyId)!;

        return {
          room,
          property,
          availableRooms: rooms.filter(item => item.propertyId === property.id && item.status === 'available').length,
        };
      });

    const maxBudget = user.studentProfile?.preferences?.maxBudget;
    if (maxBudget) {
      topSuggestions = topSuggestions.filter(item => item.room.price <= maxBudget);
    }

    topSuggestions = topSuggestions
      .sort((a, b) => {
        if (canUseCompatibility) {
          return (b.room.compatibilityScore || 0) - (a.room.compatibilityScore || 0);
        }

        if (a.property.verified !== b.property.verified) {
          return a.property.verified ? -1 : 1;
        }

        if (a.property.distanceToUniversity !== b.property.distanceToUniversity) {
          return a.property.distanceToUniversity - b.property.distanceToUniversity;
        }

        if (a.room.price !== b.room.price) {
          return a.room.price - b.room.price;
        }

        return new Date(b.room.createdAt).getTime() - new Date(a.room.createdAt).getTime();
      })
      .slice(0, 3);

    setSuggestions(topSuggestions);
    setMaintenanceRequests(getMaintenanceRequests(user.id).slice(0, 3));
  }, [user, rooms, properties, canUseCompatibility]);

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Bom dia';
    if (hour < 19) return 'Boa tarde';

    return 'Boa noite';
  };

  const statsCards = [
    {
      label: 'Candidaturas',
      value: String(applicationsCount),
      icon: Calendar,
      color: 'primary',
      link: '/applications',
    },
    {
      label: 'Favoritos',
      value: String(favoritesCount),
      icon: Heart,
      color: 'secondary',
      link: '/favorites',
    },
    {
      label: 'Mensagens',
      value: String(unreadMessagesCount),
      icon: MessageCircle,
      color: 'accent',
      link: '/messages',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  {getGreeting()}, {user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-base text-muted-foreground">A tua área de alojamento universitário</p>
              </div>
            </div>

            <Link to="/search">
              <Button variant="primary" size="lg">
                <Search className="w-5 h-5" />
                Procurar quarto
              </Button>
            </Link>
          </div>
        </div>

        {shouldShowProfileNotice && (
          <Card className="p-5 mb-8 border-blue-100 bg-blue-50/70">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-bold text-foreground">
                      Ativa compatibilidade para encontrar a casa certa
                    </h2>
                    <UserCheck className="w-4 h-4 text-primary" />
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Por agora mostras-te sugestões por verificação, distância e preço.
                    Com o perfil completo, vês % de compatibilidade com a rotina e ambiente de cada casa.
                  </p>
                </div>
              </div>

              <Link to="/onboarding" className="w-full md:w-auto">
                <Button variant="primary" className="w-full md:w-auto">
                  Completar perfil
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {statsCards.map(stat => {
            const iconColor =
              stat.color === 'primary'
                ? 'text-primary'
                : stat.color === 'secondary'
                  ? 'text-secondary'
                  : 'text-accent';

            const iconBackground =
              stat.color === 'primary'
                ? 'bg-primary/10'
                : stat.color === 'secondary'
                  ? 'bg-secondary/10'
                  : 'bg-accent/10';

            return (
              <Link key={stat.label} to={stat.link} className="block">
                <Card hover className="p-6 h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-3">{stat.label}</p>
                      <p className="text-4xl font-bold text-foreground">{stat.value}</p>
                    </div>

                    <div className={`p-3 rounded-xl ${iconBackground}`}>
                      <stat.icon className={`w-7 h-7 ${iconColor}`} />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Quartos para ti</h2>
              <p className="text-sm text-muted-foreground">
                {canUseCompatibility
                  ? 'Ordenados por compatibilidade com o teu perfil'
                  : 'Verificados, perto da universidade e dentro do orçamento'}
              </p>
            </div>

            <Link to="/search">
              <Button variant="outline">Ver todos</Button>
            </Link>
          </div>

          {suggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map(({ room, property, availableRooms }) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  property={property}
                  availableRooms={availableRooms}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <HomeIcon className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sem quartos dentro do orçamento</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Não encontrámos quartos dentro do teu orçamento máximo. Podes ajustar os filtros ou ver todas as opções perto da universidade.
              </p>
              <Link to="/search">
                <Button variant="primary">Explorar todos os quartos</Button>
              </Link>
            </Card>
          )}
        </div>

        <div className="mb-10">
          <Card className="p-8 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent rounded-xl shadow-sm">
                <HomeIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">A minha casa</h3>
            </div>

            {activeHome ? (
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <img
                    src={activeHome.property.images[0]}
                    alt={activeHome.property.title}
                    className="w-full md:w-32 h-48 md:h-32 rounded-lg object-cover flex-shrink-0"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-foreground">{activeHome.room.title}</h4>
                      <Badge variant="success">Alojamento ativo</Badge>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {activeHome.property.address}, {activeHome.property.city}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Desde{' '}
                        {activeHome.activeHomeData.moveInDate.toLocaleDateString('pt-PT', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    {maintenanceRequests.length > 0 && (
                      <div className="mb-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
                        <p className="text-sm font-semibold text-accent flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          {maintenanceRequests.length}{' '}
                          {maintenanceRequests.length === 1
                            ? 'pedido de manutenção'
                            : 'pedidos de manutenção'}
                        </p>
                      </div>
                    )}

                    <Link to="/my-home">
                      <Button variant="primary" size="sm">
                        <HomeIcon className="w-4 h-4 mr-2" />
                        Ver a minha casa
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HomeIcon className="w-8 h-8 text-accent" />
                </div>
                <p className="text-muted-foreground mb-4">Ainda não tens um quarto ativo. Encontra a tua casa perto da universidade.</p>
                <Link to="/search">
                  <Button variant="primary">Procurar quarto</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card className="p-8 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-secondary rounded-xl shadow-sm">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Os teus favoritos</h3>
            </div>

            <p className="text-muted-foreground mb-6">
              {favoritesCount > 0
                ? `Tens ${favoritesCount} ${favoritesCount === 1 ? 'quarto guardado' : 'quartos guardados'} para comparar.`
                : 'Guarda quartos que te interessam para comparar mais tarde.'}
            </p>

            <Link to="/favorites">
              <Button variant="secondary">
                {favoritesCount > 0 ? 'Ver favoritos' : 'Explorar quartos'}
              </Button>
            </Link>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary rounded-xl shadow-sm">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Estado das candidaturas</h3>
            </div>

            <p className="text-muted-foreground mb-6">
              {applicationsCount > 0
                ? `Tens ${applicationsCount} ${applicationsCount === 1 ? 'candidatura ativa' : 'candidaturas ativas'} em curso.`
                : 'Ainda não candidataste a nenhum quarto.'}
            </p>

            <Link to={applicationsCount > 0 ? '/applications' : '/search'}>
              <Button variant="primary">
                {applicationsCount > 0 ? 'Ver candidaturas' : 'Procurar quarto'}
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

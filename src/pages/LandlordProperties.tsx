import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PlusCircle, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import { PropertyStatus } from '../types/property';
import { PropertyCard } from '../components/PropertyCard';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { toast } from 'sonner';

export function LandlordProperties() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { properties, updatePropertyStatus, deleteProperty, getRoomsByProperty } = useProperties();

  const [filter, setFilter] = useState<'all' | PropertyStatus>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);

  if (user?.type !== 'landlord') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-6">
            Esta página é apenas para senhorios. Por favor, inicia sessão com uma conta de senhorio.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const landlordProperties = properties.filter(p => p.landlordId === user?.id);

  const filteredProperties = filter === 'all'
    ? landlordProperties
    : landlordProperties.filter(p => p.status === filter);

  const counts = {
    all: landlordProperties.length,
    active: landlordProperties.filter(p => p.status === 'active').length,
    paused: landlordProperties.filter(p => p.status === 'paused').length,
    draft: landlordProperties.filter(p => p.status === 'draft').length,
    archived: landlordProperties.filter(p => p.status === 'archived').length,
  };

  const handlePause = (id: string) => {
    updatePropertyStatus(id, 'paused');
    toast.success('Casa pausada com sucesso');
    setPausingId(null);
  };

  const handleReactivate = (id: string) => {
    updatePropertyStatus(id, 'active');
    toast.success('Casa reativada com sucesso');
  };

  const handlePublish = (id: string) => {
    updatePropertyStatus(id, 'active');
    toast.success('Casa publicada com sucesso');
  };

  const handleDelete = (id: string) => {
    deleteProperty(id);
    toast.success('Casa arquivada');
    setDeletingId(null);
  };

  const handleView = (id: string) => {
    navigate(`/landlord/property/${id}`);
  };

  const handleEdit = (_id: string) => {
    toast.info('Edição da propriedade em desenvolvimento');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              As Minhas Propriedades
            </h1>
            <p className="text-muted-foreground">
              Gere as tuas casas e quartos disponíveis
            </p>
          </div>
          <Button onClick={() => navigate('/landlord/new-listing')} size="lg">
            <PlusCircle className="w-5 h-5 mr-2" />
            Nova Propriedade
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2">
          <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />

          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'bg-card text-foreground hover:bg-muted border border-border'
            }`}
          >
            Todas ({counts.all})
          </button>

          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              filter === 'active'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-card text-foreground hover:bg-muted border border-border'
            }`}
          >
            Ativas ({counts.active})
          </button>

          <button
            onClick={() => setFilter('paused')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              filter === 'paused'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-card text-foreground hover:bg-muted border border-border'
            }`}
          >
            Pausadas ({counts.paused})
          </button>

          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              filter === 'draft'
                ? 'bg-gray-500 text-white shadow-md'
                : 'bg-card text-foreground hover:bg-muted border border-border'
            }`}
          >
            Rascunhos ({counts.draft})
          </button>

          <button
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              filter === 'archived'
                ? 'bg-gray-600 text-white shadow-md'
                : 'bg-card text-foreground hover:bg-muted border border-border'
            }`}
          >
            Arquivadas ({counts.archived})
          </button>
        </div>

        {filteredProperties.length === 0 ? (
          <Card className="p-16 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma propriedade encontrada</p>
            {filter === 'all' && (
              <Button onClick={() => navigate('/landlord/new-listing')}>
                <PlusCircle className="w-5 h-5 mr-2" />
                Criar Primeira Propriedade
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => {
              const propertyRooms = getRoomsByProperty(property.id);
              const availableRooms = propertyRooms.filter(r => r.status === 'available').length;

              return (
                <PropertyCard
                  key={property.id}
                  property={property}
                  roomCount={propertyRooms.length}
                  availableRooms={availableRooms}
                  onView={() => handleView(property.id)}
                  onEdit={() => handleEdit(property.id)}
                  onPause={property.status === 'active' ? () => setPausingId(property.id) : undefined}
                  onReactivate={property.status === 'paused' ? () => handleReactivate(property.id) : undefined}
                  onPublish={property.status === 'draft' ? () => handlePublish(property.id) : undefined}
                  onDelete={() => setDeletingId(property.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {pausingId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setPausingId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Pausar Propriedade</h3>
              <p className="text-muted-foreground mb-6">
                Tens a certeza que queres pausar esta propriedade? Todos os quartos deixarão de aparecer nas pesquisas até ser reativada.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setPausingId(null)}>
                  Cancelar
                </Button>
                <Button variant="primary" className="flex-1" onClick={() => handlePause(pausingId)}>
                  Pausar
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}

      {deletingId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setDeletingId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4 text-destructive">Arquivar Propriedade</h3>
              <p className="text-muted-foreground mb-6">
                Tens a certeza que queres arquivar esta propriedade? Todos os quartos ficarão indisponíveis.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeletingId(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-destructive hover:bg-destructive/90"
                  onClick={() => handleDelete(deletingId)}
                >
                  Arquivar
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
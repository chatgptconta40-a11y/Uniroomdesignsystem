import { useState } from 'react';
import { Edit, Pause, Play, Trash2, Eye, FileText, MessageCircle, BarChart3, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Accommodation, AccommodationStatus } from '../types/accommodation';
import { Button } from './Button';
import { Badge } from './Badge';
import { Card } from './Card';
import { useAccommodations } from '../context/AccommodationsContext';
import { toast } from 'sonner';

interface LandlordManagementPanelProps {
  accommodation: Accommodation;
}

interface EditModalProps {
  accommodation: Accommodation;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Accommodation>) => void;
}

function EditModal({ accommodation, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState({
    title: accommodation.title,
    city: accommodation.city,
    zone: accommodation.zone,
    price: accommodation.price,
    utilities: accommodation.utilities || 0,
    description: accommodation.description,
    roomType: accommodation.roomType,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(accommodation.id, formData);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Editar Anúncio</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cidade
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="Viseu">Viseu</option>
                  <option value="Lisboa">Lisboa</option>
                  <option value="Porto">Porto</option>
                  <option value="Coimbra">Coimbra</option>
                  <option value="Braga">Braga</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Zona
                </label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Preço (€/mês)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Despesas (€/mês)
                </label>
                <input
                  type="number"
                  value={formData.utilities}
                  onChange={(e) => setFormData({ ...formData, utilities: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tipo de Alojamento
              </label>
              <select
                value={formData.roomType}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value as any })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="private">Privado</option>
                <option value="shared">Partilhado</option>
                <option value="studio">Estúdio</option>
                <option value="apartment">Apartamento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                Guardar Alterações
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

export function LandlordManagementPanel({ accommodation }: LandlordManagementPanelProps) {
  const navigate = useNavigate();
  const { updateAccommodationStatus, updateAccommodation, deleteAccommodation } = useAccommodations();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const getStatusBadge = (status: AccommodationStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Ativo</Badge>;
      case 'paused':
        return <Badge variant="warning">Pausado</Badge>;
      case 'draft':
        return <Badge variant="default">Rascunho</Badge>;
      case 'archived':
        return <Badge variant="default" className="bg-muted text-muted-foreground">Arquivado</Badge>;
    }
  };

  const handlePause = () => {
    updateAccommodationStatus(accommodation.id, 'paused');
    toast.success('Anúncio pausado com sucesso');
    setShowPauseConfirm(false);
  };

  const handleReactivate = () => {
    updateAccommodationStatus(accommodation.id, 'active');
    toast.success('Anúncio reativado com sucesso');
  };

  const handlePublish = () => {
    updateAccommodationStatus(accommodation.id, 'active');
    toast.success('Anúncio publicado com sucesso');
  };

  const handleDelete = () => {
    deleteAccommodation(accommodation.id);
    toast.success('Anúncio eliminado');
    setShowDeleteConfirm(false);
    navigate('/landlord/listings');
  };

  const handleSaveEdit = (id: string, updates: Partial<Accommodation>) => {
    updateAccommodation(id, updates);
    toast.success('Anúncio atualizado com sucesso');
    setShowEditModal(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-blue-900">Estás a ver este anúncio como senhorio</p>
            <p className="text-sm text-blue-700">Gere o teu alojamento através dos botões abaixo</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">Estado do Anúncio</h3>
            {getStatusBadge(accommodation.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button variant="primary" className="w-full" onClick={() => setShowEditModal(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar Anúncio
          </Button>

          {accommodation.status === 'active' && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPauseConfirm(true)}
            >
              <Pause className="w-4 h-4 mr-2" />
              Pausar Anúncio
            </Button>
          )}

          {accommodation.status === 'paused' && (
            <Button
              variant="primary"
              className="w-full"
              onClick={handleReactivate}
            >
              <Play className="w-4 h-4 mr-2" />
              Reativar Anúncio
            </Button>
          )}

          {accommodation.status === 'draft' && (
            <Button
              variant="primary"
              className="w-full"
              onClick={handlePublish}
            >
              <Play className="w-4 h-4 mr-2" />
              Publicar Anúncio
            </Button>
          )}

          {(accommodation.status === 'active' || accommodation.status === 'paused') && (
            <Link to={`/landlord/applications?listing=${accommodation.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Ver Candidaturas
              </Button>
            </Link>
          )}

          <Link to="/messages" className="w-full">
            <Button variant="outline" className="w-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              Ver Mensagens
            </Button>
          </Link>

          <Link to="/landlord/analytics" className="w-full">
            <Button variant="outline" className="w-full">
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Analytics
            </Button>
          </Link>

          <Button
            variant="outline"
            className="w-full text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar Anúncio
          </Button>
        </div>
      </Card>

      {showPauseConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowPauseConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Pausar Anúncio</h3>
              <p className="text-muted-foreground mb-6">
                Tens a certeza que queres pausar este anúncio? Ele deixará de aparecer nas pesquisas até ser reativado.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowPauseConfirm(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" className="flex-1" onClick={handlePause}>
                  Pausar
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}

      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4 text-destructive">Eliminar Anúncio</h3>
              <p className="text-muted-foreground mb-6">
                Tens a certeza que queres eliminar este anúncio? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" className="flex-1 bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
                  Eliminar
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}

      {showEditModal && (
        <EditModal
          accommodation={accommodation}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
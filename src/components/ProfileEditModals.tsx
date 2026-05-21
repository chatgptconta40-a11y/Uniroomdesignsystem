import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { PersonalProfile, LifestyleProfile, AccommodationPreferences } from '../types/profile';
import { toast } from 'sonner';
import { Globe, X } from 'lucide-react';
import { Badge } from './Badge';

interface PersonalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PersonalProfile;
  onSave: (profile: PersonalProfile) => void;
}

export function PersonalEditModal({ isOpen, onClose, profile, onSave }: PersonalEditModalProps) {
  const [formData, setFormData] = useState<PersonalProfile>(profile);
  const [newLanguage, setNewLanguage] = useState('');

  const handleSave = () => {
    onSave(formData);
    toast.success('Alterações guardadas com sucesso');
    onClose();
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages?.includes(newLanguage.trim())) {
      setFormData({
        ...formData,
        languages: [...(formData.languages || []), newLanguage.trim()],
      });
      setNewLanguage('');
    }
  };

  const removeLanguage = (lang: string) => {
    setFormData({
      ...formData,
      languages: formData.languages?.filter(l => l !== lang) || [],
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Informação Pessoal"
      size="lg"
      footer={
        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar alterações
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nome completo"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          <Input
            label="Idade"
            type="number"
            value={formData.age?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
          />
          <Input
            label="Curso"
            value={formData.course || ''}
            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
          />
          <Input
            label="Instituição"
            value={formData.institution || ''}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
          />
          <Input
            label="Ano de curso"
            type="number"
            min="1"
            max="6"
            value={formData.yearOfStudy?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, yearOfStudy: Number(e.target.value) })}
          />
          <Input
            label="Cidade de origem"
            value={formData.hometown || ''}
            onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">Bio</label>
          <textarea
            value={formData.bio || ''}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
            placeholder="Fala um pouco sobre ti..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">Idiomas</label>
          <div className="flex gap-3 mb-3">
            <Input
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
              placeholder="Adicionar idioma..."
            />
            <Button variant="outline" onClick={addLanguage}>
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.languages?.map((lang, index) => (
              <Badge key={index} variant="default" className="flex items-center gap-2">
                <Globe className="w-3 h-3" />
                {lang}
                <button
                  onClick={() => removeLanguage(lang)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface LifestyleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: LifestyleProfile;
  onSave: (profile: LifestyleProfile) => void;
}

export function LifestyleEditModal({ isOpen, onClose, profile, onSave }: LifestyleEditModalProps) {
  const [formData, setFormData] = useState<LifestyleProfile>(profile);

  const handleSave = () => {
    onSave(formData);
    toast.success('Alterações guardadas com sucesso');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Perfil de Convivência"
      size="lg"
      footer={
        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar alterações
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Horários */}
        <div>
          <h4 className="text-lg font-bold mb-4">Horários</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Hora de deitar</label>
              <select
                value={formData.bedtime || ''}
                onChange={(e) => setFormData({ ...formData, bedtime: e.target.value as any })}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Selecionar</option>
                <option value="early">Cedo (antes 22h)</option>
                <option value="moderate">Normal (22h-00h)</option>
                <option value="late">Tarde (depois 00h)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Hora de acordar</label>
              <select
                value={formData.wakeupTime || ''}
                onChange={(e) => setFormData({ ...formData, wakeupTime: e.target.value as any })}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Selecionar</option>
                <option value="early">Cedo (antes 7h)</option>
                <option value="moderate">Normal (7h-9h)</option>
                <option value="late">Tarde (depois 9h)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Personalidade</label>
              <select
                value={formData.personality || ''}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value as any })}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Selecionar</option>
                <option value="introvert">Introvertido</option>
                <option value="moderate">Equilibrado</option>
                <option value="extrovert">Extrovertido</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hábitos */}
        <div>
          <h4 className="text-lg font-bold mb-4">Hábitos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.smoking || false}
                  onChange={(e) => setFormData({ ...formData, smoking: e.target.checked })}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-medium">Fumador</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pets || false}
                  onChange={(e) => setFormData({ ...formData, pets: e.target.checked })}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-medium">Tem animais de estimação</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Frequência de cozinhar</label>
              <select
                value={formData.cooking || ''}
                onChange={(e) => setFormData({ ...formData, cooking: e.target.value as any })}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Selecionar</option>
                <option value="never">Nunca</option>
                <option value="rarely">Raramente</option>
                <option value="sometimes">Às vezes</option>
                <option value="often">Frequentemente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Nível de limpeza (1-5)</label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.cleanliness || 3}
                onChange={(e) => setFormData({ ...formData, cleanliness: Number(e.target.value) })}
                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Desorganizado</span>
                <span className="font-bold text-primary">{formData.cleanliness || 3}</span>
                <span>Muito organizado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface PreferencesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AccommodationPreferences;
  onSave: (profile: AccommodationPreferences) => void;
}

export function PreferencesEditModal({ isOpen, onClose, profile, onSave }: PreferencesEditModalProps) {
  const [formData, setFormData] = useState<AccommodationPreferences>(profile);
  const [newCity, setNewCity] = useState('');

  const handleSave = () => {
    onSave(formData);
    toast.success('Alterações guardadas com sucesso');
    onClose();
  };

  const addCity = () => {
    if (newCity.trim() && !formData.preferredCities?.includes(newCity.trim())) {
      setFormData({
        ...formData,
        preferredCities: [...(formData.preferredCities || []), newCity.trim()],
      });
      setNewCity('');
    }
  };

  const removeCity = (city: string) => {
    setFormData({
      ...formData,
      preferredCities: formData.preferredCities?.filter(c => c !== city) || [],
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Preferências de Alojamento"
      size="lg"
      footer={
        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar alterações
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Orçamento máximo (€/mês)</label>
            <Input
              type="number"
              value={formData.maxBudget?.toString() || ''}
              onChange={(e) => setFormData({ ...formData, maxBudget: Number(e.target.value) })}
              placeholder="500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Tipo de quarto</label>
            <select
              value={formData.roomType || ''}
              onChange={(e) => setFormData({ ...formData, roomType: e.target.value as any })}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Selecionar</option>
              <option value="shared">Partilhado</option>
              <option value="private">Privado</option>
              <option value="studio">Estúdio</option>
              <option value="apartment">Apartamento</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">Cidades preferenciais</label>
          <div className="flex gap-3 mb-3">
            <Input
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCity()}
              placeholder="Adicionar cidade..."
            />
            <Button variant="outline" onClick={addCity}>
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.preferredCities?.map((city, index) => (
              <Badge key={index} variant="default" className="flex items-center gap-2">
                {city}
                <button
                  onClick={() => removeCity(city)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold mb-4">Comodidades desejadas</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'furnished', label: 'Mobilado' },
              { key: 'wifi', label: 'WiFi' },
              { key: 'kitchen', label: 'Cozinha' },
              { key: 'washingMachine', label: 'Máquina de lavar' },
              { key: 'balcony', label: 'Varanda' },
              { key: 'parking', label: 'Estacionamento' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.amenities?.[key as keyof typeof formData.amenities] || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amenities: {
                        ...formData.amenities,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

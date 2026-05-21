import { AccommodationPreferences } from '../../types/profile';
import { Input } from '../Input';
import { Checkbox } from '../Checkbox';
import { OptionCard } from '../OptionCard';
import { Home as HomeIcon, Bed, Building2, Home, Check } from 'lucide-react';

interface OnboardingPreferencesProps {
  data: Partial<AccommodationPreferences>;
  onChange: (data: Partial<AccommodationPreferences>) => void;
}

export function OnboardingPreferences({ data, onChange }: OnboardingPreferencesProps) {
  const handleChange = (field: keyof AccommodationPreferences, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleAmenityChange = (amenity: string, value: boolean) => {
    onChange({
      ...data,
      amenities: {
        ...data.amenities,
        [amenity]: value,
      },
    });
  };

  const cities = ['Lisboa', 'Porto', 'Coimbra', 'Braga', 'Aveiro', 'Faro'];

  const toggleCity = (city: string) => {
    const current = data.preferredCities || [];
    const updated = current.includes(city)
      ? current.filter(c => c !== city)
      : [...current, city];
    handleChange('preferredCities', updated);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-accent/10 rounded-xl">
          <HomeIcon className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2>Preferências de Alojamento</h2>
          <p className="text-muted-foreground">
            Ajuda-nos a encontrar o alojamento perfeito para ti
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Orçamento máximo mensal (€)"
            type="number"
            value={data.maxBudget || ''}
            onChange={(e) => handleChange('maxBudget', Number(e.target.value))}
            placeholder="400"
            helperText="Valor máximo que podes gastar por mês"
          />

          <Input
            label="Distância máxima da universidade (km)"
            type="number"
            value={data.maxDistanceFromUniversity || ''}
            onChange={(e) => handleChange('maxDistanceFromUniversity', Number(e.target.value))}
            placeholder="5"
            helperText="Raio de distância aceitável"
          />
        </div>

        <div>
          <label className="block mb-3 text-sm font-medium text-foreground">
            Cidades preferenciais
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => toggleCity(city)}
                className={`relative p-4 border-2 rounded-xl transition-all ${
                  data.preferredCities?.includes(city)
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {data.preferredCities?.includes(city) && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className="font-medium">{city}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Data prevista de entrada"
            type="date"
            value={data.moveInDate ? new Date(data.moveInDate).toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange('moveInDate', new Date(e.target.value))}
          />

          <Input
            label="Duração prevista da estadia (meses)"
            type="number"
            value={data.stayDuration || ''}
            onChange={(e) => handleChange('stayDuration', Number(e.target.value))}
            placeholder="10"
            helperText="Quantos meses planeias ficar"
          />
        </div>

        <div>
          <label className="block mb-3 text-sm font-medium text-foreground">
            Tipo de quarto ou alojamento
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <OptionCard
              selected={data.roomType === 'shared'}
              onClick={() => handleChange('roomType', 'shared')}
              icon={<Bed className="w-5 h-5 text-primary" />}
              title="Quarto partilhado"
            />
            <OptionCard
              selected={data.roomType === 'private'}
              onClick={() => handleChange('roomType', 'private')}
              icon={<HomeIcon className="w-5 h-5 text-primary" />}
              title="Quarto privado"
            />
            <OptionCard
              selected={data.roomType === 'studio'}
              onClick={() => handleChange('roomType', 'studio')}
              icon={<Building2 className="w-5 h-5 text-primary" />}
              title="Estúdio"
            />
            <OptionCard
              selected={data.roomType === 'apartment'}
              onClick={() => handleChange('roomType', 'apartment')}
              icon={<Home className="w-5 h-5 text-primary" />}
              title="Apartamento"
            />
          </div>
        </div>

        <div>
          <label className="block mb-3 text-sm font-medium text-foreground">
            Características desejadas
          </label>
          <div className="p-5 bg-muted/30 rounded-xl space-y-3">
            <Checkbox
              label="Mobilado"
              checked={data.amenities?.furnished || false}
              onChange={(e) => handleAmenityChange('furnished', e.target.checked)}
            />
            <Checkbox
              label="WiFi incluído"
              checked={data.amenities?.wifi || false}
              onChange={(e) => handleAmenityChange('wifi', e.target.checked)}
            />
            <Checkbox
              label="Despesas incluídas"
              checked={data.amenities?.utilitiesIncluded || false}
              onChange={(e) => handleAmenityChange('utilitiesIncluded', e.target.checked)}
            />
            <Checkbox
              label="Cozinha equipada"
              checked={data.amenities?.kitchen || false}
              onChange={(e) => handleAmenityChange('kitchen', e.target.checked)}
            />
            <Checkbox
              label="Máquina de lavar"
              checked={data.amenities?.washingMachine || false}
              onChange={(e) => handleAmenityChange('washingMachine', e.target.checked)}
            />
            <Checkbox
              label="Varanda"
              checked={data.amenities?.balcony || false}
              onChange={(e) => handleAmenityChange('balcony', e.target.checked)}
            />
            <Checkbox
              label="Estacionamento"
              checked={data.amenities?.parking || false}
              onChange={(e) => handleAmenityChange('parking', e.target.checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

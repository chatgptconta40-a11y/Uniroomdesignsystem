import { AccommodationPreferences } from '../../types/profile';
import { Input } from '../Input';
import { Checkbox } from '../Checkbox';
import { OptionCard } from '../OptionCard';
import {
  Home as HomeIcon,
  Bed,
  Building2,
  Home,
  Check,
  Euro,
  MapPin,
  CalendarDays,
  WashingMachine,
  Wifi,
  Utensils,
  Car,
} from 'lucide-react';

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

  const parseOptionalNumber = (value: string) => {
    if (!value) return undefined;
    return Number(value);
  };

  const cities = ['Viseu', 'Lisboa', 'Porto', 'Coimbra', 'Braga', 'Aveiro'];

  const toggleCity = (city: string) => {
    const current = data.preferredCities || [];
    const updated = current.includes(city)
      ? current.filter(item => item !== city)
      : [...current, city];

    handleChange('preferredCities', updated);
  };

  return (
    <div>
      <div className="flex items-start gap-3 mb-6">
        <div className="p-3 bg-accent/10 rounded-xl">
          <HomeIcon className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2>Preferências de alojamento</h2>
          <p className="text-muted-foreground">
            Define o que é essencial para a tua procura. Podes ajustar estes filtros mais tarde.
          </p>
        </div>
      </div>

      <div className="space-y-7">
        <section className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Euro className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Orçamento e distância</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Orçamento máximo mensal"
              type="number"
              min={150}
              max={1200}
              value={data.maxBudget || ''}
              onChange={(event) => handleChange('maxBudget', parseOptionalNumber(event.target.value))}
              placeholder="400"
              helperText="Inclui apenas a renda. As despesas podem aparecer separadas."
            />

            <Input
              label="Distância máxima da universidade"
              type="number"
              min={0.1}
              max={30}
              step={0.1}
              value={data.maxDistanceFromUniversity || ''}
              onChange={(event) => handleChange('maxDistanceFromUniversity', parseOptionalNumber(event.target.value))}
              placeholder="3"
              helperText="Distância aproximada em quilómetros."
            />
          </div>
        </section>

        <section className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Localização</h3>
          </div>

          <label className="block mb-3 text-sm font-medium text-foreground">
            Cidades onde procuras alojamento
          </label>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => toggleCity(city)}
                className={`relative p-4 border-2 rounded-xl transition-all text-left ${
                  data.preferredCities?.includes(city)
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                {data.preferredCities?.includes(city) && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className="font-medium">{city}</p>
                {city === 'Viseu' && (
                  <p className="text-xs text-muted-foreground mt-1">Recomendado para ESTGV</p>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Entrada e duração</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Data prevista de entrada"
              type="date"
              value={data.moveInDate ? new Date(data.moveInDate).toISOString().split('T')[0] : ''}
              onChange={(event) => handleChange('moveInDate', event.target.value ? new Date(event.target.value) : undefined)}
              helperText="Ajuda a mostrar quartos disponíveis na altura certa."
            />

            <Input
              label="Duração prevista da estadia"
              type="number"
              min={1}
              max={36}
              value={data.stayDuration || ''}
              onChange={(event) => handleChange('stayDuration', parseOptionalNumber(event.target.value))}
              placeholder="10"
              helperText="Número aproximado de meses."
            />
          </div>
        </section>

        <section className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Bed className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Tipo de alojamento</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <OptionCard
              selected={data.roomType === 'shared'}
              onClick={() => handleChange('roomType', 'shared')}
              icon={<Bed className="w-5 h-5 text-primary" />}
              title="Quarto partilhado"
              description="Mais económico"
            />

            <OptionCard
              selected={data.roomType === 'private'}
              onClick={() => handleChange('roomType', 'private')}
              icon={<HomeIcon className="w-5 h-5 text-primary" />}
              title="Quarto privado"
              description="Equilíbrio entre preço e privacidade"
            />

            <OptionCard
              selected={data.roomType === 'studio'}
              onClick={() => handleChange('roomType', 'studio')}
              icon={<Building2 className="w-5 h-5 text-primary" />}
              title="Estúdio"
              description="Espaço independente"
            />

            <OptionCard
              selected={data.roomType === 'apartment'}
              onClick={() => handleChange('roomType', 'apartment')}
              icon={<Home className="w-5 h-5 text-primary" />}
              title="Apartamento"
              description="Casa inteira"
            />
          </div>
        </section>

        <section className="p-5 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <WashingMachine className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Características importantes</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Checkbox
              label="Mobilado"
              checked={data.amenities?.furnished || false}
              onChange={(event) => handleAmenityChange('furnished', event.target.checked)}
            />

            <Checkbox
              label="Despesas incluídas"
              checked={data.amenities?.utilitiesIncluded || false}
              onChange={(event) => handleAmenityChange('utilitiesIncluded', event.target.checked)}
            />

            <Checkbox
              label="Wi-Fi incluído"
              checked={data.amenities?.wifi || false}
              onChange={(event) => handleAmenityChange('wifi', event.target.checked)}
            />

            <Checkbox
              label="Cozinha equipada"
              checked={data.amenities?.kitchen || false}
              onChange={(event) => handleAmenityChange('kitchen', event.target.checked)}
            />

            <Checkbox
              label="Máquina de lavar"
              checked={data.amenities?.washingMachine || false}
              onChange={(event) => handleAmenityChange('washingMachine', event.target.checked)}
            />

            <Checkbox
              label="Varanda"
              checked={data.amenities?.balcony || false}
              onChange={(event) => handleAmenityChange('balcony', event.target.checked)}
            />

            <Checkbox
              label="Estacionamento"
              checked={data.amenities?.parking || false}
              onChange={(event) => handleAmenityChange('parking', event.target.checked)}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-primary" />
              Wi-Fi e despesas aparecem nos filtros.
            </div>
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-primary" />
              Cozinha e máquina de lavar ajudam na comparação.
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" />
              Estacionamento é opcional para estudantes.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
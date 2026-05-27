import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  GraduationCap,
  MapPin,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { Button } from '../../components/Button';

type SearchMode = 'rooms' | 'houses';

export interface HomeSearchFilters {
  mode: SearchMode;
  city: string;
  university: string;
  maxPrice: string;
  roomType: string;
  moveIn: string;
}

interface HeroProps {
  onSearch: (filters: HomeSearchFilters) => void;
}

export function Hero({ onSearch }: HeroProps) {
  const [mode, setMode] = useState<SearchMode>('rooms');
  const [city, setCity] = useState('Viseu');
  const [university, setUniversity] = useState('ESTGV - Viseu');
  const [maxPrice, setMaxPrice] = useState('400');
  const [roomType, setRoomType] = useState('private');
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCalendar) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const scrollToListings = () => {
    document.getElementById('quartos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleModeChange = (next: SearchMode) => {
    setMode(next);
    if (next === 'houses') scrollToListings();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const moveIn = moveInDate ? format(moveInDate, 'yyyy-MM-dd') : '';
    onSearch({ mode, city, university, maxPrice, roomType, moveIn });
    scrollToListings();
  };

  const moveInLabel = moveInDate ? format(moveInDate, "dd/MM/yyyy", { locale: pt }) : '';

  return (
    <section className="relative bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1800&q=85')",
        }}
      />
      <div className="absolute inset-0 bg-slate-950/50" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pt-12 md:pt-16 pb-8 md:pb-10">
        <div className="mx-auto max-w-4xl text-center text-white">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Quartos verificados perto da tua universidade
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Encontra o quarto certo perto da tua universidade
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base md:text-lg leading-relaxed text-white/85">
            Vê distância a pé, regras da casa, compatibilidade com os moradores e disponibilidade real — antes de perderes tempo com visitas.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-6xl rounded-2xl bg-white shadow-2xl">
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => handleModeChange('rooms')}
              className={`px-6 py-4 text-sm font-bold transition-colors ${
                mode === 'rooms'
                  ? 'border-b-4 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Procurar quartos
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('houses')}
              className={`px-6 py-4 text-sm font-bold transition-colors ${
                mode === 'houses'
                  ? 'border-b-4 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ver casas
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <label className="md:col-span-3">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Cidade</span>
                <span className="relative block">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <select
                    value={city}
                    onChange={event => setCity(event.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-border bg-white pl-10 pr-9 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="Viseu">Viseu</option>
                    <option value="Lisboa">Lisboa</option>
                    <option value="Porto">Porto</option>
                    <option value="Coimbra">Coimbra</option>
                    <option value="Braga">Braga</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </span>
              </label>

              <label className="md:col-span-4">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Instituição</span>
                <span className="relative block">
                  <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <select
                    value={university}
                    onChange={event => setUniversity(event.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-border bg-white pl-10 pr-9 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="ESTGV - Viseu">ESTGV - Viseu</option>
                    <option value="Universidade de Lisboa">Universidade de Lisboa</option>
                    <option value="Universidade do Porto">Universidade do Porto</option>
                    <option value="Universidade de Coimbra">Universidade de Coimbra</option>
                    <option value="Universidade do Minho">Universidade do Minho</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </span>
              </label>

              <label className="md:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Preço até</span>
                <span className="relative block">
                  <input
                    value={maxPrice}
                    onChange={event => setMaxPrice(event.target.value)}
                    inputMode="numeric"
                    className="h-12 w-full rounded-xl border border-border bg-white px-4 pr-9 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary"
                    placeholder="400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">€</span>
                </span>
              </label>

              <label className="md:col-span-3">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Tipo</span>
                <span className="relative block">
                  <select
                    value={roomType}
                    onChange={event => setRoomType(event.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-border bg-white px-4 pr-9 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="private">Quarto privado</option>
                    <option value="shared">Quarto partilhado</option>
                    <option value="studio">Estúdio independente</option>
                    <option value="any">Qualquer tipo</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </span>
              </label>

              <div className="md:col-span-5">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Entrada</span>
                <div className="relative" ref={calendarRef}>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(prev => !prev)}
                    className={`h-12 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-left text-sm font-semibold outline-none transition-colors focus:border-primary ${
                      moveInLabel ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                    {moveInLabel || 'Escolher data de entrada'}
                  </button>

                  {showCalendar && (
                    <div className="absolute left-0 right-0 sm:right-auto sm:w-auto top-full z-40 mt-2 rounded-2xl border border-border bg-white p-3 shadow-xl">
                      <DayPicker
                        mode="single"
                        locale={pt}
                        selected={moveInDate}
                        onSelect={date => {
                          setMoveInDate(date);
                          if (date) setShowCalendar(false);
                        }}
                        weekStartsOn={1}
                        fromDate={new Date()}
                      />
                      {moveInDate && (
                        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
                          <span className="font-semibold text-foreground">
                            {format(moveInDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt })}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMoveInDate(undefined)}
                            className="font-semibold text-primary hover:underline"
                          >
                            Limpar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-7 md:flex md:items-end">
                <Button type="submit" variant="primary" className="h-12 w-full rounded-xl">
                  <Search className="h-5 w-5" />
                  Pesquisar
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

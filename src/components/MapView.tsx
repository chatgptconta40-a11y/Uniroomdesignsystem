import { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Heart, ExternalLink, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { Accommodation } from '../types/accommodation';
import { Button } from './Button';
import { Badge } from './Badge';
import { Card } from './Card';
import { useFavorites } from '../context/FavoritesContext';
import { toast } from 'sonner';

interface MapViewProps {
  accommodations: Accommodation[];
}

const cityPositions: Record<string, { x: number; y: number }> = {
  Porto: { x: 20, y: 22 },
  Braga: { x: 24, y: 14 },
  Coimbra: { x: 28, y: 45 },
  Viseu: { x: 38, y: 38 },
  Lisboa: { x: 20, y: 72 },
};

export function MapView({ accommodations }: MapViewProps) {
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const getCompatibilityColor = (score?: number) => {
    if (!score) return 'bg-muted border-border';
    if (score >= 80) return 'bg-green-500 border-green-600';
    if (score >= 60) return 'bg-amber-400 border-amber-500';
    return 'bg-orange-500 border-orange-600';
  };

  const handleToggleFavorite = (event: React.MouseEvent, accommodationId: string) => {
    event.preventDefault();
    event.stopPropagation();

    const newState = toggleFavorite(accommodationId);
    toast.success(newState ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
  };

  const groupedByCity = accommodations.reduce((accumulator, accommodation) => {
    const city = accommodation.city;

    if (!accumulator[city]) {
      accumulator[city] = [];
    }

    accumulator[city].push(accommodation);
    return accumulator;
  }, {} as Record<string, Accommodation[]>);

  const uniqueCities = [...new Set(accommodations.map(accommodation => accommodation.city))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">{accommodations.length}</span>
            <span>alojamentos no mapa</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{uniqueCities.length}</span>
            <span>cidades</span>
          </div>
        </div>
      </div>

      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/40 via-card to-slate-50/40 h-[650px] rounded-xl shadow-lg border border-border">
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.025]">
            <defs>
              <pattern id="map-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1" fill="#475569" />
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#475569" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map-grid)" />
          </svg>

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="portugalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#dbeafe', stopOpacity: 0.4 }} />
                <stop offset="100%" style={{ stopColor: '#e0f2fe', stopOpacity: 0.6 }} />
              </linearGradient>
              <filter id="softShadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="0" dy="1" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.2" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d="M 14,10 L 28,6 L 34,8 L 36,12 L 34,16 L 30,20 L 27,25 L 26,32 L 28,38 L 30,44 L 32,50 L 30,56 L 28,62 L 26,68 L 24,74 L 22,80 L 20,86 L 18,91 L 15,94 L 12,92 L 10,88 L 11,82 L 10,76 L 9,70 L 8,64 L 9,58 L 8,52 L 9,46 L 8,40 L 9,34 L 10,28 L 11,22 L 12,16 L 14,10 Z"
              fill="url(#portugalGradient)"
              stroke="#93c5fd"
              strokeWidth="0.4"
              filter="url(#softShadow)"
            />
          </svg>

          <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none">
            <line x1="20%" y1="22%" x2="24%" y2="14%" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,2" />
            <line x1="20%" y1="22%" x2="28%" y2="45%" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,2" />
            <line x1="28%" y1="45%" x2="38%" y2="38%" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,2" />
            <line x1="28%" y1="45%" x2="20%" y2="72%" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,2" />
          </svg>

          {Object.entries(cityPositions).map(([city, position]) => {
            const cityAccommodations = groupedByCity[city] || [];
            const count = cityAccommodations.length;

            return (
              <div
                key={city}
                className="absolute pointer-events-none z-[5]"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="flex flex-col items-center">
                  <div className="bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-primary/20 mb-1">
                    <span className="text-sm font-bold text-slate-800">{city}</span>
                  </div>

                  {count > 0 && (
                    <div className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                      {count}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {Object.entries(groupedByCity).map(([city, cityAccommodations]) => {
            const basePosition = cityPositions[city];

            if (!basePosition) return null;

            return cityAccommodations.map((accommodation, index) => {
              const totalInCity = cityAccommodations.length;
              const angle = (index / Math.max(totalInCity, 1)) * 360 * (Math.PI / 180);
              const radius = totalInCity > 1 ? 4.5 + Math.floor(index / 5) * 2.5 : 0;
              const offsetX = Math.cos(angle) * radius;
              const offsetY = Math.sin(angle) * radius;
              const isSelected = selectedAccommodation?.id === accommodation.id;

              return (
                <button
                  key={accommodation.id}
                  onClick={() => setSelectedAccommodation(accommodation)}
                  className={`absolute group transition-all duration-300 ${
                    isSelected ? 'z-20' : 'z-10 hover:z-[15]'
                  }`}
                  style={{
                    left: `${basePosition.x + offsetX}%`,
                    top: `${basePosition.y + offsetY + 3.5}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  {isSelected && (
                    <>
                      <div className="absolute inset-0 -m-3 rounded-lg bg-primary/20 animate-ping" />
                      <div className="absolute inset-0 -m-2 rounded-lg bg-primary/30" />
                    </>
                  )}

                  <div className="relative">
                    <div
                      className={`px-3 py-1.5 rounded-lg shadow-lg border-2 font-bold text-xs whitespace-nowrap transition-all ${
                        getCompatibilityColor(accommodation.compatibilityScore)
                      } ${
                        isSelected
                          ? 'text-white shadow-2xl scale-125 ring-4 ring-white/50'
                          : 'text-white group-hover:shadow-2xl group-hover:scale-110 group-hover:ring-2 group-hover:ring-white/30'
                      }`}
                    >
                      €{accommodation.price}
                    </div>

                    <div
                      className={`w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent mx-auto ${
                        accommodation.compatibilityScore && accommodation.compatibilityScore >= 80
                          ? 'border-t-green-600'
                          : accommodation.compatibilityScore && accommodation.compatibilityScore >= 60
                          ? 'border-t-amber-500'
                          : 'border-t-orange-600'
                      }`}
                    />
                  </div>

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 group-hover:translate-y-[-4px]">
                    <div className="bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl min-w-[220px] border border-slate-700">
                      <div className="font-bold text-sm mb-1">{accommodation.title}</div>
                      <div className="text-slate-300 text-xs mb-2">
                        {accommodation.zone}, {accommodation.city}
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        {accommodation.compatibilityScore && (
                          <div>
                            <span
                              className={`font-bold text-sm ${
                                accommodation.compatibilityScore >= 80
                                  ? 'text-green-400'
                                  : accommodation.compatibilityScore >= 60
                                  ? 'text-amber-400'
                                  : 'text-orange-400'
                              }`}
                            >
                              {accommodation.compatibilityScore}%
                            </span>
                            <span className="text-slate-400 ml-1">compatível</span>
                          </div>
                        )}

                        <div className="text-slate-400">
                          {accommodation.distanceToUniversity}km da universidade
                        </div>
                      </div>
                    </div>

                    <div className="w-3 h-3 bg-slate-900 rotate-45 mx-auto -mt-1.5 border-l border-b border-slate-700" />
                  </div>
                </button>
              );
            });
          })}
        </div>

        <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-slate-200/60 overflow-hidden z-30">
          <button
            className="w-12 h-12 flex items-center justify-center hover:bg-primary/10 transition-all border-b border-slate-200 group"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
          </button>

          <button
            className="w-12 h-12 flex items-center justify-center hover:bg-primary/10 transition-all border-b border-slate-200 group"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
          </button>

          <button
            className="w-12 h-12 flex items-center justify-center hover:bg-primary/10 transition-all group"
            title="Centrar mapa"
          >
            <Maximize2 className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
          </button>
        </div>

        <div
          className={`absolute left-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-slate-200/60 p-4 z-30 transition-all duration-300 ${
            selectedAccommodation ? 'bottom-auto top-6' : 'bottom-6'
          }`}
        >
          <div className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-primary rounded-full" />
            Compatibilidade
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-md bg-green-500 border-2 border-green-600 shadow-sm" />
              <span className="text-sm text-slate-700 font-medium">Alta &gt;80%</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-md bg-amber-400 border-2 border-amber-500 shadow-sm" />
              <span className="text-sm text-slate-700 font-medium">Média 60-80%</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-md bg-orange-500 border-2 border-orange-600 shadow-sm" />
              <span className="text-sm text-slate-700 font-medium">Baixa &lt;60%</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 z-30">
          <p className="text-xs text-slate-400 italic bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200">
            Mapa aproximado para fins de protótipo
          </p>
        </div>

        {selectedAccommodation && (
          <div className="absolute bottom-6 left-6 right-6 md:bottom-6 md:right-6 md:left-auto md:w-96 z-20 animate-in slide-in-from-bottom-6 md:slide-in-from-right-6 duration-300">
            <Card className="p-5 shadow-2xl border-2 border-primary/40 bg-white/98 backdrop-blur-md">
              <button
                onClick={() => setSelectedAccommodation(null)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700 text-xl font-light"
                aria-label="Fechar detalhe do mapa"
              >
                ×
              </button>

              <div className="flex gap-4 mb-4">
                <img
                  src={selectedAccommodation.images[0]}
                  alt={selectedAccommodation.title}
                  className="w-24 h-24 rounded-xl object-cover flex-shrink-0 shadow-md"
                />

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-foreground mb-1.5 line-clamp-2">
                    {selectedAccommodation.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedAccommodation.zone}, {selectedAccommodation.city}
                  </p>

                  <p className="text-2xl font-bold text-primary">
                    €{selectedAccommodation.price}
                    <span className="text-sm text-muted-foreground font-normal">/mês</span>
                  </p>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 flex-wrap">
                {selectedAccommodation.compatibilityScore && (
                  <Badge
                    variant={
                      selectedAccommodation.compatibilityScore >= 80
                        ? 'success'
                        : selectedAccommodation.compatibilityScore >= 60
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {selectedAccommodation.compatibilityScore}% compatível
                  </Badge>
                )}

                {selectedAccommodation.verified && (
                  <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-300">
                    Verificado
                  </Badge>
                )}
              </div>

              <div className="space-y-2.5 mb-5 text-sm">
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border">
                  <span className="text-muted-foreground">Distância à universidade</span>
                  <span className="font-bold text-foreground">
                    {selectedAccommodation.distanceToUniversity}km
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-semibold text-foreground">
                    {selectedAccommodation.roomType === 'private' ? 'Privado' : 'Partilhado'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link to={`/accommodation/${selectedAccommodation.id}`} className="flex-1">
                  <Button variant="primary" size="md" className="w-full shadow-md">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver detalhes
                  </Button>
                </Link>

                <Button
                  variant={isFavorite(selectedAccommodation.id) ? 'secondary' : 'outline'}
                  size="md"
                  onClick={(event) => handleToggleFavorite(event, selectedAccommodation.id)}
                  className="shadow-md"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isFavorite(selectedAccommodation.id) ? 'fill-current' : ''
                    }`}
                  />
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}
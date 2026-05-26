import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { Button } from './Button';

interface LocationMapProps {
  address: string;
  zone: string;
  city: string;
}

export function LocationMap({ address, zone, city }: LocationMapProps) {
  const query = [address, zone, city, 'Portugal'].filter(Boolean).join(', ');
  const encodedQuery = encodeURIComponent(query);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}`;
  const embedUrl = `https://www.google.com/maps?q=${encodedQuery}&output=embed`;

  return (
    <div className="space-y-3">
      <div className="relative h-80 overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
        <iframe
          title={`Mapa de ${zone}, ${city}`}
          src={embedUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />

        <div className="pointer-events-none absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{zone}</p>
              <p className="truncate text-xs text-muted-foreground">{address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl border-primary/20 text-sm hover:bg-primary/5"
          onClick={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="w-4 h-4 text-primary" />
          Abrir localização
        </Button>

        <Button
          variant="primary"
          className="w-full h-12 rounded-xl shadow-sm text-sm"
          onClick={() => window.open(directionsUrl, '_blank', 'noopener,noreferrer')}
        >
          <Navigation className="w-4 h-4" />
          Como chegar
        </Button>
      </div>
    </div>
  );
}
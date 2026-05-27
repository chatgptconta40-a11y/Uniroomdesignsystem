import { ExternalLink, MapPin, Navigation } from 'lucide-react';

interface LocationMapProps {
  address: string;
  zone: string;
  city: string;
  mapHeightClass?: string;
}

export function LocationMap({ address, zone, city, mapHeightClass = 'h-80' }: LocationMapProps) {
  const fullAddress = [address, zone, city, 'Portugal'].filter(Boolean).join(', ');
  const query = encodeURIComponent(fullAddress);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  const embedUrl = `https://www.google.com/maps?q=${query}&output=embed`;

  return (
    <div className="space-y-3">
      <div className={`relative ${mapHeightClass} w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-sm`}>
        <iframe
          title={`Mapa de ${zone}, ${city}`}
          src={embedUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />

        <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-xl border border-border bg-white/95 px-3 py-2 shadow-md backdrop-blur">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{zone}</p>
              <p className="truncate text-xs text-muted-foreground">{address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <ExternalLink className="h-4 w-4" />
          Ver no Google Maps
        </a>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
        >
          <Navigation className="h-4 w-4" />
          Obter direções
        </a>
      </div>
    </div>
  );
}

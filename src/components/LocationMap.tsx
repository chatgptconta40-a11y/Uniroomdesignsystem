import { MapPin, GraduationCap, Bus, ShoppingCart, Coffee, ExternalLink } from 'lucide-react';

interface LocationMapProps {
  address: string;
  zone: string;
  city: string;
}

export function LocationMap({ address, zone, city }: LocationMapProps) {
  const handleOpenMaps = () => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-slate-100 via-blue-50 to-green-50 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Map Background - Streets and Blocks */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
          </pattern>
          <filter id="shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1"/>
          </filter>
        </defs>

        {/* Base grid */}
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.4" />

        {/* Main streets - more visible */}
        <line x1="0" y1="45%" x2="100%" y2="45%" stroke="#94a3b8" strokeWidth="7" opacity="0.8" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#94a3b8" strokeWidth="7" opacity="0.8" />
        <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#94a3b8" strokeWidth="5" opacity="0.7" />
        <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#94a3b8" strokeWidth="5" opacity="0.7" />
        <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#94a3b8" strokeWidth="5" opacity="0.7" />
        <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#94a3b8" strokeWidth="5" opacity="0.7" />

        {/* Secondary streets */}
        <line x1="0" y1="15%" x2="100%" y2="15%" stroke="#b0bbc7" strokeWidth="3" opacity="0.6" />
        <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#b0bbc7" strokeWidth="3" opacity="0.6" />
        <line x1="15%" y1="0" x2="15%" y2="100%" stroke="#b0bbc7" strokeWidth="3" opacity="0.6" />
        <line x1="65%" y1="0" x2="65%" y2="100%" stroke="#b0bbc7" strokeWidth="3" opacity="0.6" />

        {/* Urban blocks - more contrast */}
        <rect x="10%" y="10%" width="12%" height="12%" fill="#e8edf3" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" rx="3" />
        <rect x="28%" y="8%" width="15%" height="14%" fill="#e8edf3" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" rx="3" />
        <rect x="78%" y="12%" width="10%" height="10%" fill="#e8edf3" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" rx="3" />
        <rect x="8%" y="52%" width="14%" height="16%" fill="#e8edf3" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" rx="3" />
        <rect x="60%" y="55%" width="12%" height="12%" fill="#e8edf3" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" rx="3" />
        <rect x="28%" y="75%" width="16%" height="10%" fill="#e8edf3" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" rx="3" />
        <rect x="55%" y="15%" width="8%" height="8%" fill="#e8edf3" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" rx="3" />
        <rect x="12%" y="28%" width="10%" height="14%" fill="#e8edf3" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" rx="3" />

        {/* Green spaces - more vibrant */}
        <ellipse cx="85%" cy="75%" rx="8%" ry="10%" fill="#d1fae5" opacity="0.7" />
        <rect x="5%" y="28%" width="5%" height="5%" fill="#d1fae5" opacity="0.7" rx="2" />
      </svg>

      {/* Zone labels - better contrast */}
      <div className="absolute top-5 left-5 text-xs font-semibold text-slate-500 pointer-events-none">
        {city} Norte
      </div>
      <div className="absolute bottom-5 right-5 text-xs font-semibold text-slate-500 pointer-events-none">
        {city} Sul
      </div>
      <div className="absolute top-1/3 right-8 text-xs font-semibold text-slate-500 pointer-events-none">
        Centro Histórico
      </div>

      {/* Google Maps Button */}
      <button
        onClick={handleOpenMaps}
        className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-slate-200 hover:bg-white hover:shadow-lg transition-all duration-200 flex items-center gap-2 z-30 group"
      >
        <span className="text-xs font-semibold text-slate-700 group-hover:text-primary transition-colors">Ver no Google Maps</span>
        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-primary transition-colors" />
      </button>

      {/* Points of Interest */}

      {/* University */}
      <div className="absolute top-[30%] left-[65%] -translate-x-1/2 -translate-y-1/2 group z-10">
        <div className="w-10 h-10 bg-secondary rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ring-2 ring-white">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-xl border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          <p className="text-xs font-bold text-slate-800">Universidade</p>
          <p className="text-[10px] text-slate-500">800m</p>
        </div>
      </div>

      {/* Transport */}
      <div className="absolute top-[55%] left-[40%] -translate-x-1/2 -translate-y-1/2 group z-10">
        <div className="w-9 h-9 bg-accent rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ring-2 ring-white">
          <Bus className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-xl border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
          <p className="text-xs font-bold text-slate-800">Paragem</p>
          <p className="text-[10px] text-slate-500">150m</p>
        </div>
      </div>

      {/* Supermarket */}
      <div className="absolute top-[40%] left-[30%] -translate-x-1/2 -translate-y-1/2 group z-10">
        <div className="w-9 h-9 bg-primary rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ring-2 ring-white">
          <ShoppingCart className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-xl border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
          <p className="text-xs font-bold text-slate-800">Supermercado</p>
          <p className="text-[10px] text-slate-500">450m</p>
        </div>
      </div>

      {/* Cafes/Restaurants */}
      <div className="absolute top-[65%] left-[60%] -translate-x-1/2 -translate-y-1/2 group z-10">
        <div className="w-9 h-9 bg-secondary rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ring-2 ring-white">
          <Coffee className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-xl border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
          <p className="text-xs font-bold text-slate-800">Cafés/Restaurantes</p>
          <p className="text-[10px] text-slate-500">300m</p>
        </div>
      </div>

      {/* Main Location Pin - Center with glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="relative flex flex-col items-center">
          {/* Glow effect */}
          <div className="absolute inset-0 w-16 h-16 bg-destructive/30 rounded-full blur-xl animate-pulse -translate-y-2" style={{ animationDuration: '2s' }} />

          {/* Pin icon - larger with better shadow */}
          <div className="relative w-14 h-14 bg-destructive rounded-full shadow-2xl flex items-center justify-center ring-4 ring-white animate-bounce" style={{ animationDuration: '2.5s' }}>
            <MapPin className="w-7 h-7 text-white fill-white drop-shadow-lg" />
          </div>

          {/* Elegant label */}
          <div className="mt-4 bg-white px-5 py-2.5 rounded-xl shadow-2xl border-2 border-slate-200">
            <p className="text-sm font-bold text-slate-900 whitespace-nowrap">{zone}</p>
            <p className="text-xs text-slate-500 whitespace-nowrap">{address.split(',')[0]}</p>
          </div>
        </div>
      </div>

      {/* Subtle vignette effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/5 via-transparent to-slate-900/5 pointer-events-none" />
    </div>
  );
}

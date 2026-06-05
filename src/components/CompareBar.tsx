import { X, Columns } from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import { Button } from './Button';

export function CompareBar() {
  const { compareItems, clearCompare } = useCompare();

  const base = compareItems[0];
  if (!base) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
        {/* Base room thumbnail + info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={base.room.images[0] || base.property.images[0]}
              alt={base.room.title}
              className="w-12 h-12 rounded-lg object-cover border-2 border-primary shadow-sm"
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground line-clamp-1">{base.room.title}</p>
            <p className="text-xs text-muted-foreground">
              €{base.room.price}/mês · {base.property.city}
            </p>
          </div>
        </div>

        {/* Guidance + actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Columns className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Escolhe outro quarto para comparar</span>
          </div>

          <button
            onClick={clearCompare}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5 rounded-lg hover:bg-muted/60"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
        </div>
      </div>

      {/* Mobile guidance */}
      <div className="sm:hidden px-4 pb-2 text-xs text-muted-foreground text-center">
        Escolhe outro quarto para comparar
      </div>
    </div>
  );
}

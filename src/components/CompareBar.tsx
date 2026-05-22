import { X, Columns, Trash2 } from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import { Button } from './Button';

interface CompareBarProps {
  onCompare: () => void;
}

export function CompareBar({ onCompare }: CompareBarProps) {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  if (compareItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
        {/* Thumbnails */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {compareItems.map(({ room, property }) => (
            <div key={room.id} className="relative flex-shrink-0 group">
              <img
                src={room.images[0] || property.images[0]}
                alt={room.title}
                className="w-12 h-12 rounded-lg object-cover border-2 border-primary/30"
              />
              <button
                onClick={() => removeFromCompare(room.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 rounded-b-lg px-1 py-0.5">
                <p className="text-white text-[8px] truncate leading-tight">{room.title}</p>
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 3 - compareItems.length }).map((_, i) => (
            <div
              key={`slot-${i}`}
              className="w-12 h-12 rounded-lg border-2 border-dashed border-border bg-muted/40 flex items-center justify-center flex-shrink-0"
            >
              <span className="text-muted-foreground text-lg leading-none">+</span>
            </div>
          ))}

          <p className="text-sm font-semibold text-foreground ml-1 hidden sm:block">
            {compareItems.length} {compareItems.length === 1 ? 'quarto selecionado' : 'quartos selecionados'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={clearCompare}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Limpar</span>
          </button>

          <Button
            variant="primary"
            onClick={onCompare}
            disabled={compareItems.length < 2}
            className="flex items-center gap-2"
          >
            <Columns className="w-4 h-4" />
            Comparar
          </Button>
        </div>
      </div>
    </div>
  );
}

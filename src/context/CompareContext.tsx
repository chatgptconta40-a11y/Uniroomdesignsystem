import { createContext, useContext, useState, ReactNode } from 'react';
import { Room, Property } from '../types/property';
import { toast } from 'sonner';

export interface CompareItem {
  room: Room;
  property: Property;
}

interface CompareContextType {
  compareItems: CompareItem[];
  addToCompare: (room: Room, property: Property) => void;
  removeFromCompare: (roomId: string) => void;
  toggleCompare: (room: Room, property: Property) => void;
  clearCompare: () => void;
  isInCompare: (roomId: string) => boolean;
  canAdd: boolean;
}

const CompareContext = createContext<CompareContextType | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);

  const isInCompare = (roomId: string) => compareItems.some(item => item.room.id === roomId);
  const canAdd = compareItems.length < 3;

  const addToCompare = (room: Room, property: Property) => {
    if (compareItems.length >= 3) {
      toast.error('Máximo de 3 quartos na comparação');
      return;
    }
    if (isInCompare(room.id)) return;
    setCompareItems(prev => [...prev, { room, property }]);
  };

  const removeFromCompare = (roomId: string) => {
    setCompareItems(prev => prev.filter(item => item.room.id !== roomId));
  };

  const toggleCompare = (room: Room, property: Property) => {
    if (isInCompare(room.id)) {
      removeFromCompare(room.id);
    } else {
      addToCompare(room, property);
    }
  };

  const clearCompare = () => setCompareItems([]);

  return (
    <CompareContext.Provider value={{
      compareItems, addToCompare, removeFromCompare, toggleCompare,
      clearCompare, isInCompare, canAdd,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}

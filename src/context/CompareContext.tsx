import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router';
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
  showModal: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();

  // Clear compare state on route change
  useEffect(() => {
    setCompareItems([]);
    setShowModal(false);
  }, [location.pathname]);

  // Auto-open modal when 2nd room is added
  useEffect(() => {
    if (compareItems.length === 2) {
      setShowModal(true);
    }
  }, [compareItems.length]);

  const isInCompare = (roomId: string) => compareItems.some(item => item.room.id === roomId);
  const canAdd = compareItems.length < 2;

  const addToCompare = (room: Room, property: Property) => {
    if (isInCompare(room.id)) {
      toast.info('Escolhe um quarto diferente para comparar.');
      return;
    }
    if (compareItems.length >= 2) return;
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

  const clearCompare = () => {
    setCompareItems([]);
    setShowModal(false);
  };

  const openModal = () => setShowModal(true);

  const closeModal = () => {
    setShowModal(false);
    setCompareItems([]);
  };

  return (
    <CompareContext.Provider value={{
      compareItems, addToCompare, removeFromCompare, toggleCompare,
      clearCompare, isInCompare, canAdd,
      showModal, openModal, closeModal,
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

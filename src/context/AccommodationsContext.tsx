import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Accommodation, AccommodationStatus } from '../types/accommodation';
import { mockAccommodations } from '../data/mockAccommodations';

interface AccommodationsContextType {
  accommodations: Accommodation[];
  updateAccommodationStatus: (id: string, status: AccommodationStatus) => void;
  updateAccommodation: (id: string, updates: Partial<Accommodation>) => void;
  deleteAccommodation: (id: string) => void;
}

const AccommodationsContext = createContext<AccommodationsContextType | undefined>(undefined);

export function AccommodationsProvider({ children }: { children: ReactNode }) {
  const [accommodations, setAccommodations] = useState<Accommodation[]>(() => {
    // Load from localStorage or use defaults
    const stored = localStorage.getItem('uniroom_accommodations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((acc: any) => ({
          ...acc,
          availableFrom: new Date(acc.availableFrom),
          createdAt: new Date(acc.createdAt),
          updatedAt: new Date(acc.updatedAt),
        }));
      } catch {
        // Save mock data to localStorage
        localStorage.setItem('uniroom_accommodations', JSON.stringify(mockAccommodations));
        return mockAccommodations;
      }
    }
    // Save mock data to localStorage on first load
    localStorage.setItem('uniroom_accommodations', JSON.stringify(mockAccommodations));
    return mockAccommodations;
  });

  // Persist to localStorage whenever accommodations change
  useEffect(() => {
    try {
      localStorage.setItem('uniroom_accommodations', JSON.stringify(accommodations));
    } catch {
      // Silent fail
    }
  }, [accommodations]);

  const updateAccommodationStatus = (id: string, status: AccommodationStatus) => {
    setAccommodations(prev =>
      prev.map(acc =>
        acc.id === id
          ? { ...acc, status, updatedAt: new Date() }
          : acc
      )
    );
  };

  const updateAccommodation = (id: string, updates: Partial<Accommodation>) => {
    setAccommodations(prev =>
      prev.map(acc =>
        acc.id === id
          ? { ...acc, ...updates, updatedAt: new Date() }
          : acc
      )
    );
  };

  const deleteAccommodation = (id: string) => {
    setAccommodations(prev =>
      prev.map(acc =>
        acc.id === id
          ? { ...acc, status: 'archived' as AccommodationStatus, updatedAt: new Date() }
          : acc
      )
    );
  };

  return (
    <AccommodationsContext.Provider
      value={{
        accommodations,
        updateAccommodationStatus,
        updateAccommodation,
        deleteAccommodation,
      }}
    >
      {children}
    </AccommodationsContext.Provider>
  );
}

export function useAccommodations() {
  const context = useContext(AccommodationsContext);
  if (!context) {
    throw new Error('useAccommodations must be used within AccommodationsProvider');
  }
  return context;
}

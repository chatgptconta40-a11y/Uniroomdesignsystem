import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { toggleFavorite as toggleFavoriteStorage, getFavorites } from '../data/mockAccommodations';

interface FavoritesContextType {
  favoriteIds: string[];
  toggleFavorite: (accommodationId: string) => boolean;
  isFavorite: (accommodationId: string) => boolean;
  refreshFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const loadFavorites = () => {
    if (user) {
      const favorites = getFavorites(user.id);
      setFavoriteIds(favorites.map(f => f.accommodationId));
    } else {
      setFavoriteIds([]);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const toggleFavorite = (accommodationId: string): boolean => {
    if (!user) return false;

    const newState = toggleFavoriteStorage(user.id, accommodationId);
    loadFavorites();
    return newState;
  };

  const isFavorite = (accommodationId: string): boolean => {
    return favoriteIds.includes(accommodationId);
  };

  const refreshFavorites = () => {
    loadFavorites();
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite, isFavorite, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

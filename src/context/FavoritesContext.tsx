import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface FavoritesContextType {
  favoriteIds: string[];
  toggleFavorite: (accommodationId: string) => Promise<boolean>;
  isFavorite: (accommodationId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const refreshFavorites = useCallback(async () => {
    if (!user) { setFavoriteIds([]); return; }
    const { data, error } = await supabase
      .from('favorites')
      .select('property_id, room_id')
      .eq('user_id', user.id);
    if (error) { console.error('Favorites fetch error:', error.message); return; }
    // Accommodations are property-id based; collect property_ids
    const ids = (data ?? []).map(r => r.property_id).filter((x): x is string => !!x);
    setFavoriteIds(ids);
  }, [user]);

  useEffect(() => { refreshFavorites(); }, [refreshFavorites]);

  const toggleFavorite = async (accommodationId: string): Promise<boolean> => {
    if (!user) return false;
    const exists = favoriteIds.includes(accommodationId);
    if (exists) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', accommodationId)
        .is('room_id', null);
      if (error) { console.error('Favorite remove error:', error.message); return true; }
      setFavoriteIds(prev => prev.filter(id => id !== accommodationId));
      return false;
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, property_id: accommodationId });
      if (error) { console.error('Favorite add error:', error.message); return false; }
      setFavoriteIds(prev => [...prev, accommodationId]);
      return true;
    }
  };

  const isFavorite = (accommodationId: string) => favoriteIds.includes(accommodationId);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite, isFavorite, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

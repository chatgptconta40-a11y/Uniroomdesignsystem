import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface FavoritesContextType {
  favoriteIds: string[];
  toggleFavorite: (roomId: string, propertyId?: string) => boolean;
  isFavorite: (roomId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

function addUnique(ids: string[], id: string) {
  return Array.from(new Set([...ids, id]));
}

function removeId(ids: string[], id: string) {
  return ids.filter(item => item !== id);
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const refreshFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('room_id, property_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Favorites fetch error:', error.message);
      return;
    }

    const ids = (data ?? [])
      .map(row => row.room_id || row.property_id)
      .filter((id): id is string => Boolean(id));

    setFavoriteIds(Array.from(new Set(ids)));
  }, [user]);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const toggleFavorite = (roomId: string, propertyId?: string): boolean => {
    if (!user) return false;

    const exists = favoriteIds.includes(roomId);
    const previousIds = favoriteIds;
    const nextIds = exists ? removeId(favoriteIds, roomId) : addUnique(favoriteIds, roomId);

    setFavoriteIds(nextIds);

    if (exists) {
      void supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('room_id', roomId)
        .then(({ error }) => {
          if (error) {
            console.error('Favorite remove error:', error.message);
            setFavoriteIds(previousIds);
          }
        });

      return false;
    }

    void supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        room_id: roomId,
        property_id: propertyId ?? null,
      })
      .then(({ error }) => {
        if (error) {
          console.error('Favorite add error:', error.message);
          setFavoriteIds(previousIds);
        }
      });

    return true;
  };

  const isFavorite = (roomId: string) => favoriteIds.includes(roomId);

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

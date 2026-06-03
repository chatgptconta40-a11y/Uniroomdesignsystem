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
import { useDataBusRefresh } from '../lib/dataBus';

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

  useDataBusRefresh('favorites', refreshFavorites);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`realtime:favorites:${user.id}:${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'favorites', filter: `user_id=eq.${user.id}` },
        payload => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as { room_id?: string; property_id?: string };
            const id = old.room_id || old.property_id;
            if (!id) { void refreshFavorites(); return; }
            setFavoriteIds(prev => prev.filter(x => x !== id));
            return;
          }
          const row = payload.new as { room_id?: string; property_id?: string };
          const id = row.room_id || row.property_id;
          if (!id) return;
          setFavoriteIds(prev => prev.includes(id) ? prev : [...prev, id]);
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, refreshFavorites]);

  const toggleFavorite = (roomId: string, propertyId?: string): boolean => {
    if (!user || !roomId) return false;

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

    const favoriteId = `fav-${user.id}-${roomId}`;
    void supabase
      .from('favorites')
      .insert({
        id: favoriteId,
        user_id: user.id,
        room_id: roomId,
        property_id: propertyId ?? null,
      })
      .then(({ error }) => {
        if (error) {
          if (error.code === '23505') {
            // Duplicate key — already favorited, keep optimistic state
            return;
          }
          console.error('Favorite add error:', error.message);
          setFavoriteIds(previousIds);
        } else {
          void refreshFavorites();
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

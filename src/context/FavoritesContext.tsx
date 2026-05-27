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

const FAVORITES_STORAGE_PREFIX = 'uniroom_favorites_';

function getStorageKey(userId?: string) {
  return `${FAVORITES_STORAGE_PREFIX}${userId || 'guest'}`;
}

function readLocalFavorites(userId?: string): string[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];
  } catch {
    return [];
  }
}

function writeLocalFavorites(userId: string | undefined, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  localStorage.setItem(getStorageKey(userId), JSON.stringify(uniqueIds));
}

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

    const localIds = readLocalFavorites(user.id);
    setFavoriteIds(localIds);

    const { data, error } = await supabase
      .from('favorites')
      .select('property_id, room_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Favorites fetch error:', error.message);
      return;
    }

    const remoteIds = (data ?? [])
      .map(row => row.room_id || row.property_id)
      .filter((id): id is string => Boolean(id));

    const merged = Array.from(new Set([...localIds, ...remoteIds]));
    setFavoriteIds(merged);
    writeLocalFavorites(user.id, merged);
  }, [user]);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const toggleFavorite = (roomId: string, propertyId?: string): boolean => {
    if (!user) return false;

    const exists = favoriteIds.includes(roomId);
    const nextIds = exists ? removeId(favoriteIds, roomId) : addUnique(favoriteIds, roomId);

    setFavoriteIds(nextIds);
    writeLocalFavorites(user.id, nextIds);

    if (exists) {
      void supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .or(`room_id.eq.${roomId},property_id.eq.${roomId}`)
        .then(({ error }) => {
          if (error) console.error('Favorite remove error:', error.message);
        });

      return false;
    }

    void supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        property_id: propertyId ?? null,
        room_id: roomId,
      })
      .then(({ error }) => {
        if (error) console.error('Favorite add error:', error.message);
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
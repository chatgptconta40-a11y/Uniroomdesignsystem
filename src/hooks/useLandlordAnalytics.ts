import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useProperties } from '../context/PropertiesContext';
import { useLandlordApplications, useConversations } from './useDb';
import { useVerificationStatus } from './useTrust';
import { useDataBusRefresh } from '../lib/dataBus';
import type { ListingAnalytics, PerformanceInsight } from '../types/analytics';

export interface OverviewMetrics {
  totalViews: number;
  totalFavorites: number;
  totalApplications: number;
  totalMessages: number;
  unreadMessages: number;
  avgConversion: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'application' | 'message' | 'favorite' | 'maintenance';
  description: string;
  createdAt: Date;
}

interface FavoriteRow {
  room_id: string | null;
  property_id: string | null;
}

export function useLandlordAnalytics(userId: string | undefined) {
  const { properties, rooms } = useProperties();
  const { applications: landlordApps } = useLandlordApplications(userId);
  const { conversations } = useConversations();
  const { status: verification } = useVerificationStatus(userId);

  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const myProperties = useMemo(
    () => properties.filter(p => p.landlordId === userId && p.status !== 'archived'),
    [properties, userId],
  );
  const myPropertyIds = useMemo(() => new Set(myProperties.map(p => p.id)), [myProperties]);
  const myRooms = useMemo(
    () => rooms.filter(r => myPropertyIds.has(r.propertyId)),
    [rooms, myPropertyIds],
  );
  const myRoomIds = useMemo(() => new Set(myRooms.map(r => r.id)), [myRooms]);

  const refreshFavorites = useCallback(async () => {
    if (!userId || (myPropertyIds.size === 0 && myRoomIds.size === 0)) {
      setFavorites([]);
      return;
    }
    setLoadingFavorites(true);
    const propIds = [...myPropertyIds];
    const roomIds = [...myRoomIds];
    const orParts: string[] = [];
    if (propIds.length > 0) orParts.push(`property_id.in.(${propIds.join(',')})`);
    if (roomIds.length > 0) orParts.push(`room_id.in.(${roomIds.join(',')})`);
    if (orParts.length === 0) { setFavorites([]); setLoadingFavorites(false); return; }
    const { data, error } = await supabase
      .from('favorites')
      .select('room_id, property_id')
      .or(orParts.join(','));
    setLoadingFavorites(false);
    if (error) { console.error('[ANALYTICS] favorites', error.message); return; }
    setFavorites(data ?? []);
  }, [userId, myPropertyIds, myRoomIds]);

  useEffect(() => { void refreshFavorites(); }, [refreshFavorites]);
  useDataBusRefresh('favorites', refreshFavorites);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`realtime:landlord-fav-count:${userId}:${Math.random().toString(36).slice(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorites' }, payload => {
        const row = (payload.new ?? payload.old) as { room_id?: string; property_id?: string };
        if (
          (row?.room_id && myRoomIds.has(row.room_id)) ||
          (row?.property_id && myPropertyIds.has(row.property_id))
        ) {
          void refreshFavorites();
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, myRoomIds, myPropertyIds, refreshFavorites]);

  const favoritesByProperty = useMemo(() => {
    const map = new Map<string, number>();
    favorites.forEach(f => {
      if (f.property_id && myPropertyIds.has(f.property_id)) {
        map.set(f.property_id, (map.get(f.property_id) ?? 0) + 1);
      }
      if (f.room_id) {
        const room = myRooms.find(r => r.id === f.room_id);
        if (room) {
          map.set(room.propertyId, (map.get(room.propertyId) ?? 0) + 1);
        }
      }
    });
    return map;
  }, [favorites, myPropertyIds, myRooms]);

  const applicationsByProperty = useMemo(() => {
    const map = new Map<string, number>();
    landlordApps.forEach(a => {
      if (myPropertyIds.has(a.propertyId)) {
        map.set(a.propertyId, (map.get(a.propertyId) ?? 0) + 1);
      }
    });
    return map;
  }, [landlordApps, myPropertyIds]);

  const messagesByProperty = useMemo(() => {
    const map = new Map<string, number>();
    conversations.forEach(c => {
      const pid = (c as { propertyId?: string }).propertyId;
      if (pid && myPropertyIds.has(pid)) {
        map.set(pid, (map.get(pid) ?? 0) + 1);
      }
    });
    return map;
  }, [conversations, myPropertyIds]);

  const unreadMessages = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
    [conversations],
  );

  const totalViews = myProperties.reduce((sum, p) => sum + (p.views ?? 0), 0);
  const totalFavorites = [...favoritesByProperty.values()].reduce((s, v) => s + v, 0);
  const totalApplications = landlordApps.length;
  const totalMessages = [...messagesByProperty.values()].reduce((s, v) => s + v, 0);
  const avgConversion = totalViews > 0
    ? Number(((totalApplications / totalViews) * 100).toFixed(1))
    : 0;

  const overview: OverviewMetrics = {
    totalViews,
    totalFavorites,
    totalApplications,
    totalMessages,
    unreadMessages,
    avgConversion,
  };

  const propertyPerformance: ListingAnalytics[] = useMemo(() => {
    return myProperties.map(property => {
      const propertyRooms = myRooms.filter(r => r.propertyId === property.id);
      const views = (property.views ?? 0) + propertyRooms.reduce((s, r) => s + (r.views ?? 0), 0);
      const favs = favoritesByProperty.get(property.id) ?? 0;
      const apps = applicationsByProperty.get(property.id) ?? 0;
      const msgs = messagesByProperty.get(property.id) ?? 0;
      const conversionRate = views > 0 ? Number(((apps / views) * 100).toFixed(1)) : 0;
      const favoriteRate = views > 0 ? Number(((favs / views) * 100).toFixed(1)) : 0;
      return {
        listingId: property.id,
        listingTitle: property.title,
        period: 'month',
        views,
        favorites: favs,
        applications: apps,
        messages: msgs,
        conversionRate,
        favoriteRate,
        viewTrend: 0,
        applicationTrend: 0,
      };
    });
  }, [myProperties, myRooms, favoritesByProperty, applicationsByProperty, messagesByProperty]);

  const insights: PerformanceInsight[] = useMemo(() => {
    const list: PerformanceInsight[] = [];
    if (myProperties.length === 0) {
      list.push({
        type: 'info',
        title: 'Ainda não há dados suficientes para recomendações',
        description: 'Cria e publica alojamentos para começar a gerar estatísticas reais.',
        action: 'Adicionar alojamento',
      });
      return list;
    }

    const noImages = myProperties.filter(p => p.status !== 'draft' && (p.images?.length ?? 0) === 0);
    if (noImages.length > 0) {
      list.push({
        type: 'warning',
        title: 'Adiciona fotos',
        description: `${noImages.length} alojamento${noImages.length > 1 ? 's' : ''} sem fotos. Anúncios com fotos recebem mais visualizações.`,
        action: 'Adicionar fotos',
      });
    }

    const activeNoRooms = myProperties.filter(p => {
      if (p.status !== 'active') return false;
      const propertyRooms = myRooms.filter(r => r.propertyId === p.id);
      return !propertyRooms.some(r => r.status === 'available');
    });
    if (activeNoRooms.length > 0) {
      list.push({
        type: 'warning',
        title: 'Publica quartos',
        description: `${activeNoRooms.length} alojamento${activeNoRooms.length > 1 ? 's ativos' : ' ativo'} sem quartos disponíveis.`,
        action: 'Publicar quartos',
      });
    }

    propertyPerformance.forEach(p => {
      if (p.views >= 50 && p.applications === 0) {
        list.push({
          type: 'warning',
          title: 'Visualizações sem candidaturas',
          description: `"${p.listingTitle}" tem ${p.views} visualizações mas 0 candidaturas. Revê descrição ou preço.`,
          action: 'Melhorar descrição/preço',
        });
      }
      if (p.favorites >= 5 && p.applications === 0) {
        list.push({
          type: 'info',
          title: 'Favoritos sem candidaturas',
          description: `"${p.listingTitle}" tem ${p.favorites} favoritos mas 0 candidaturas. Talvez o preço esteja a travar.`,
          action: 'Rever preço',
        });
      }
    });

    const isVerified = verification?.level === 'gold' || !!verification?.documentVerified;
    if (!isVerified) {
      list.push({
        type: 'info',
        title: 'Completa verificação',
        description: 'Senhorios verificados recebem mais candidaturas e confiança dos estudantes.',
        action: 'Verificar conta',
      });
    }

    if (list.length === 0) {
      list.push({
        type: 'success',
        title: 'Tudo bem encaminhado',
        description: 'Os teus anúncios estão saudáveis. Continua a responder rapidamente às candidaturas.',
      });
    }

    return list;
  }, [myProperties, myRooms, propertyPerformance, verification]);

  const recentActivity: RecentActivityItem[] = useMemo(() => {
    const items: RecentActivityItem[] = [];

    landlordApps.slice(0, 20).forEach(a => {
      items.push({
        id: `app-${a.id}`,
        type: 'application',
        description: `Candidatura de ${a.studentName}`,
        createdAt: a.appliedAt,
      });
    });

    conversations.slice(0, 20).forEach(c => {
      if (c.lastMessage && c.lastMessage.senderId !== userId) {
        items.push({
          id: `msg-${c.id}`,
          type: 'message',
          description: c.lastMessage.content.slice(0, 80),
          createdAt: c.lastMessage.createdAt,
        });
      }
    });

    return items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }, [landlordApps, conversations, userId]);

  return {
    overview,
    propertyPerformance,
    insights,
    recentActivity,
    benchmarkState: 'unavailable' as const,
    loading: loadingFavorites,
  };
}

import { ListingAnalytics, PerformanceInsight, ComparisonData } from '../types/analytics';

const PROPERTIES_STORAGE_KEY = 'uniroom_properties';
const ROOMS_STORAGE_KEY = 'uniroom_rooms';
const APPLICATIONS_STORAGE_KEY = 'uniroom_landlord_applications';
const STUDENT_APPLICATIONS_STORAGE_KEY = 'uniroom_applications';
const MESSAGES_STORAGE_KEY = 'uniroom_messages';
const CONVERSATIONS_STORAGE_KEY = 'uniroom_conversations';
const FAVORITES_STORAGE_PREFIX = 'uniroom_favorites_';

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function readArray<T>(key: string): T[] {
  const value = safeParse<T[]>(localStorage.getItem(key), []);
  return Array.isArray(value) ? value : [];
}

function getCurrentUserId(): string | null {
  const user = safeParse<any>(localStorage.getItem('uniroom_user'), null);
  return user?.id ? String(user.id) : null;
}

function normalizeProperty(value: any) {
  return {
    ...value,
    id: String(value.id),
    landlordId: String(value.landlordId ?? value.landlord_id ?? ''),
    title: value.title ?? 'Alojamento sem título',
    city: value.city ?? '',
    zone: value.zone ?? '',
    status: value.status ?? 'draft',
    views: Number(value.views ?? 0),
    images: Array.isArray(value.images) ? value.images : [],
  };
}

function normalizeRoom(value: any) {
  return {
    ...value,
    id: String(value.id),
    propertyId: String(value.propertyId ?? value.property_id ?? ''),
    landlordId: String(value.landlordId ?? value.landlord_id ?? ''),
    title: value.title ?? 'Quarto sem título',
    status: value.status ?? 'draft',
    views: Number(value.views ?? 0),
    price: Number(value.price ?? 0),
  };
}

function readProperties() {
  return readArray<any>(PROPERTIES_STORAGE_KEY).map(normalizeProperty);
}

function readRooms() {
  return readArray<any>(ROOMS_STORAGE_KEY).map(normalizeRoom);
}

function readLandlordApplications() {
  return readArray<any>(APPLICATIONS_STORAGE_KEY);
}

function readStudentApplications() {
  return readArray<any>(STUDENT_APPLICATIONS_STORAGE_KEY);
}

function readMessages() {
  return readArray<any>(MESSAGES_STORAGE_KEY);
}

function readConversations() {
  return readArray<any>(CONVERSATIONS_STORAGE_KEY);
}

function getFavoriteCountForRoom(roomId: string): number {
  let total = 0;

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith(FAVORITES_STORAGE_PREFIX)) continue;

    const ids = safeParse<string[]>(localStorage.getItem(key), []);
    if (Array.isArray(ids) && ids.includes(roomId)) total += 1;
  }

  return total;
}

function getFavoriteCountForProperty(propertyId: string, roomIds: string[]): number {
  let total = 0;

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith(FAVORITES_STORAGE_PREFIX)) continue;

    const ids = safeParse<string[]>(localStorage.getItem(key), []);
    if (!Array.isArray(ids)) continue;

    if (ids.includes(propertyId)) total += 1;
    roomIds.forEach(roomId => {
      if (ids.includes(roomId)) total += 1;
    });
  }

  return total;
}

function getMessageCountForProperty(propertyId: string, roomIds: string[]): number {
  const conversations = readConversations();
  const messages = readMessages();

  const relevantConversationIds = new Set(
    conversations
      .filter(conversation => {
        const convPropertyId = String(conversation.propertyId ?? conversation.property_id ?? '');
        const convRoomId = String(conversation.roomId ?? conversation.room_id ?? '');

        return convPropertyId === propertyId || roomIds.includes(convRoomId);
      })
      .map(conversation => String(conversation.id)),
  );

  return messages.filter(message => relevantConversationIds.has(String(message.conversationId ?? message.conversation_id))).length;
}

function getApplicationCountForProperty(propertyId: string, roomIds: string[]): number {
  const landlordApps = readLandlordApplications().filter(app => {
    const appPropertyId = String(app.propertyId ?? app.property_id ?? '');
    const appRoomId = String(app.roomId ?? app.room_id ?? '');

    return appPropertyId === propertyId || roomIds.includes(appRoomId);
  });

  const studentApps = readStudentApplications().filter(app => {
    const appPropertyId = String(app.propertyId ?? app.property_id ?? '');
    const appRoomId = String(app.roomId ?? app.room_id ?? '');

    return appPropertyId === propertyId || roomIds.includes(appRoomId);
  });

  const uniqueIds = new Set<string>();

  landlordApps.forEach(app => uniqueIds.add(String(app.id)));
  studentApps.forEach(app => uniqueIds.add(String(app.id)));

  return uniqueIds.size;
}

function calculateTrend(value: number): number {
  if (value <= 0) return 0;
  if (value <= 3) return 5;
  if (value <= 10) return 8;
  if (value <= 25) return 12;
  return 18;
}

function buildAnalytics(): ListingAnalytics[] {
  const userId = getCurrentUserId();
  const allProperties = readProperties();
  const allRooms = readRooms();

  const properties = userId
    ? allProperties.filter(property => property.landlordId === userId)
    : allProperties;

  return properties.map(property => {
    const rooms = allRooms.filter(room => room.propertyId === property.id);
    const roomIds = rooms.map(room => room.id);

    const roomViews = rooms.reduce((sum, room) => sum + Number(room.views || 0), 0);
    const views = Number(property.views || 0) + roomViews;

    const favorites = getFavoriteCountForProperty(property.id, roomIds);
    const applications = getApplicationCountForProperty(property.id, roomIds);
    const messages = getMessageCountForProperty(property.id, roomIds);

    const safeViews = Math.max(views, 0);
    const conversionRate = safeViews > 0 ? Number(((applications / safeViews) * 100).toFixed(1)) : 0;
    const favoriteRate = safeViews > 0 ? Number(((favorites / safeViews) * 100).toFixed(1)) : 0;

    return {
      listingId: property.id,
      listingTitle: property.title,
      period: 'month',
      views: safeViews,
      favorites,
      applications,
      messages,
      conversionRate,
      favoriteRate,
      viewTrend: calculateTrend(safeViews),
      applicationTrend: calculateTrend(applications),
    };
  });
}

export const mockListingAnalytics: ListingAnalytics[] = [];
export const mockInsights: PerformanceInsight[] = [];
export const mockComparisons: ComparisonData[] = [];

export function getListingAnalytics(listingId: string): ListingAnalytics | undefined {
  return getAllAnalytics().find(item => item.listingId === listingId);
}

export function getAllAnalytics(): ListingAnalytics[] {
  return buildAnalytics();
}

export function getOverallMetrics() {
  const analytics = getAllAnalytics();

  const totalViews = analytics.reduce((sum, item) => sum + item.views, 0);
  const totalFavorites = analytics.reduce((sum, item) => sum + item.favorites, 0);
  const totalApplications = analytics.reduce((sum, item) => sum + item.applications, 0);
  const avgConversion = totalViews > 0
    ? Number(((totalApplications / totalViews) * 100).toFixed(1))
    : 0;

  return {
    totalViews,
    totalFavorites,
    totalApplications,
    avgConversion: avgConversion.toFixed(1),
    viewTrend: calculateTrend(totalViews),
    applicationTrend: calculateTrend(totalApplications),
  };
}

export function getInsights(): PerformanceInsight[] {
  const analytics = getAllAnalytics();

  if (analytics.length === 0) {
    return [
      {
        type: 'info',
        title: 'Ainda sem dados suficientes',
        description: 'Cria e publica alojamentos para começar a gerar estatísticas reais.',
        action: 'Adicionar alojamento',
      },
    ];
  }

  const insights: PerformanceInsight[] = [];
  const bestByViews = [...analytics].sort((a, b) => b.views - a.views)[0];
  const lowPhotoListings = readProperties().filter(property => {
    const userId = getCurrentUserId();
    if (userId && property.landlordId !== userId) return false;
    return (property.images?.length || 0) < 5;
  });

  if (bestByViews && bestByViews.views > 0) {
    insights.push({
      type: 'success',
      title: 'Alojamento com maior visibilidade',
      description: `O teu anúncio "${bestByViews.listingTitle}" tem ${bestByViews.views} visualizações registadas.`,
      action: 'Ver estatísticas',
    });
  }

  const noApplications = analytics.filter(item => item.views > 0 && item.applications === 0);
  if (noApplications.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Visualizações sem candidaturas',
      description: `${noApplications.length} alojamento${noApplications.length > 1 ? 's recebem' : ' recebe'} visualizações, mas ainda não ${noApplications.length > 1 ? 'têm' : 'tem'} candidaturas.`,
      action: 'Ver preços',
    });
  }

  if (lowPhotoListings.length > 0) {
    insights.push({
      type: 'info',
      title: 'Adiciona mais fotos',
      description: `${lowPhotoListings.length} alojamento${lowPhotoListings.length > 1 ? 's têm' : ' tem'} menos de 5 fotos. Mais imagens ajudam os estudantes a confiar no anúncio.`,
      action: 'Adicionar fotos',
    });
  }

  const totalMessages = analytics.reduce((sum, item) => sum + item.messages, 0);
  if (totalMessages > 0) {
    insights.push({
      type: 'success',
      title: 'Boa interação com estudantes',
      description: `Tens ${totalMessages} mensagem${totalMessages > 1 ? 's' : ''} associada${totalMessages > 1 ? 's' : ''} aos teus alojamentos.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Analytics pronto',
      description: 'À medida que estudantes virem, guardarem e candidatarem-se aos teus alojamentos, esta página vai atualizar.',
      action: 'Ver alojamentos',
    });
  }

  return insights;
}

export function getComparisons(): ComparisonData[] {
  const overall = getOverallMetrics();
  const analytics = getAllAnalytics();

  const totalMessages = analytics.reduce((sum, item) => sum + item.messages, 0);
  const avgFavorites = overall.totalViews > 0
    ? Number(((overall.totalFavorites / overall.totalViews) * 100).toFixed(1))
    : 0;

  return [
    {
      metric: 'Taxa de Conversão',
      yourValue: Number(overall.avgConversion),
      average: 2.8,
      topPerformer: 4.5,
    },
    {
      metric: 'Mensagens recebidas',
      yourValue: totalMessages,
      average: 6,
      topPerformer: 20,
    },
    {
      metric: 'Taxa de favoritos',
      yourValue: avgFavorites,
      average: 5,
      topPerformer: 12,
    },
    {
      metric: 'Candidaturas',
      yourValue: overall.totalApplications,
      average: 4,
      topPerformer: 15,
    },
  ];
}

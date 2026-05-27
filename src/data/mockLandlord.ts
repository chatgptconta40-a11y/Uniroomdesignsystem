import { LandlordMetrics, LandlordListing, DashboardActivity, PerformanceData, ListingStatus } from '../types/landlord';
import { getAllApplications } from './mockLandlordCandidates';

const PROPERTIES_STORAGE_KEY = 'uniroom_properties';
const ROOMS_STORAGE_KEY = 'uniroom_rooms';
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

function toDate(value: unknown, fallback = new Date()): Date {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function readProperties(): any[] {
  return safeParse<any[]>(localStorage.getItem(PROPERTIES_STORAGE_KEY), []);
}

function readRooms(): any[] {
  return safeParse<any[]>(localStorage.getItem(ROOMS_STORAGE_KEY), []);
}

function readMessages(): any[] {
  return safeParse<any[]>(localStorage.getItem(MESSAGES_STORAGE_KEY), []);
}

function readConversations(): any[] {
  return safeParse<any[]>(localStorage.getItem(CONVERSATIONS_STORAGE_KEY), []);
}

function getFavoriteCountForRoom(roomId: string): number {
  let total = 0;

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith(FAVORITES_STORAGE_PREFIX)) continue;

    const ids = safeParse<string[]>(localStorage.getItem(key), []);
    if (ids.includes(roomId)) total += 1;
  }

  return total;
}

function getLandlordProperties(landlordId: string) {
  return readProperties().filter(property => property.landlordId === landlordId || property.landlord_id === landlordId);
}

function getLandlordRooms(landlordId: string) {
  return readRooms().filter(room => room.landlordId === landlordId || room.landlord_id === landlordId);
}

function getLandlordRoomIds(landlordId: string): Set<string> {
  return new Set(getLandlordRooms(landlordId).map(room => String(room.id)));
}

export const mockLandlordMetrics: Record<string, LandlordMetrics> = {};
export const mockLandlordListings: LandlordListing[] = [];
export const mockDashboardActivity: DashboardActivity[] = [];
export const mockPerformanceData: PerformanceData[] = [];

export function getLandlordMetrics(landlordId: string): LandlordMetrics | null {
  if (!landlordId) return null;

  const properties = getLandlordProperties(landlordId);
  const rooms = getLandlordRooms(landlordId);
  const roomIds = getLandlordRoomIds(landlordId);
  const applications = getAllApplications().filter(app => roomIds.has(app.roomId));
  const conversations = readConversations().filter(conversation =>
    conversation?.participants?.some((participant: any) => participant.id === landlordId),
  );
  const messages = readMessages().filter(message =>
    conversations.some(conversation => conversation.id === message.conversationId) &&
    message.senderId !== landlordId &&
    !message.read,
  );

  return {
    activeListings: properties.filter(property => property.status === 'active').length,
    pendingApplications: applications.filter(app => app.status === 'pending' || app.status === 'under_review').length,
    unreadMessages: messages.length,
    averageRating: 0,
    totalViews: properties.reduce((total, property) => total + Number(property.views || 0), 0),
    totalFavorites: rooms.reduce((total, room) => total + getFavoriteCountForRoom(String(room.id)), 0),
    responseRate: applications.length > 0 ? 100 : 0,
  };
}

export function getLandlordListings(landlordId: string, status?: ListingStatus): LandlordListing[] {
  const propertyMap = new Map(getLandlordProperties(landlordId).map(property => [String(property.id), property]));

  const listings = getLandlordRooms(landlordId).map(room => {
    const property = propertyMap.get(String(room.propertyId ?? room.property_id));
    const roomId = String(room.id);

    return {
      id: roomId,
      title: room.title || 'Quarto sem título',
      city: property?.city || '',
      zone: property?.zone || '',
      price: Number(room.price || 0),
      image: room.images?.[0] || property?.images?.[0] || '',
      status: room.status || 'draft',
      views: Number(room.views || 0),
      favorites: getFavoriteCountForRoom(roomId),
      applications: getAllApplications().filter(app => app.roomId === roomId).length,
      createdAt: toDate(room.createdAt ?? room.created_at),
      updatedAt: toDate(room.updatedAt ?? room.updated_at),
    } satisfies LandlordListing;
  });

  return status ? listings.filter(listing => listing.status === status) : listings;
}

export function getDashboardActivity(landlordId: string): DashboardActivity[] {
  const roomIds = getLandlordRoomIds(landlordId);
  const applications = getAllApplications()
    .filter(app => roomIds.has(app.roomId))
    .map(app => ({
      type: 'application' as const,
      id: app.id,
      listingTitle: app.roomId,
      userName: app.studentName,
      timestamp: toDate(app.appliedAt),
      read: app.status !== 'pending',
    }));

  const conversations = readConversations().filter(conversation =>
    conversation?.participants?.some((participant: any) => participant.id === landlordId),
  );
  const conversationIds = new Set(conversations.map(conversation => conversation.id));

  const messages = readMessages()
    .filter(message => conversationIds.has(message.conversationId) && message.senderId !== landlordId)
    .map(message => ({
      type: 'message' as const,
      id: message.id,
      listingTitle: 'Mensagem',
      userName: message.senderName || 'Estudante',
      timestamp: toDate(message.createdAt),
      read: Boolean(message.read),
    }));

  return [...applications, ...messages]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function getPerformanceData(landlordId: string, days: number = 30): PerformanceData[] {
  const properties = getLandlordProperties(landlordId);
  const rooms = getLandlordRooms(landlordId);
  const roomIds = getLandlordRoomIds(landlordId);
  const applications = getAllApplications().filter(app => roomIds.has(app.roomId));
  const conversations = readConversations().filter(conversation =>
    conversation?.participants?.some((participant: any) => participant.id === landlordId),
  );
  const conversationIds = new Set(conversations.map(conversation => conversation.id));
  const messages = readMessages().filter(message => conversationIds.has(message.conversationId));

  return Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const key = date.toISOString().slice(0, 10);

    return {
      date: key,
      views: Math.round(
        properties.reduce((total, property) => total + Number(property.views || 0), 0) / Math.max(days, 1),
      ),
      applications: applications.filter(app => app.appliedAt?.slice(0, 10) === key).length,
      messages: messages.filter(message => String(message.createdAt || '').slice(0, 10) === key).length,
    };
  });
}

export function updateListingStatus(listingId: string, status: ListingStatus): boolean {
  const rooms = readRooms();
  const index = rooms.findIndex(room => String(room.id) === listingId);
  if (index < 0) return false;

  rooms[index] = {
    ...rooms[index],
    status,
    updatedAt: new Date(),
  };

  localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
  return true;
}

export function deleteListing(listingId: string): boolean {
  return updateListingStatus(listingId, 'paused');
}

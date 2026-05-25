// Conversations & messages — backed by Supabase
// (tables: conversations, conversation_participants, messages, profiles).
// Preserves the original synchronous API via in-memory caches hydrated on import.

import { Message, Conversation } from '../types/message';
import { supabase } from '../lib/supabase';

// Aliases preserved for legacy demo IDs in some pages
const USER_ID_ALIASES: Record<string, string> = {
  estudante: '1',
  student: '1',
  senhorio: '2',
  landlord: '2',
  landlord2: '2',
  r1: '4',
  'mate-1': '4',
  'mate-2': '5',
};

export function normalizeMessageUserId(userId: string): string {
  return USER_ID_ALIASES[userId] || userId;
}

export function isSameMessageUser(leftId: string, rightId: string): boolean {
  return normalizeMessageUserId(leftId) === normalizeMessageUserId(rightId);
}

// ─── Caches ────────────────────────────────────────────────────────────────
const conversationsCache = new Map<string, Conversation>();
const messagesCache = new Map<string, Message>();
const profilesCache = new Map<string, { name: string; type: 'student' | 'landlord'; avatar?: string }>();

export const mockMessages: Message[] = [];
export const mockConversations: Conversation[] = [];

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function rowToMessage(row: any, senderName: string): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName,
    content: row.content,
    createdAt: new Date(row.created_at),
    read: !!row.read,
    type: row.type ?? 'text',
    imageUrl: row.image_url ?? undefined,
  };
}

function syncMirrors(): void {
  mockMessages.length = 0;
  for (const m of messagesCache.values()) mockMessages.push(m);
  mockConversations.length = 0;
  for (const c of conversationsCache.values()) mockConversations.push(c);
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    const [convsRes, partsRes, msgsRes, profsRes] = await Promise.all([
      supabase.from('conversations').select('*'),
      supabase.from('conversation_participants').select('*'),
      supabase.from('messages').select('*').order('created_at', { ascending: true }),
      supabase.from('profiles').select('id, full_name, type, avatar_url'),
    ]);
    if (convsRes.error) console.error('Messages hydrate convs:', convsRes.error.message);
    if (msgsRes.error) console.error('Messages hydrate msgs:', msgsRes.error.message);

    profilesCache.clear();
    (profsRes.data ?? []).forEach(p => profilesCache.set(p.id, {
      name: p.full_name ?? 'Utilizador',
      type: (p.type === 'landlord' ? 'landlord' : 'student'),
      avatar: p.avatar_url ?? undefined,
    }));

    messagesCache.clear();
    (msgsRes.data ?? []).forEach(m => {
      const senderName = profilesCache.get(m.sender_id)?.name ?? 'Utilizador';
      messagesCache.set(m.id, rowToMessage(m, senderName));
    });

    conversationsCache.clear();
    const parts = partsRes.data ?? [];
    (convsRes.data ?? []).forEach(c => {
      const cParts = parts.filter(p => p.conversation_id === c.id);
      const participants = cParts.map(p => {
        const prof = profilesCache.get(p.user_id);
        return {
          id: p.user_id,
          name: prof?.name ?? 'Utilizador',
          type: prof?.type ?? 'student',
          online: false,
        };
      });
      const convMsgs = Array.from(messagesCache.values())
        .filter(m => m.conversationId === c.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const last = convMsgs[convMsgs.length - 1];
      conversationsCache.set(c.id, {
        id: c.id,
        participants,
        lastMessage: last,
        unreadCount: convMsgs.filter(m => !m.read).length,
        accommodationId: c.property_id ?? undefined,
        accommodationTitle: undefined,
        accommodationPrice: undefined,
        accommodationImage: undefined,
        roomId: c.room_id ?? undefined,
        propertyId: c.property_id ?? undefined,
        isGroup: !!c.is_group,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      });
    });

    syncMirrors();
    hydrated = true;
  })();
  return hydratePromise;
}

void hydrate();

// ─── Read API ─────────────────────────────────────────────────────────────

export function getConversationsForUser(userId: string): Conversation[] {
  const norm = normalizeMessageUserId(userId);
  return Array.from(conversationsCache.values())
    .filter(c => c.participants.some(p => isSameMessageUser(p.id, norm)))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function getConversationById(id: string): Conversation | undefined {
  return conversationsCache.get(id);
}

export function getMessagesForConversation(conversationId: string): Message[] {
  return Array.from(messagesCache.values())
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function getUnreadCountForConversation(conversationId: string, userId: string): number {
  const norm = normalizeMessageUserId(userId);
  return Array.from(messagesCache.values()).filter(m =>
    m.conversationId === conversationId &&
    !isSameMessageUser(m.senderId, norm) &&
    !m.read,
  ).length;
}

export function getTotalUnreadCount(userId: string): number {
  return getConversationsForUser(userId).reduce(
    (total, c) => total + getUnreadCountForConversation(c.id, userId), 0);
}

// ─── Write API ────────────────────────────────────────────────────────────

export function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  content: string,
): Message {
  const norm = normalizeMessageUserId(senderId);
  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const msg: Message = {
    id, conversationId, senderId: norm, senderName,
    content, createdAt: new Date(), read: false, type: 'text',
  };
  messagesCache.set(id, msg);
  mockMessages.push(msg);

  const conv = conversationsCache.get(conversationId);
  if (conv) {
    conv.lastMessage = msg;
    conv.updatedAt = new Date();
    if (conv.participants.some(p => !isSameMessageUser(p.id, norm))) {
      conv.unreadCount += 1;
    }
    void supabase.from('conversations').update({ updated_at: conv.updatedAt.toISOString() }).eq('id', conversationId);
  }

  void supabase.from('messages').insert({
    id, conversation_id: conversationId, sender_id: norm,
    content, type: 'text', read: false,
  }).then(({ error }) => {
    if (error) console.error('Message insert error:', error.message);
  });

  return msg;
}

export function markConversationAsRead(conversationId: string, userId: string): void {
  const norm = normalizeMessageUserId(userId);
  const conv = conversationsCache.get(conversationId);
  if (!conv) return;
  conv.unreadCount = 0;
  const toMark: string[] = [];
  for (const m of messagesCache.values()) {
    if (m.conversationId === conversationId && !isSameMessageUser(m.senderId, norm) && !m.read) {
      m.read = true;
      toMark.push(m.id);
    }
  }
  if (toMark.length > 0) {
    void supabase.from('messages').update({ read: true }).in('id', toMark);
  }
}

export function createConversation(
  currentUserId: string,
  currentUserName: string,
  currentUserType: 'student' | 'landlord',
  otherUserId: string,
  otherUserName: string,
  otherUserType: 'student' | 'landlord',
  initialMessage: string,
  accommodationId?: string,
  accommodationTitle?: string,
  accommodationPrice?: number,
  accommodationImage?: string,
  roomId?: string,
  propertyId?: string,
): Conversation {
  const normCurrent = normalizeMessageUserId(currentUserId);
  const normOther = normalizeMessageUserId(otherUserId);
  const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();

  const conv: Conversation = {
    id,
    participants: [
      { id: normCurrent, name: currentUserName, type: currentUserType, online: true },
      { id: normOther, name: otherUserName, type: otherUserType, online: false },
    ],
    unreadCount: 0,
    accommodationId, accommodationTitle, accommodationPrice, accommodationImage,
    roomId, propertyId,
    createdAt: now, updatedAt: now,
  };
  conversationsCache.set(id, conv);
  mockConversations.push(conv);

  void supabase.from('conversations').insert({
    id, property_id: propertyId ?? null, room_id: roomId ?? null,
    is_group: false,
  }).then(({ error }) => {
    if (error) console.error('Conversation insert error:', error.message);
  });
  void supabase.from('conversation_participants').insert([
    { conversation_id: id, user_id: normCurrent },
    { conversation_id: id, user_id: normOther },
  ]).then(({ error }) => {
    if (error) console.error('Conversation participants insert error:', error.message);
  });

  const msg = sendMessage(id, normCurrent, currentUserName, initialMessage);
  conv.lastMessage = msg;

  return conv;
}

export function findOrCreateRoomConversation(
  currentUserId: string,
  currentUserName: string,
  currentUserType: 'student' | 'landlord',
  landlordId: string,
  landlordName: string,
  roomId: string,
  propertyId: string,
  roomTitle: string,
  roomPrice: number,
  roomImage: string,
  customMessage?: string,
): Conversation {
  const normCurrent = normalizeMessageUserId(currentUserId);
  const normLandlord = normalizeMessageUserId(landlordId);

  const existing = Array.from(conversationsCache.values()).find(c =>
    c.roomId === roomId &&
    c.participants.some(p => isSameMessageUser(p.id, normCurrent)) &&
    c.participants.some(p => isSameMessageUser(p.id, normLandlord)),
  );

  if (existing) {
    if (customMessage && customMessage.trim()) {
      sendMessage(existing.id, normCurrent, currentUserName, customMessage.trim());
    }
    return existing;
  }

  const initial = customMessage || 'Olá, tenho interesse neste quarto. Ainda está disponível?';
  return createConversation(
    normCurrent, currentUserName, currentUserType,
    normLandlord, landlordName, 'landlord',
    initial, undefined, roomTitle, roomPrice, roomImage, roomId, propertyId,
  );
}

export function getHouseGroupConversation(propertyId: string, userId: string): Conversation | undefined {
  const norm = normalizeMessageUserId(userId);
  return Array.from(conversationsCache.values()).find(c =>
    c.isGroup &&
    c.propertyId === propertyId &&
    c.participants.some(p => isSameMessageUser(p.id, norm)),
  );
}

export async function refreshMessagesState(): Promise<void> {
  hydrated = false;
  hydratePromise = null;
  await hydrate();
}

// Conversations & messages — localStorage first.
// Safe version for Figma Make: no Supabase calls from this file, so missing
// Supabase message tables/columns do not break the UI.

import { Message, Conversation } from '../types/message';

const CONVERSATIONS_STORAGE_KEY = 'uniroom_conversations';
const MESSAGES_STORAGE_KEY = 'uniroom_messages';
const HOUSEMATES_KEY = 'uniroom_active_home_housemates';
const USERS_STORAGE_KEY = 'uniroom_all_users';

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

const conversationsCache = new Map<string, Conversation>();
const messagesCache = new Map<string, Message>();

export const mockMessages: Message[] = [];
export const mockConversations: Conversation[] = [];

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function readLocalArray<T>(key: string): T[] {
  return safeParse<T[]>(localStorage.getItem(key), []);
}

function writeLocalArray<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function toDate(value: unknown, fallback = new Date()): Date {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function getUserName(userId?: string): string | undefined {
  if (!userId) return undefined;

  const users = safeParse<any[]>(localStorage.getItem(USERS_STORAGE_KEY), []);
  const found = users.find(user => isSameMessageUser(user.id, userId));

  return found?.name || found?.fullName;
}

function getUserType(userId?: string): 'student' | 'landlord' {
  if (!userId) return 'student';

  const users = safeParse<any[]>(localStorage.getItem(USERS_STORAGE_KEY), []);
  const found = users.find(user => isSameMessageUser(user.id, userId));

  return found?.type === 'landlord' ? 'landlord' : 'student';
}

function normalizeMessage(value: any): Message {
  return {
    id: String(value.id),
    conversationId: String(value.conversationId),
    senderId: normalizeMessageUserId(String(value.senderId)),
    senderName: value.senderName || getUserName(value.senderId) || 'Utilizador',
    content: value.content ?? '',
    createdAt: toDate(value.createdAt),
    read: !!value.read,
    type: value.type === 'image' ? 'image' : 'text',
    imageUrl: value.imageUrl,
  };
}

function normalizeConversation(value: any): Conversation {
  const participants: Conversation['participants'] = Array.isArray(value.participants)
    ? value.participants.map((participant: any) => ({
        id: normalizeMessageUserId(String(participant.id)),
        name: participant.name || getUserName(participant.id) || 'Utilizador',
        type: participant.type === 'landlord' ? 'landlord' : 'student',
        avatar: participant.avatar,
        online: !!participant.online,
      }))
    : [];

  return {
    id: String(value.id),
    participants,
    lastMessage: value.lastMessage ? normalizeMessage(value.lastMessage) : undefined,
    unreadCount: Number(value.unreadCount ?? 0),
    accommodationId: value.accommodationId,
    accommodationTitle: value.accommodationTitle,
    accommodationPrice: value.accommodationPrice,
    accommodationImage: value.accommodationImage,
    roomId: value.roomId,
    propertyId: value.propertyId,
    isGroup: !!value.isGroup,
    groupName: value.groupName,
    createdAt: toDate(value.createdAt),
    updatedAt: toDate(value.updatedAt),
  };
}

function getMessagesForConversationInternal(conversationId: string): Message[] {
  return Array.from(messagesCache.values())
    .filter(message => message.conversationId === conversationId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

function syncMirrors(): void {
  mockMessages.length = 0;
  Array.from(messagesCache.values())
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .forEach(message => mockMessages.push(message));

  mockConversations.length = 0;
  Array.from(conversationsCache.values())
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .forEach(conversation => mockConversations.push(conversation));
}

function saveMessagesLocal(): void {
  writeLocalArray(MESSAGES_STORAGE_KEY, Array.from(messagesCache.values()));
}

function saveConversationsLocal(): void {
  writeLocalArray(CONVERSATIONS_STORAGE_KEY, Array.from(conversationsCache.values()));
}

function saveAllLocal(): void {
  saveMessagesLocal();
  saveConversationsLocal();
  syncMirrors();
}

function loadLocalState(): void {
  messagesCache.clear();

  readLocalArray<any>(MESSAGES_STORAGE_KEY)
    .filter(message => message?.id && message?.conversationId)
    .forEach(message => {
      const normalized = normalizeMessage(message);
      messagesCache.set(normalized.id, normalized);
    });

  conversationsCache.clear();

  readLocalArray<any>(CONVERSATIONS_STORAGE_KEY)
    .filter(conversation => conversation?.id)
    .forEach(conversation => {
      const normalized = normalizeConversation(conversation);
      const messages = getMessagesForConversationInternal(normalized.id);
      const last = messages[messages.length - 1];

      conversationsCache.set(normalized.id, {
        ...normalized,
        lastMessage: last || normalized.lastMessage,
        unreadCount: normalized.unreadCount ?? 0,
      });
    });

  syncMirrors();
}

function readHousemates(propertyId: string): Array<{ id: string; name: string; initials?: string; room?: string }> {
  const all = safeParse<Array<{ id: string; propertyId: string; name: string; initials?: string; room?: string }>>(
    localStorage.getItem(HOUSEMATES_KEY),
    [],
  );

  return all
    .filter(housemate => housemate.propertyId === propertyId)
    .map(housemate => ({
      id: housemate.id,
      name: housemate.name,
      initials: housemate.initials,
      room: housemate.room,
    }));
}

loadLocalState();

// ─── Read API ─────────────────────────────────────────────────────────────

export function getConversationsForUser(userId: string): Conversation[] {
  loadLocalState();

  const normalizedUserId = normalizeMessageUserId(userId);

  return Array.from(conversationsCache.values())
    .filter(conversation =>
      conversation.participants.some(participant => isSameMessageUser(participant.id, normalizedUserId)),
    )
    .map(conversation => {
      const messages = getMessagesForConversationInternal(conversation.id);
      const last = messages[messages.length - 1];

      return {
        ...conversation,
        lastMessage: last || conversation.lastMessage,
        unreadCount: getUnreadCountForConversation(conversation.id, normalizedUserId),
      };
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function getConversationById(id: string): Conversation | undefined {
  loadLocalState();
  return conversationsCache.get(id);
}

export function getMessagesForConversation(conversationId: string): Message[] {
  loadLocalState();
  return getMessagesForConversationInternal(conversationId);
}

export function getUnreadCountForConversation(conversationId: string, userId: string): number {
  const normalizedUserId = normalizeMessageUserId(userId);

  return Array.from(messagesCache.values()).filter(message =>
    message.conversationId === conversationId &&
    !isSameMessageUser(message.senderId, normalizedUserId) &&
    !message.read,
  ).length;
}

export function getTotalUnreadCount(userId: string): number {
  return getConversationsForUser(userId).reduce(
    (total, conversation) => total + getUnreadCountForConversation(conversation.id, userId),
    0,
  );
}

// ─── Write API ────────────────────────────────────────────────────────────

export function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  content: string,
): Message {
  loadLocalState();

  const normalizedSenderId = normalizeMessageUserId(senderId);
  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const message: Message = {
    id,
    conversationId,
    senderId: normalizedSenderId,
    senderName: senderName || getUserName(normalizedSenderId) || 'Utilizador',
    content,
    createdAt: new Date(),
    read: false,
    type: 'text',
  };

  messagesCache.set(id, message);

  const conversation = conversationsCache.get(conversationId);

  if (conversation) {
    conversationsCache.set(conversationId, {
      ...conversation,
      lastMessage: message,
      updatedAt: message.createdAt,
    });
  }

  saveAllLocal();

  return message;
}

export function markConversationAsRead(conversationId: string, userId: string): void {
  loadLocalState();

  const normalizedUserId = normalizeMessageUserId(userId);
  const conversation = conversationsCache.get(conversationId);

  if (!conversation) return;

  for (const message of messagesCache.values()) {
    if (
      message.conversationId === conversationId &&
      !isSameMessageUser(message.senderId, normalizedUserId) &&
      !message.read
    ) {
      message.read = true;
    }
  }

  conversationsCache.set(conversationId, {
    ...conversation,
    unreadCount: 0,
  });

  saveAllLocal();
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
  loadLocalState();

  const normalizedCurrentId = normalizeMessageUserId(currentUserId);
  const normalizedOtherId = normalizeMessageUserId(otherUserId);
  const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();

  const conversation: Conversation = {
    id,
    participants: [
      {
        id: normalizedCurrentId,
        name: currentUserName || getUserName(normalizedCurrentId) || 'Utilizador',
        type: currentUserType,
        online: true,
      },
      {
        id: normalizedOtherId,
        name: otherUserName || getUserName(normalizedOtherId) || 'Utilizador',
        type: otherUserType,
        online: false,
      },
    ],
    unreadCount: 0,
    accommodationId,
    accommodationTitle,
    accommodationPrice,
    accommodationImage,
    roomId,
    propertyId,
    createdAt: now,
    updatedAt: now,
  };

  conversationsCache.set(id, conversation);
  saveConversationsLocal();

  const message = sendMessage(id, normalizedCurrentId, currentUserName, initialMessage);

  conversationsCache.set(id, {
    ...conversation,
    lastMessage: message,
    updatedAt: message.createdAt,
  });

  saveAllLocal();

  return conversationsCache.get(id) as Conversation;
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
  loadLocalState();

  const normalizedCurrentId = normalizeMessageUserId(currentUserId);
  const normalizedLandlordId = normalizeMessageUserId(landlordId);

  const existing = Array.from(conversationsCache.values()).find(conversation =>
    conversation.roomId === roomId &&
    conversation.participants.some(participant => isSameMessageUser(participant.id, normalizedCurrentId)) &&
    conversation.participants.some(participant => isSameMessageUser(participant.id, normalizedLandlordId)),
  );

  if (existing) {
    if (customMessage && customMessage.trim()) {
      sendMessage(existing.id, normalizedCurrentId, currentUserName, customMessage.trim());
    }

    return existing;
  }

  const initial = customMessage || 'Olá, tenho interesse neste quarto. Ainda está disponível?';

  return createConversation(
    normalizedCurrentId,
    currentUserName,
    currentUserType,
    normalizedLandlordId,
    landlordName,
    'landlord',
    initial,
    undefined,
    roomTitle,
    roomPrice,
    roomImage,
    roomId,
    propertyId,
  );
}

export function getHouseGroupConversation(propertyId: string, userId: string): Conversation | undefined {
  loadLocalState();

  const normalizedUserId = normalizeMessageUserId(userId);

  const existing = Array.from(conversationsCache.values()).find(conversation =>
    conversation.isGroup &&
    conversation.propertyId === propertyId &&
    conversation.participants.some(participant => isSameMessageUser(participant.id, normalizedUserId)),
  );

  if (existing) {
    const messages = getMessagesForConversationInternal(existing.id);
    const last = messages[messages.length - 1];

    return {
      ...existing,
      lastMessage: last || existing.lastMessage,
      unreadCount: getUnreadCountForConversation(existing.id, normalizedUserId),
    };
  }

  const housemates = readHousemates(propertyId);
  const userName = getUserName(normalizedUserId) || 'João Silva';

  const participants: Conversation['participants'] = [
    {
      id: normalizedUserId,
      name: userName,
      type: 'student',
      online: true,
    },
    ...housemates.map(housemate => ({
      id: normalizeMessageUserId(housemate.id),
      name: housemate.name,
      type: 'student' as const,
      online: false,
    })),
  ];

  const uniqueParticipants = participants.filter((participant, index, list) =>
    list.findIndex(item => isSameMessageUser(item.id, participant.id)) === index,
  );

  const id = `house_${propertyId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date();

  const conversation: Conversation = {
    id,
    participants: uniqueParticipants,
    unreadCount: 0,
    propertyId,
    accommodationId: propertyId,
    isGroup: true,
    groupName: 'Grupo da casa',
    createdAt: now,
    updatedAt: now,
  };

  conversationsCache.set(id, conversation);
  saveConversationsLocal();

  const welcome = sendMessage(
    id,
    'uniroom-system',
    'UniRoom',
    'Bem-vindo ao grupo da casa. Aqui podes combinar regras, limpeza, compras e assuntos do dia a dia com os teus colegas.',
  );

  conversationsCache.set(id, {
    ...conversation,
    lastMessage: welcome,
    updatedAt: welcome.createdAt,
  });

  saveAllLocal();

  return conversationsCache.get(id);
}

export async function refreshMessagesState(): Promise<void> {
  loadLocalState();
}

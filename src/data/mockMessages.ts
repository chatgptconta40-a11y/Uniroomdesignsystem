// Conversations & messages — localStorage first + Supabase background.
// Keeps the same synchronous API used by the UI, but makes conversations stable
// in Figma Make after refresh and when Supabase hydration is slow.

import { Message, Conversation } from "../types/message";
import { supabase } from "../lib/supabase";

const CONVERSATIONS_STORAGE_KEY = "uniroom_conversations";
const MESSAGES_STORAGE_KEY = "uniroom_messages";
const HOUSEMATES_KEY = "uniroom_active_home_housemates";
const USERS_STORAGE_KEY = "uniroom_all_users";

// Aliases preserved for legacy demo IDs in some pages
const USER_ID_ALIASES: Record<string, string> = {
  estudante: "1",
  student: "1",
  senhorio: "2",
  landlord: "2",
  landlord2: "2",
  r1: "4",
  "mate-1": "4",
  "mate-2": "5",
};

export function normalizeMessageUserId(userId: string): string {
  return USER_ID_ALIASES[userId] || userId;
}

export function isSameMessageUser(
  leftId: string,
  rightId: string,
): boolean {
  return (
    normalizeMessageUserId(leftId) ===
    normalizeMessageUserId(rightId)
  );
}

// ─── Caches ────────────────────────────────────────────────────────────────

const conversationsCache = new Map<string, Conversation>();
const messagesCache = new Map<string, Message>();
const profilesCache = new Map<
  string,
  {
    name: string;
    type: "student" | "landlord";
    avatar?: string;
  }
>();

export const mockMessages: Message[] = [];
export const mockConversations: Conversation[] = [];

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

// ─── LocalStorage helpers ──────────────────────────────────────────────────

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
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

function normalizeMessage(value: any): Message {
  return {
    id: value.id,
    conversationId: value.conversationId,
    senderId: normalizeMessageUserId(value.senderId),
    senderName:
      value.senderName ||
      getUserName(value.senderId) ||
      "Utilizador",
    content: value.content ?? "",
    createdAt: toDate(value.createdAt),
    read: !!value.read,
    type: value.type ?? "text",
    imageUrl: value.imageUrl,
  };
}

function normalizeConversation(value: any): Conversation {
  const participants = Array.isArray(value.participants)
    ? value.participants.map((participant: any) => ({
        id: normalizeMessageUserId(participant.id),
        name:
          participant.name ||
          getUserName(participant.id) ||
          "Utilizador",
        type:
          participant.type === "landlord"
            ? "landlord"
            : "student",
        avatar: participant.avatar,
        online: !!participant.online,
      }))
    : [];

  return {
    id: value.id,
    participants,
    lastMessage: value.lastMessage
      ? normalizeMessage(value.lastMessage)
      : undefined,
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

function syncMirrors(): void {
  mockMessages.length = 0;
  Array.from(messagesCache.values())
    .sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    )
    .forEach((message) => mockMessages.push(message));

  mockConversations.length = 0;
  Array.from(conversationsCache.values())
    .sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    )
    .forEach((conversation) =>
      mockConversations.push(conversation),
    );
}

function saveMessagesLocal(): void {
  writeLocalArray(
    MESSAGES_STORAGE_KEY,
    Array.from(messagesCache.values()),
  );
}

function saveConversationsLocal(): void {
  writeLocalArray(
    CONVERSATIONS_STORAGE_KEY,
    Array.from(conversationsCache.values()),
  );
}

function saveAllLocal(): void {
  saveConversationsLocal();
  saveMessagesLocal();
  syncMirrors();
}

function loadLocalState(): void {
  const localMessages = readLocalArray<any>(
    MESSAGES_STORAGE_KEY,
  );
  const localConversations = readLocalArray<any>(
    CONVERSATIONS_STORAGE_KEY,
  );

  messagesCache.clear();
  localMessages
    .filter((message) => message?.id && message?.conversationId)
    .forEach((message) => {
      const normalized = normalizeMessage(message);
      messagesCache.set(normalized.id, normalized);
    });

  conversationsCache.clear();
  localConversations
    .filter((conversation) => conversation?.id)
    .forEach((conversation) => {
      const normalized = normalizeConversation(conversation);
      const conversationMessages =
        getMessagesForConversationInternal(normalized.id);
      const last =
        conversationMessages[conversationMessages.length - 1];

      conversationsCache.set(normalized.id, {
        ...normalized,
        lastMessage: last || normalized.lastMessage,
        unreadCount: normalized.unreadCount ?? 0,
      });
    });

  syncMirrors();
}

function getMessagesForConversationInternal(
  conversationId: string,
): Message[] {
  return Array.from(messagesCache.values())
    .filter(
      (message) => message.conversationId === conversationId,
    )
    .sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
}

function mergeMessage(message: Message): void {
  const current = messagesCache.get(message.id);

  if (!current || message.createdAt >= current.createdAt) {
    messagesCache.set(message.id, message);
  }
}

function mergeConversation(conversation: Conversation): void {
  const current = conversationsCache.get(conversation.id);

  if (!current || conversation.updatedAt >= current.updatedAt) {
    const messages = getMessagesForConversationInternal(
      conversation.id,
    );
    const last = messages[messages.length - 1];

    conversationsCache.set(conversation.id, {
      ...conversation,
      lastMessage: last || conversation.lastMessage,
    });
  }
}

// ─── Profile helpers ───────────────────────────────────────────────────────

function getUserName(userId?: string): string | undefined {
  if (!userId) return undefined;

  try {
    const users = safeParse<any[]>(
      localStorage.getItem(USERS_STORAGE_KEY),
      [],
    );
    const found = users.find((user) =>
      isSameMessageUser(user.id, userId),
    );
    return found?.name || found?.fullName;
  } catch {
    return undefined;
  }
}

function getUserType(userId?: string): "student" | "landlord" {
  if (!userId) return "student";

  try {
    const users = safeParse<any[]>(
      localStorage.getItem(USERS_STORAGE_KEY),
      [],
    );
    const found = users.find((user) =>
      isSameMessageUser(user.id, userId),
    );
    return found?.type === "landlord" ? "landlord" : "student";
  } catch {
    return "student";
  }
}

function readHousemates(propertyId: string): Array<{
  id: string;
  name: string;
  initials: string;
  room?: string;
}> {
  try {
    const all = safeParse<
      Array<{
        id: string;
        propertyId: string;
        name: string;
        initials: string;
        room?: string;
      }>
    >(localStorage.getItem(HOUSEMATES_KEY), []);

    return all
      .filter(
        (housemate) => housemate.propertyId === propertyId,
      )
      .map((housemate) => ({
        id: housemate.id,
        name: housemate.name,
        initials: housemate.initials,
        room: housemate.room,
      }));
  } catch {
    return [];
  }
}

// ─── Supabase row mappers ──────────────────────────────────────────────────

function rowToMessage(row: any, senderName: string): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: normalizeMessageUserId(row.sender_id),
    senderName,
    content: row.content,
    createdAt: new Date(row.created_at),
    read: !!row.read,
    type: row.type ?? "text",
    imageUrl: row.image_url ?? undefined,
  };
}

function rowToConversation(
  row: any,
  participants: Conversation["participants"],
): Conversation {
  const messages = getMessagesForConversationInternal(row.id);
  const last = messages[messages.length - 1];

  return {
    id: row.id,
    participants,
    lastMessage: last,
    unreadCount: 0,
    accommodationId: row.property_id ?? undefined,
    accommodationTitle: undefined,
    accommodationPrice: undefined,
    accommodationImage: undefined,
    roomId: row.room_id ?? undefined,
    propertyId: row.property_id ?? undefined,
    isGroup: !!row.is_group,
    groupName:
      row.group_name ??
      (row.is_group ? "Grupo da casa" : undefined),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ─── Hydration ─────────────────────────────────────────────────────────────

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    loadLocalState();

    const [convsRes, partsRes, msgsRes, profsRes] =
      await Promise.all([
        supabase.from("conversations").select("*"),
        supabase.from("conversation_participants").select("*"),
        supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("id, full_name, type, avatar_url"),
      ]);

    if (profsRes.error) {
      console.error(
        "Messages hydrate profiles:",
        profsRes.error.message,
      );
    } else {
      profilesCache.clear();
      (profsRes.data ?? []).forEach((profile) => {
        profilesCache.set(profile.id, {
          name:
            profile.full_name ??
            getUserName(profile.id) ??
            "Utilizador",
          type:
            profile.type === "landlord"
              ? "landlord"
              : "student",
          avatar: profile.avatar_url ?? undefined,
        });
      });
    }

    if (msgsRes.error) {
      console.error(
        "Messages hydrate msgs:",
        msgsRes.error.message,
      );
    } else {
      (msgsRes.data ?? []).forEach((row) => {
        const senderName =
          profilesCache.get(row.sender_id)?.name ??
          getUserName(row.sender_id) ??
          "Utilizador";
        mergeMessage(rowToMessage(row, senderName));
      });
    }

    if (convsRes.error || partsRes.error) {
      if (convsRes.error)
        console.error(
          "Messages hydrate convs:",
          convsRes.error.message,
        );
      if (partsRes.error)
        console.error(
          "Messages hydrate participants:",
          partsRes.error.message,
        );
    } else {
      const parts = partsRes.data ?? [];

      (convsRes.data ?? []).forEach((row) => {
        const conversationParts = parts.filter(
          (participant) =>
            participant.conversation_id === row.id,
        );

        const participants = conversationParts.map(
          (participant) => {
            const profile = profilesCache.get(
              participant.user_id,
            );

            return {
              id: normalizeMessageUserId(participant.user_id),
              name:
                profile?.name ??
                getUserName(participant.user_id) ??
                "Utilizador",
              type:
                profile?.type ??
                getUserType(participant.user_id),
              online: false,
            };
          },
        );

        mergeConversation(rowToConversation(row, participants));
      });
    }

    saveAllLocal();
    hydrated = true;
  })();

  return hydratePromise;
}

loadLocalState();
void hydrate();

// ─── Read API ─────────────────────────────────────────────────────────────

export function getConversationsForUser(
  userId: string,
): Conversation[] {
  loadLocalState();

  const norm = normalizeMessageUserId(userId);

  return Array.from(conversationsCache.values())
    .filter((conversation) =>
      conversation.participants.some((participant) =>
        isSameMessageUser(participant.id, norm),
      ),
    )
    .map((conversation) => {
      const messages = getMessagesForConversationInternal(
        conversation.id,
      );
      const last = messages[messages.length - 1];

      return {
        ...conversation,
        lastMessage: last || conversation.lastMessage,
        unreadCount: getUnreadCountForConversation(
          conversation.id,
          norm,
        ),
      };
    })
    .sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
}

export function getConversationById(
  id: string,
): Conversation | undefined {
  loadLocalState();
  return conversationsCache.get(id);
}

export function getMessagesForConversation(
  conversationId: string,
): Message[] {
  loadLocalState();
  return getMessagesForConversationInternal(conversationId);
}

export function getUnreadCountForConversation(
  conversationId: string,
  userId: string,
): number {
  loadLocalState();

  const norm = normalizeMessageUserId(userId);

  return Array.from(messagesCache.values()).filter(
    (message) =>
      message.conversationId === conversationId &&
      !isSameMessageUser(message.senderId, norm) &&
      !message.read,
  ).length;
}

export function getTotalUnreadCount(userId: string): number {
  return getConversationsForUser(userId).reduce(
    (total, conversation) =>
      total +
      getUnreadCountForConversation(conversation.id, userId),
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

  const norm = normalizeMessageUserId(senderId);
  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const msg: Message = {
    id,
    conversationId,
    senderId: norm,
    senderName: senderName || getUserName(norm) || "Utilizador",
    content,
    createdAt: new Date(),
    read: false,
    type: "text",
  };

  messagesCache.set(id, msg);

  const conversation = conversationsCache.get(conversationId);

  if (conversation) {
    const updated: Conversation = {
      ...conversation,
      lastMessage: msg,
      updatedAt: new Date(),
      unreadCount: getUnreadCountForConversation(
        conversationId,
        norm,
      ),
    };

    conversationsCache.set(conversationId, updated);

    void supabase
      .from("conversations")
      .update({ updated_at: updated.updatedAt.toISOString() })
      .eq("id", conversationId);
  }

  saveAllLocal();

  void supabase
    .from("messages")
    .insert({
      id,
      conversation_id: conversationId,
      sender_id: norm,
      content,
      type: "text",
      read: false,
    })
    .then(({ error }) => {
      if (error)
        console.error("Message insert error:", error.message);
    });

  return msg;
}

export function markConversationAsRead(
  conversationId: string,
  userId: string,
): void {
  loadLocalState();

  const norm = normalizeMessageUserId(userId);
  const conversation = conversationsCache.get(conversationId);

  if (!conversation) return;

  const toMark: string[] = [];

  for (const message of messagesCache.values()) {
    if (
      message.conversationId === conversationId &&
      !isSameMessageUser(message.senderId, norm) &&
      !message.read
    ) {
      message.read = true;
      toMark.push(message.id);
    }
  }

  conversationsCache.set(conversationId, {
    ...conversation,
    unreadCount: 0,
  });

  saveAllLocal();

  if (toMark.length > 0) {
    void supabase
      .from("messages")
      .update({ read: true })
      .in("id", toMark);
  }
}

export function createConversation(
  currentUserId: string,
  currentUserName: string,
  currentUserType: "student" | "landlord",
  otherUserId: string,
  otherUserName: string,
  otherUserType: "student" | "landlord",
  initialMessage: string,
  accommodationId?: string,
  accommodationTitle?: string,
  accommodationPrice?: number,
  accommodationImage?: string,
  roomId?: string,
  propertyId?: string,
): Conversation {
  loadLocalState();

  const normCurrent = normalizeMessageUserId(currentUserId);
  const normOther = normalizeMessageUserId(otherUserId);
  const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();

  const conversation: Conversation = {
    id,
    participants: [
      {
        id: normCurrent,
        name:
          currentUserName ||
          getUserName(normCurrent) ||
          "Utilizador",
        type: currentUserType,
        online: true,
      },
      {
        id: normOther,
        name:
          otherUserName ||
          getUserName(normOther) ||
          "Utilizador",
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

  void supabase
    .from("conversations")
    .insert({
      id,
      property_id: propertyId ?? null,
      room_id: roomId ?? null,
      is_group: false,
    })
    .then(({ error }) => {
      if (error)
        console.error(
          "Conversation insert error:",
          error.message,
        );
    });

  void supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: id, user_id: normCurrent },
      { conversation_id: id, user_id: normOther },
    ])
    .then(({ error }) => {
      if (error)
        console.error(
          "Conversation participants insert error:",
          error.message,
        );
    });

  const message = sendMessage(
    id,
    normCurrent,
    currentUserName,
    initialMessage,
  );

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
  currentUserType: "student" | "landlord",
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

  const normCurrent = normalizeMessageUserId(currentUserId);
  const normLandlord = normalizeMessageUserId(landlordId);

  const existing = Array.from(conversationsCache.values()).find(
    (conversation) =>
      conversation.roomId === roomId &&
      conversation.participants.some((participant) =>
        isSameMessageUser(participant.id, normCurrent),
      ) &&
      conversation.participants.some((participant) =>
        isSameMessageUser(participant.id, normLandlord),
      ),
  );

  if (existing) {
    if (customMessage && customMessage.trim()) {
      sendMessage(
        existing.id,
        normCurrent,
        currentUserName,
        customMessage.trim(),
      );
    }

    return existing;
  }

  const initial =
    customMessage ||
    "Olá, tenho interesse neste quarto. Ainda está disponível?";

  return createConversation(
    normCurrent,
    currentUserName,
    currentUserType,
    normLandlord,
    landlordName,
    "landlord",
    initial,
    undefined,
    roomTitle,
    roomPrice,
    roomImage,
    roomId,
    propertyId,
  );
}

export function getHouseGroupConversation(
  propertyId: string,
  userId: string,
): Conversation | undefined {
  loadLocalState();

  const norm = normalizeMessageUserId(userId);

  const existing = Array.from(conversationsCache.values()).find(
    (conversation) =>
      conversation.isGroup &&
      conversation.propertyId === propertyId &&
      conversation.participants.some((participant) =>
        isSameMessageUser(participant.id, norm),
      ),
  );

  if (existing) {
    return {
      ...existing,
      unreadCount: getUnreadCountForConversation(
        existing.id,
        norm,
      ),
      lastMessage:
        getMessagesForConversationInternal(existing.id).slice(
          -1,
        )[0] || existing.lastMessage,
    };
  }

  /*
    Produto real / Figma Make:
    quando o estudante tem uma casa ativa, a página "A Minha Casa" já tem colegas
    mockados em localStorage. Criamos automaticamente o chat da casa para não ficar
    sempre invisível.
  */
  const housemates = readHousemates(propertyId);
  const userName = getUserName(norm) || "João Silva";

  const participants: Conversation["participants"] = [
    { id: norm, name: userName, type: "student", online: true },
    ...housemates.map((housemate) => ({
      id: normalizeMessageUserId(housemate.id),
      name: housemate.name,
      type: "student" as const,
      online: false,
    })),
  ];

  const uniqueParticipants = participants.filter(
    (participant, index, list) =>
      list.findIndex((item) =>
        isSameMessageUser(item.id, participant.id),
      ) === index,
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
    groupName: "Grupo da casa",
    createdAt: now,
    updatedAt: now,
  };

  conversationsCache.set(id, conversation);
  saveConversationsLocal();

  void supabase
    .from("conversations")
    .insert({
      id,
      property_id: propertyId,
      room_id: null,
      is_group: true,
    })
    .then(({ error }) => {
      if (error)
        console.error(
          "House group conversation insert error:",
          error.message,
        );
    });

  void supabase
    .from("conversation_participants")
    .insert(
      uniqueParticipants.map((participant) => ({
        conversation_id: id,
        user_id: participant.id,
      })),
    )
    .then(({ error }) => {
      if (error)
        console.error(
          "House group participants insert error:",
          error.message,
        );
    });

  const welcome = sendMessage(
    id,
    "uniroom-system",
    "UniRoom",
    "Bem-vindo ao grupo da casa. Aqui podes combinar regras, limpeza, compras e assuntos do dia a dia com os teus colegas.",
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
  hydrated = false;
  hydratePromise = null;
  await hydrate();
}
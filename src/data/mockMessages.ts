import { Message, Conversation } from '../types/message';

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

export const mockMessages: Message[] = [
  {
    id: 'msg1',
    conversationId: 'conv1',
    senderId: '1',
    senderName: 'João Silva',
    content: 'Boa tarde! Tenho interesse no quarto em Viseu Centro. Ainda está disponível?',
    createdAt: new Date('2026-04-18T10:30:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg2',
    conversationId: 'conv1',
    senderId: '2',
    senderName: 'Maria Santos',
    content: 'Olá, João. Sim, o quarto ainda está disponível. Está a procurar entrada para setembro?',
    createdAt: new Date('2026-04-18T11:15:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg3',
    conversationId: 'conv1',
    senderId: '1',
    senderName: 'João Silva',
    content: 'Sim, pretendo mudar-me no início de setembro para o ano letivo. É possível visitar o quarto?',
    createdAt: new Date('2026-04-18T14:20:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg4',
    conversationId: 'conv1',
    senderId: '2',
    senderName: 'Maria Santos',
    content: 'Claro. Tenho disponibilidade na terça-feira à tarde ou na quarta de manhã.',
    createdAt: new Date('2026-04-18T15:45:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg5',
    conversationId: 'conv1',
    senderId: '1',
    senderName: 'João Silva',
    content: 'Terça-feira às 15h seria perfeito. Obrigado.',
    createdAt: new Date('2026-04-19T09:00:00'),
    read: false,
    type: 'text',
  },
  {
    id: 'msg6',
    conversationId: 'conv2',
    senderId: '1',
    senderName: 'João Silva',
    content: 'Bom dia. Vi o anúncio do quarto perto da ESTGV. As despesas estão incluídas no preço?',
    createdAt: new Date('2026-04-17T09:00:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg7',
    conversationId: 'conv2',
    senderId: '2',
    senderName: 'Maria Santos',
    content: 'Bom dia. Sim, água, luz e internet já estão incluídas no valor mensal.',
    createdAt: new Date('2026-04-17T10:30:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg8',
    conversationId: 'conv2',
    senderId: '2',
    senderName: 'Maria Santos',
    content: 'Se quiser, posso enviar mais fotografias da cozinha e da zona de estudo.',
    createdAt: new Date('2026-04-17T10:31:00'),
    read: false,
    type: 'text',
  },
  {
    id: 'msg9',
    conversationId: 'conv3',
    senderId: '4',
    senderName: 'Ana Costa',
    content: 'Olá. Vi que te candidataste ao nosso apartamento. Bem-vindo.',
    createdAt: new Date('2026-04-16T16:00:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg10',
    conversationId: 'conv3',
    senderId: '1',
    senderName: 'João Silva',
    content: 'Olá, Ana. Obrigado pela mensagem. Como é o ambiente na casa?',
    createdAt: new Date('2026-04-16T17:30:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg11',
    conversationId: 'conv3',
    senderId: '4',
    senderName: 'Ana Costa',
    content: 'É tranquilo durante a semana. Somos estudantes, respeitamos horários de estudo e combinamos limpezas ao domingo.',
    createdAt: new Date('2026-04-16T18:00:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg12',
    conversationId: 'conv4',
    senderId: '4',
    senderName: 'Ana Costa',
    content: 'Bom dia, pessoal. Vou fazer compras hoje. Alguém precisa de alguma coisa?',
    createdAt: new Date('2026-05-20T10:00:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg13',
    conversationId: 'conv4',
    senderId: '5',
    senderName: 'Pedro Oliveira',
    content: 'Se puderes trazer leite e café, agradeço.',
    createdAt: new Date('2026-05-20T10:15:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg14',
    conversationId: 'conv4',
    senderId: '1',
    senderName: 'João Silva',
    content: 'Podes trazer pão e manteiga? Deixo o dinheiro na mesa.',
    createdAt: new Date('2026-05-20T10:20:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg15',
    conversationId: 'conv4',
    senderId: '4',
    senderName: 'Ana Costa',
    content: 'Perfeito. Já anotei tudo. Chego por volta das 15h.',
    createdAt: new Date('2026-05-20T10:25:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg16',
    conversationId: 'conv4',
    senderId: '5',
    senderName: 'Pedro Oliveira',
    content: 'Hoje à noite vou fazer jantar para todos. Quem se junta?',
    createdAt: new Date('2026-05-21T16:30:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg17',
    conversationId: 'conv4',
    senderId: '5',
    senderName: 'Pedro Oliveira',
    content: 'Fica combinado às 20h.',
    createdAt: new Date('2026-05-21T16:45:00'),
    read: false,
    type: 'text',
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    participants: [
      {
        id: '1',
        name: 'João Silva',
        type: 'student',
        online: true,
      },
      {
        id: '2',
        name: 'Maria Santos',
        type: 'landlord',
        online: true,
      },
    ],
    lastMessage: mockMessages.find(message => message.id === 'msg5'),
    unreadCount: 0,
    accommodationId: '1',
    accommodationTitle: 'Quarto privado em Viseu Centro',
    accommodationPrice: 280,
    accommodationImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    createdAt: new Date('2026-04-18T10:30:00'),
    updatedAt: new Date('2026-04-19T09:00:00'),
  },
  {
    id: 'conv2',
    participants: [
      {
        id: '1',
        name: 'João Silva',
        type: 'student',
        online: true,
      },
      {
        id: '2',
        name: 'Maria Santos',
        type: 'landlord',
        online: true,
      },
    ],
    lastMessage: mockMessages.find(message => message.id === 'msg8'),
    unreadCount: 1,
    accommodationId: '3',
    accommodationTitle: 'Quarto perto da ESTGV',
    accommodationPrice: 320,
    accommodationImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    createdAt: new Date('2026-04-17T09:00:00'),
    updatedAt: new Date('2026-04-17T10:31:00'),
  },
  {
    id: 'conv3',
    participants: [
      {
        id: '1',
        name: 'João Silva',
        type: 'student',
        online: true,
      },
      {
        id: '4',
        name: 'Ana Costa',
        type: 'student',
        online: false,
      },
    ],
    lastMessage: mockMessages.find(message => message.id === 'msg11'),
    unreadCount: 0,
    createdAt: new Date('2026-04-16T16:00:00'),
    updatedAt: new Date('2026-04-16T18:00:00'),
  },
  {
    id: 'conv4',
    participants: [
      {
        id: '1',
        name: 'João Silva',
        type: 'student',
        online: true,
      },
      {
        id: '4',
        name: 'Ana Costa',
        type: 'student',
        online: false,
      },
      {
        id: '5',
        name: 'Pedro Oliveira',
        type: 'student',
        online: true,
      },
    ],
    lastMessage: mockMessages.find(message => message.id === 'msg17'),
    unreadCount: 1,
    propertyId: 'prop-1',
    isGroup: true,
    groupName: 'Apartamento T3 Centro de Viseu',
    createdAt: new Date('2026-05-20T10:00:00'),
    updatedAt: new Date('2026-05-21T16:45:00'),
  },
];

export function getConversationsForUser(userId: string): Conversation[] {
  const normalizedUserId = normalizeMessageUserId(userId);

  return mockConversations
    .filter(conversation => conversation.participants.some(participant => isSameMessageUser(participant.id, normalizedUserId)))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function getConversationById(id: string): Conversation | undefined {
  return mockConversations.find(conversation => conversation.id === id);
}

export function getMessagesForConversation(conversationId: string): Message[] {
  return mockMessages
    .filter(message => message.conversationId === conversationId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function getUnreadCountForConversation(conversationId: string, userId: string): number {
  const normalizedUserId = normalizeMessageUserId(userId);

  return mockMessages.filter(message =>
    message.conversationId === conversationId &&
    !isSameMessageUser(message.senderId, normalizedUserId) &&
    !message.read
  ).length;
}

export function getTotalUnreadCount(userId: string): number {
  const userConversations = getConversationsForUser(userId);
  return userConversations.reduce(
    (total, conversation) => total + getUnreadCountForConversation(conversation.id, userId),
    0
  );
}

export function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  content: string
): Message {
  const normalizedSenderId = normalizeMessageUserId(senderId);
  const newMessage: Message = {
    id: `msg${mockMessages.length + 1}`,
    conversationId,
    senderId: normalizedSenderId,
    senderName,
    content,
    createdAt: new Date(),
    read: false,
    type: 'text',
  };

  mockMessages.push(newMessage);

  const conversation = mockConversations.find(item => item.id === conversationId);
  if (conversation) {
    conversation.lastMessage = newMessage;
    conversation.updatedAt = new Date();

    if (conversation.participants.some(participant => !isSameMessageUser(participant.id, normalizedSenderId))) {
      conversation.unreadCount += 1;
    }
  }

  return newMessage;
}

export function markConversationAsRead(conversationId: string, userId: string): void {
  const normalizedUserId = normalizeMessageUserId(userId);
  const conversation = mockConversations.find(item => item.id === conversationId);
  if (!conversation) return;

  conversation.unreadCount = 0;

  mockMessages
    .filter(message => message.conversationId === conversationId && !isSameMessageUser(message.senderId, normalizedUserId))
    .forEach(message => {
      message.read = true;
    });
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
  propertyId?: string
): Conversation {
  const normalizedCurrentUserId = normalizeMessageUserId(currentUserId);
  const normalizedOtherUserId = normalizeMessageUserId(otherUserId);
  const newConversation: Conversation = {
    id: `conv${mockConversations.length + 1}`,
    participants: [
      {
        id: normalizedCurrentUserId,
        name: currentUserName,
        type: currentUserType,
        online: true,
      },
      {
        id: normalizedOtherUserId,
        name: otherUserName,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockConversations.push(newConversation);

  const message = sendMessage(newConversation.id, normalizedCurrentUserId, currentUserName, initialMessage);
  newConversation.lastMessage = message;

  return newConversation;
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
  customMessage?: string
): Conversation {
  const normalizedCurrentUserId = normalizeMessageUserId(currentUserId);
  const normalizedLandlordId = normalizeMessageUserId(landlordId);
  const existingConversation = mockConversations.find(conversation =>
    conversation.roomId === roomId &&
    conversation.participants.some(participant => isSameMessageUser(participant.id, normalizedCurrentUserId)) &&
    conversation.participants.some(participant => isSameMessageUser(participant.id, normalizedLandlordId))
  );

  if (existingConversation) {
    if (customMessage && customMessage.trim()) {
      sendMessage(existingConversation.id, normalizedCurrentUserId, currentUserName, customMessage.trim());
    }

    return existingConversation;
  }

  const initialMessage = customMessage || 'Olá, tenho interesse neste quarto. Ainda está disponível?';

  return createConversation(
    normalizedCurrentUserId,
    currentUserName,
    currentUserType,
    normalizedLandlordId,
    landlordName,
    'landlord',
    initialMessage,
    undefined,
    roomTitle,
    roomPrice,
    roomImage,
    roomId,
    propertyId
  );
}

export function getHouseGroupConversation(propertyId: string, userId: string): Conversation | undefined {
  const normalizedUserId = normalizeMessageUserId(userId);

  return mockConversations.find(conversation =>
    conversation.isGroup &&
    conversation.propertyId === propertyId &&
    conversation.participants.some(participant => isSameMessageUser(participant.id, normalizedUserId))
  );
}

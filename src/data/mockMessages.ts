import { Message, Conversation } from '../types/message';

export const mockMessages: Message[] = [
  // Conversation 1 - with landlord about accommodation 1
  {
    id: 'msg1',
    conversationId: 'conv1',
    senderId: 'estudante',
    senderName: 'Estudante UniRoom',
    content: 'Boa tarde! Tenho interesse no quarto em Viseu Centro. Ainda está disponível?',
    createdAt: new Date('2026-04-18T10:30:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg2',
    conversationId: 'conv1',
    senderId: 'senhorio',
    senderName: 'Senhorios Lda.',
    content: 'Olá! Sim, o quarto ainda está disponível. Quando gostaria de se mudar?',
    createdAt: new Date('2026-04-18T11:15:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg3',
    conversationId: 'conv1',
    senderId: 'estudante',
    senderName: 'Estudante UniRoom',
    content: 'Pretendo mudar-me no início de setembro, para o ano letivo. É possível fazer uma visita ao quarto?',
    createdAt: new Date('2026-04-18T14:20:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg4',
    conversationId: 'conv1',
    senderId: 'senhorio',
    senderName: 'Senhorios Lda.',
    content: 'Claro! Podemos agendar uma visita para a próxima semana. Que dia lhe dá jeito?',
    createdAt: new Date('2026-04-18T15:45:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg5',
    conversationId: 'conv1',
    senderId: 'estudante',
    senderName: 'Estudante UniRoom',
    content: 'Terça-feira à tarde seria perfeito. Por volta das 15h?',
    createdAt: new Date('2026-04-19T09:00:00'),
    read: false,
    type: 'text',
  },

  // Conversation 2 - with another landlord
  {
    id: 'msg6',
    conversationId: 'conv2',
    senderId: 'estudante',
    senderName: 'Estudante UniRoom',
    content: 'Bom dia! Vi o anúncio do quarto no Porto. As despesas estão incluídas no preço?',
    createdAt: new Date('2026-04-17T09:00:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg7',
    conversationId: 'conv2',
    senderId: 'landlord2',
    senderName: 'Maria Silva',
    content: 'Bom dia! Sim, as despesas de água e luz estão incluídas. Internet também.',
    createdAt: new Date('2026-04-17T10:30:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg8',
    conversationId: 'conv2',
    senderId: 'landlord2',
    senderName: 'Maria Silva',
    content: 'Se tiver mais alguma dúvida não hesite em perguntar! 😊',
    createdAt: new Date('2026-04-17T10:31:00'),
    read: true,
    type: 'text',
  },

  // Conversation 3 - with current roommate
  {
    id: 'msg9',
    conversationId: 'conv3',
    senderId: 'r1',
    senderName: 'Ana Costa',
    content: 'Olá! Vi que te candidataste ao nosso apartamento. Bem-vindo/a! 🏠',
    createdAt: new Date('2026-04-16T16:00:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg10',
    conversationId: 'conv3',
    senderId: 'estudante',
    senderName: 'Estudante UniRoom',
    content: 'Olá Ana! Obrigado/a pela mensagem. Como é o ambiente na casa?',
    createdAt: new Date('2026-04-16T17:30:00'),
    read: true,
    type: 'text',
  },
  {
    id: 'msg11',
    conversationId: 'conv3',
    senderId: 'r1',
    senderName: 'Ana Costa',
    content: 'É muito bom! Somos todos estudantes, ambiente tranquilo mas também gostamos de conviver. A localização é ótima.',
    createdAt: new Date('2026-04-16T18:00:00'),
    read: true,
    type: 'text',
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    participants: [
      {
        id: 'estudante',
        name: 'Estudante UniRoom',
        type: 'student',
        online: true,
      },
      {
        id: 'senhorio',
        name: 'Senhorios Lda.',
        type: 'landlord',
        online: false,
      },
    ],
    lastMessage: mockMessages.find(m => m.id === 'msg5'),
    unreadCount: 1,
    accommodationId: '1',
    accommodationTitle: 'Quarto confortável em Viseu Centro',
    accommodationPrice: 280,
    accommodationImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    createdAt: new Date('2026-04-18T10:30:00'),
    updatedAt: new Date('2026-04-19T09:00:00'),
  },
  {
    id: 'conv2',
    participants: [
      {
        id: 'estudante',
        name: 'Estudante UniRoom',
        type: 'student',
        online: true,
      },
      {
        id: 'landlord2',
        name: 'Maria Silva',
        type: 'landlord',
        online: true,
      },
    ],
    lastMessage: mockMessages.find(m => m.id === 'msg8'),
    unreadCount: 0,
    accommodationId: '3',
    accommodationTitle: 'Quarto Confortável no Porto',
    accommodationPrice: 320,
    accommodationImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    createdAt: new Date('2026-04-17T09:00:00'),
    updatedAt: new Date('2026-04-17T10:31:00'),
  },
  {
    id: 'conv3',
    participants: [
      {
        id: 'estudante',
        name: 'Estudante UniRoom',
        type: 'student',
        online: true,
      },
      {
        id: 'r1',
        name: 'Ana Costa',
        type: 'student',
        online: false,
      },
    ],
    lastMessage: mockMessages.find(m => m.id === 'msg11'),
    unreadCount: 0,
    createdAt: new Date('2026-04-16T16:00:00'),
    updatedAt: new Date('2026-04-16T18:00:00'),
  },
];

// Helper functions
export function getConversationsForUser(userId: string): Conversation[] {
  return mockConversations
    .filter(conv => conv.participants.some(p => p.id === userId))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function getConversationById(id: string): Conversation | undefined {
  return mockConversations.find(conv => conv.id === id);
}

export function getMessagesForConversation(conversationId: string): Message[] {
  return mockMessages
    .filter(msg => msg.conversationId === conversationId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function getTotalUnreadCount(userId: string): number {
  const userConversations = getConversationsForUser(userId);
  return userConversations.reduce((total, conv) => total + conv.unreadCount, 0);
}

export function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  content: string
): Message {
  const newMessage: Message = {
    id: `msg${mockMessages.length + 1}`,
    conversationId,
    senderId,
    senderName,
    content,
    createdAt: new Date(),
    read: false,
    type: 'text',
  };

  mockMessages.push(newMessage);

  // Update conversation
  const conversation = mockConversations.find(c => c.id === conversationId);
  if (conversation) {
    conversation.lastMessage = newMessage;
    conversation.updatedAt = new Date();
    // Increment unread count for other participants
    const otherParticipant = conversation.participants.find(p => p.id !== senderId);
    if (otherParticipant) {
      conversation.unreadCount++;
    }
  }

  return newMessage;
}

export function markConversationAsRead(conversationId: string, userId: string): void {
  const conversation = mockConversations.find(c => c.id === conversationId);
  if (!conversation) return;

  conversation.unreadCount = 0;

  // Mark all messages as read
  mockMessages
    .filter(msg => msg.conversationId === conversationId && msg.senderId !== userId)
    .forEach(msg => msg.read = true);
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
  accommodationImage?: string
): Conversation {
  const newConversation: Conversation = {
    id: `conv${mockConversations.length + 1}`,
    participants: [
      {
        id: currentUserId,
        name: currentUserName,
        type: currentUserType,
        online: true,
      },
      {
        id: otherUserId,
        name: otherUserName,
        type: otherUserType,
        online: false,
      },
    ],
    unreadCount: 1,
    accommodationId,
    accommodationTitle,
    accommodationPrice,
    accommodationImage,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockConversations.push(newConversation);

  // Send initial message
  const message = sendMessage(newConversation.id, currentUserId, currentUserName, initialMessage);
  newConversation.lastMessage = message;

  return newConversation;
}

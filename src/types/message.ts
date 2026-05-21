export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  read: boolean;
  type: 'text' | 'image';
  imageUrl?: string;
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    type: 'student' | 'landlord';
    avatar?: string;
    online: boolean;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  accommodationId?: string;
  accommodationTitle?: string;
  accommodationPrice?: number;
  accommodationImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

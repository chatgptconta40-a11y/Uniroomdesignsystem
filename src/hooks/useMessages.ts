import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Conversation, Message } from '../types/message';
import { useDataBusRefresh } from '../lib/dataBus';

// ─── DB mappers ───────────────────────────────────────────────

function dbToMessage(row: any): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name || 'Utilizador',
    content: row.content,
    createdAt: new Date(row.created_at),
    // read_at is the new source; fall back to the legacy boolean for old rows
    read: row.read_at != null || row.read === true,
    type: row.type === 'image' ? 'image' : 'text',
    imageUrl: row.image_url ?? undefined,
  };
}

function dbToConversation(row: any, messages: Message[], currentUserId: string): Conversation {
  const convMessages = messages
    .filter(m => m.conversationId === row.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const lastMessage = convMessages[0];
  const unreadCount = convMessages.filter(
    m => m.senderId !== currentUserId && !m.read,
  ).length;

  const participants: Conversation['participants'] = [];
  if (row.student_id) {
    participants.push({
      id: row.student_id,
      name: row.student_name || 'Estudante',
      type: 'student',
      online: false,
    });
  }
  if (row.landlord_id) {
    participants.push({
      id: row.landlord_id,
      name: row.landlord_name || 'Senhorio',
      type: 'landlord',
      online: false,
    });
  }

  return {
    id: row.id,
    participants,
    lastMessage,
    unreadCount,
    accommodationId: undefined,
    accommodationTitle: row.accommodation_title ?? undefined,
    accommodationPrice: row.accommodation_price ?? undefined,
    accommodationImage: row.accommodation_image ?? undefined,
    roomId: row.room_id ?? undefined,
    propertyId: row.property_id ?? undefined,
    isGroup: row.is_group || false,
    groupName: row.group_name ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.last_message_at || row.updated_at),
  };
}

// ─── useConversations ─────────────────────────────────────────

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }

    const { data: convRows, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .or(`student_id.eq.${user.id},landlord_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (convErr) {
      console.error('Conversations fetch error:', convErr.message);
      return;
    }

    if (!convRows || convRows.length === 0) {
      setConversations([]);
      return;
    }

    const convIds = convRows.map(c => c.id);

    const { data: msgRows, error: msgErr } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });

    if (msgErr) {
      console.error('Messages fetch error (for conversations):', msgErr.message);
    }

    const messages = (msgRows ?? []).map(dbToMessage);
    setConversations(convRows.map(row => dbToConversation(row, messages, user.id)));
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useDataBusRefresh('messages', refresh);

  const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return { conversations, totalUnreadCount, refresh };
}

// ─── useMessages ─────────────────────────────────────────────

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  const refresh = useCallback(async () => {
    if (!conversationId || !user) {
      setMessages([]);
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Messages fetch error:', error.message);
      return;
    }

    setMessages((data ?? []).map(dbToMessage));
  }, [conversationId, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useDataBusRefresh('messages', refresh);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!conversationId || !user || !content.trim()) return;

    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    // Optimistic update
    const optimistic: Message = {
      id,
      conversationId,
      senderId: user.id,
      senderName: user.name || '',
      content: content.trim(),
      createdAt: new Date(),
      read: false,
      type: 'text',
    };
    setMessages(prev => [...prev, optimistic]);

    const { error: msgErr } = await supabase.from('messages').insert({
      id,
      conversation_id: conversationId,
      sender_id: user.id,
      sender_name: user.name || '',
      content: content.trim(),
      type: 'text',
    });

    if (msgErr) {
      console.error('Send message error:', msgErr.message);
      setMessages(prev => prev.filter(m => m.id !== id));
      return;
    }

    // Update conversation timestamps
    await supabase
      .from('conversations')
      .update({ last_message_at: now, updated_at: now })
      .eq('id', conversationId);
  }, [conversationId, user]);

  const markConversationRead = useCallback(async (): Promise<void> => {
    if (!conversationId || !user) return;

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null)
      .eq('read', false);

    setMessages(prev =>
      prev.map(m =>
        m.senderId !== user.id && !m.read ? { ...m, read: true } : m,
      ),
    );
  }, [conversationId, user]);

  return { messages, sendMessage, markConversationRead, refresh };
}

// ─── findOrCreateConversation ─────────────────────────────────

export interface FindOrCreateParams {
  studentId: string;
  studentName: string;
  landlordId: string;
  landlordName: string;
  roomId?: string;
  propertyId?: string;
  accommodationTitle?: string;
  accommodationPrice?: number;
  accommodationImage?: string;
  initialMessage: string;
}

export async function findOrCreateConversation(params: FindOrCreateParams): Promise<string> {
  const {
    studentId, studentName, landlordId, landlordName,
    roomId, propertyId,
    accommodationTitle, accommodationPrice, accommodationImage,
    initialMessage,
  } = params;

  // Try to find existing conversation for this (student, landlord, room) triplet
  if (roomId) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('student_id', studentId)
      .eq('landlord_id', landlordId)
      .eq('room_id', roomId)
      .maybeSingle();

    if (existing) {
      if (initialMessage.trim()) {
        const now = new Date().toISOString();
        const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        await supabase.from('messages').insert({
          id: msgId,
          conversation_id: existing.id,
          sender_id: studentId,
          sender_name: studentName,
          content: initialMessage.trim(),
          type: 'text',
        });
        await supabase
          .from('conversations')
          .update({ last_message_at: now, updated_at: now })
          .eq('id', existing.id);
      }
      return existing.id;
    }
  }

  // Create new conversation
  const convId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const { error: convErr } = await supabase.from('conversations').insert({
    id: convId,
    student_id: studentId,
    student_name: studentName,
    landlord_id: landlordId,
    landlord_name: landlordName,
    room_id: roomId ?? null,
    property_id: propertyId ?? null,
    accommodation_title: accommodationTitle ?? null,
    accommodation_price: accommodationPrice ?? null,
    accommodation_image: accommodationImage ?? null,
    last_message_at: now,
  });

  if (convErr) {
    // Handle unique constraint violation — race condition, fetch the existing row
    if (convErr.code === '23505' && roomId) {
      const { data: fallback } = await supabase
        .from('conversations')
        .select('id')
        .eq('student_id', studentId)
        .eq('landlord_id', landlordId)
        .eq('room_id', roomId)
        .maybeSingle();
      if (fallback) return fallback.id;
    }
    throw new Error(convErr.message);
  }

  // Insert initial message
  const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await supabase.from('messages').insert({
    id: msgId,
    conversation_id: convId,
    sender_id: studentId,
    sender_name: studentName,
    content: initialMessage.trim(),
    type: 'text',
  });

  return convId;
}

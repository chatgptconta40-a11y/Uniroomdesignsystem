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
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: convRows, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .or(`student_id.eq.${user.id},landlord_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (convErr) {
      console.error('[MESSAGES] conversations fetch error', {
        message: convErr.message,
        code: convErr.code,
        details: convErr.details,
        hint: convErr.hint,
        userId: user.id,
      });
      setLoading(false);
      return;
    }

    if (!convRows || convRows.length === 0) {
      setConversations([]);
      setLoading(false);
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
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useDataBusRefresh('messages', refresh);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`realtime:conversations-list:${user.id}:${Math.random().toString(36).slice(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        void refresh();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, refresh]);

  const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return { conversations, loading, totalUnreadCount, refresh };
}

// ─── useMessages ─────────────────────────────────────────────

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(!!conversationId);

  const refresh = useCallback(async () => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[MESSAGES] messages fetch error', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        conversationId,
      });
      setLoading(false);
      return;
    }

    setMessages((data ?? []).map(dbToMessage));
    setLoading(false);
  }, [conversationId, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useDataBusRefresh('messages', refresh);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`realtime:messages-thread:${conversationId}:${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        payload => {
          if (payload.eventType === 'DELETE') {
            const id = String((payload.old as { id?: string }).id ?? '');
            if (!id) return;
            setMessages(prev => prev.some(m => m.id === id) ? prev.filter(m => m.id !== id) : prev);
            return;
          }
          const incoming = dbToMessage(payload.new);
          setMessages(prev => {
            const idx = prev.findIndex(m => m.id === incoming.id);
            if (idx === -1) return [...prev, incoming];
            return prev.map(m => m.id === incoming.id ? incoming : m);
          });
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId]);

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
      console.error('[MESSAGES] message insert error (sendMessage)', {
        message: msgErr.message,
        code: msgErr.code,
        details: msgErr.details,
        hint: msgErr.hint,
        conversationId,
        senderId: user.id,
      });
      setMessages(prev => prev.filter(m => m.id !== id));
      throw new Error(msgErr.message);
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

  return { messages, sendMessage, markConversationRead, refresh, loading };
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
  /** The authenticated user who is actually sending the first message. */
  initialSenderId: string;
  initialSenderName: string;
}

export async function findOrCreateConversation(params: FindOrCreateParams): Promise<string> {
  const {
    studentId, studentName, landlordId, landlordName,
    roomId, propertyId,
    accommodationTitle, accommodationPrice, accommodationImage,
    initialMessage, initialSenderId, initialSenderName,
  } = params;

  // Insert a message into an existing conversation and bump timestamps.
  const insertMsg = async (convId: string) => {
    if (!initialMessage.trim()) return;
    const now = new Date().toISOString();
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    console.log('[MESSAGES] inserting message', { conversationId: convId, senderId: initialSenderId });
    const { error: msgErr } = await supabase.from('messages').insert({
      id: msgId,
      conversation_id: convId,
      sender_id: initialSenderId,
      sender_name: initialSenderName,
      content: initialMessage.trim(),
      type: 'text',
    });
    if (msgErr) {
      console.error('[MESSAGES] message insert error', {
        message: msgErr.message,
        code: msgErr.code,
        details: msgErr.details,
        hint: msgErr.hint,
        conversationId: convId,
        senderId: initialSenderId,
      });
      throw new Error(`message insert: ${msgErr.message}`);
    }
    console.log('[MESSAGES] message inserted', { id: msgId });
    const { error: updErr } = await supabase
      .from('conversations')
      .update({ last_message_at: now, updated_at: now })
      .eq('id', convId);
    if (updErr) {
      console.error('[MESSAGES] conversation timestamp update error', {
        message: updErr.message,
        code: updErr.code,
        details: updErr.details,
        hint: updErr.hint,
        conversationId: convId,
      });
      // Not fatal — message was already inserted.
    }
  };

  // Find an existing conversation for this (student, landlord) pair.
  // Priority: roomId > propertyId > neither.
  const findExisting = async (): Promise<string | null> => {
    let q = supabase.from('conversations').select('id')
      .eq('student_id', studentId)
      .eq('landlord_id', landlordId);
    if (roomId) {
      q = q.eq('room_id', roomId);
    } else if (propertyId) {
      q = q.eq('property_id', propertyId).is('room_id', null);
    } else {
      q = q.is('room_id', null).is('property_id', null);
    }
    const { data } = await q.maybeSingle();
    return data?.id ?? null;
  };

  console.log('[MESSAGES] creating conversation', {
    studentId, landlordId, roomId, propertyId, initialSenderId,
  });

  const existingId = await findExisting();
  if (existingId) {
    console.log('[MESSAGES] reusing existing conversation', { id: existingId });
    await insertMsg(existingId);
    console.log('[MESSAGES] navigating to conversation', { id: existingId });
    return existingId;
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
    console.error('[MESSAGES] conversation insert error', {
      message: convErr.message,
      code: convErr.code,
      details: convErr.details,
      hint: convErr.hint,
      studentId, landlordId, roomId, propertyId,
    });
    // Race condition — another insert won; find and reuse it.
    if (convErr.code === '23505') {
      const fallbackId = await findExisting();
      if (fallbackId) {
        await insertMsg(fallbackId);
        console.log('[MESSAGES] navigating to conversation', { id: fallbackId });
        return fallbackId;
      }
    }
    throw new Error(`conversation insert: ${convErr.message}`);
  }

  console.log('[MESSAGES] conversation created', { id: convId });
  await insertMsg(convId);
  console.log('[MESSAGES] navigating to conversation', { id: convId });
  return convId;
}

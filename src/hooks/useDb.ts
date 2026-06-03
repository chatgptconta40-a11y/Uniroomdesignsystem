import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Application, Notification, ActiveHome, ApplicationStatus } from '../types/accommodation';
import type { MaintenanceRequest } from '../types/maintenance';
import type { StudentProfile } from '../types/profile';
import { fetchStudentProfileFromDb } from '../db/profilesDb';
import { useDataBusRefresh } from '../lib/dataBus';

// ============================================================
// APPLICATIONS
// ============================================================
export function dbToApplication(row: any): Application {
  return {
    id: row.id,
    userId: row.user_id,
    accommodationId: row.property_id ?? '',
    propertyId: row.property_id ?? undefined,
    roomId: row.room_id ?? undefined,
    landlordId: row.landlord_id,
    landlordName: undefined,
    status: row.status,
    message: row.message ?? '',
    moveInDate: row.move_in_date ? new Date(row.move_in_date) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : undefined,
    linkedCandidateId: row.linked_candidate_id ?? undefined,
    visitDate: row.visit_date ?? undefined,
    visitFormat: row.visit_format ?? undefined,
    visitNote: row.visit_note ?? undefined,
  };
}

export function useApplications(opts: { scope?: 'student' | 'landlord' | 'all' } = {}) {
  const { user } = useAuth();
  const scope = opts.scope ?? 'all';
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setApplications([]); setLoading(false); return; }
    setLoading(true);
    let q = supabase.from('applications').select('*').order('created_at', { ascending: false });
    if (scope === 'student') q = q.eq('user_id', user.id);
    else if (scope === 'landlord') q = q.eq('landlord_id', user.id);
    const { data, error } = await q;
    if (error) console.error('Applications fetch error:', error.message);
    setApplications((data ?? []).map(dbToApplication));
    setLoading(false);
  }, [user, scope]);

  useEffect(() => { refresh(); }, [refresh]);
  useDataBusRefresh('applications', refresh);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`realtime:applications:${scope}:${user.id}:${Math.random().toString(36).slice(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, payload => {
        if (payload.eventType === 'DELETE') {
          const id = String((payload.old as { id?: string }).id ?? '');
          if (!id) return;
          setApplications(prev => prev.some(a => a.id === id) ? prev.filter(a => a.id !== id) : prev);
          return;
        }
        const row = payload.new as { user_id?: string; landlord_id?: string };
        if (scope === 'student' && row.user_id !== user.id) return;
        if (scope === 'landlord' && row.landlord_id !== user.id) return;
        const incoming = dbToApplication(payload.new);
        setApplications(prev => {
          const idx = prev.findIndex(a => a.id === incoming.id);
          return idx === -1 ? [incoming, ...prev] : prev.map(a => a.id === incoming.id ? incoming : a);
        });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, scope]);

  const create = async (input: { propertyId?: string; roomId?: string; landlordId: string; message: string; moveInDate?: Date }) => {
    if (!user) return null;
    const id = `app-${Date.now()}`;
    const { error } = await supabase.from('applications').insert({
      id, user_id: user.id,
      property_id: input.propertyId ?? null, room_id: input.roomId ?? null,
      landlord_id: input.landlordId, status: 'pending', message: input.message,
      move_in_date: input.moveInDate ? input.moveInDate.toISOString().slice(0, 10) : null,
    });
    if (error) { console.error('Application create error:', error.message); return null; }
    await refresh();
    return id;
  };

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const patch: Record<string, unknown> = { status };
    if (status === 'accepted' || status === 'rejected' || status === 'under_review') patch.reviewed_at = new Date().toISOString();
    if (status === 'confirmed') patch.confirmed_at = new Date().toISOString();
    const { error } = await supabase.from('applications').update(patch).eq('id', id);
    if (error) { console.error('Application status error:', error.message); return; }
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status, updatedAt: new Date() } : a));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('applications').delete().eq('id', id);
    if (error) { console.error('Application delete error:', error.message); return; }
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  return { applications, loading, refresh, create, updateStatus, remove };
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function dbToNotification(row: any): Notification {
  return {
    id: row.id, userId: row.user_id, type: row.type,
    title: row.title, message: row.message ?? '',
    link: row.link ?? undefined, read: !!row.read,
    createdAt: new Date(row.created_at),
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setNotifications([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) console.error('Notifications fetch error:', error.message);
    setNotifications((data ?? []).map(dbToNotification));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useDataBusRefresh('notifications', refresh);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`realtime:notifications:${user.id}:${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        payload => {
          if (payload.eventType === 'DELETE') {
            const id = String((payload.old as { id?: string }).id ?? '');
            if (!id) return;
            setNotifications(prev => prev.some(n => n.id === id) ? prev.filter(n => n.id !== id) : prev);
            return;
          }
          const incoming = dbToNotification(payload.new);
          setNotifications(prev => {
            const idx = prev.findIndex(n => n.id === incoming.id);
            return idx === -1 ? [incoming, ...prev] : prev.map(n => n.id === incoming.id ? incoming : n);
          });
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) { console.error('Notif read error:', error.message); return; }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    if (error) { console.error('Notif read-all error:', error.message); return; }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading, refresh, markAsRead, markAllAsRead, unreadCount };
}

// ============================================================
// MAINTENANCE
// ============================================================
function dbToMaintenance(row: any): MaintenanceRequest {
  return {
    id: row.id, userId: row.user_id,
    propertyId: row.property_id ?? undefined, roomId: row.room_id ?? undefined,
    landlordId: row.landlord_id, category: row.category,
    title: row.title, description: row.description ?? '',
    urgency: row.urgency, status: row.status,
    photoUrl: row.photo_url ?? undefined,
    createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
  };
}

export function useMaintenance(opts: { scope?: 'student' | 'landlord' | 'all' } = {}) {
  const { user } = useAuth();
  const scope = opts.scope ?? 'all';
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setRequests([]); setLoading(false); return; }
    setLoading(true);
    let q = supabase.from('maintenance_requests').select('*').order('created_at', { ascending: false });
    if (scope === 'student') q = q.eq('user_id', user.id);
    else if (scope === 'landlord') q = q.eq('landlord_id', user.id);
    const { data, error } = await q;
    if (error) console.error('Maintenance fetch error:', error.message);
    setRequests((data ?? []).map(dbToMaintenance));
    setLoading(false);
  }, [user, scope]);

  useEffect(() => { refresh(); }, [refresh]);
  useDataBusRefresh('maintenance', refresh);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`realtime:maintenance:${scope}:${user.id}:${Math.random().toString(36).slice(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, payload => {
        if (payload.eventType === 'DELETE') {
          const id = String((payload.old as { id?: string }).id ?? '');
          if (!id) return;
          setRequests(prev => prev.some(r => r.id === id) ? prev.filter(r => r.id !== id) : prev);
          return;
        }
        const row = payload.new as { user_id?: string; landlord_id?: string };
        if (scope === 'student' && row.user_id !== user.id) return;
        if (scope === 'landlord' && row.landlord_id !== user.id) return;
        const incoming = dbToMaintenance(payload.new);
        setRequests(prev => {
          const idx = prev.findIndex(r => r.id === incoming.id);
          return idx === -1 ? [incoming, ...prev] : prev.map(r => r.id === incoming.id ? incoming : r);
        });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, scope]);

  const create = async (input: Omit<MaintenanceRequest, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>) => {
    if (!user) return null;
    const id = `maint-${Date.now()}`;
    const { error } = await supabase.from('maintenance_requests').insert({
      id, user_id: user.id, property_id: input.propertyId ?? null, room_id: input.roomId ?? null,
      landlord_id: input.landlordId, category: input.category, title: input.title,
      description: input.description, urgency: input.urgency, status: 'pending',
      photo_url: input.photoUrl ?? null,
    });
    if (error) { console.error('Maintenance create error:', error.message); return null; }
    await refresh();
    return id;
  };

  const updateStatus = async (id: string, status: MaintenanceRequest['status']) => {
    const patch: Record<string, unknown> = { status };
    if (status === 'resolved' || status === 'closed') patch.resolved_at = new Date().toISOString();
    const { error } = await supabase.from('maintenance_requests').update(patch).eq('id', id);
    if (error) { console.error('Maintenance status error:', error.message); return; }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt: new Date() } : r));
  };

  return { requests, loading, refresh, create, updateStatus };
}

// ============================================================
// MESSAGES & CONVERSATIONS
// ============================================================
export interface ConversationRow {
  id: string;
  propertyId?: string;
  roomId?: string;
  participants: { id: string; name: string; avatar?: string; type?: string }[];
  lastMessage?: { content: string; createdAt: Date; senderId: string };
  unreadCount: number;
  updatedAt: Date;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image';
  imageUrl?: string;
  read: boolean;
  createdAt: Date;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setConversations([]); setLoading(false); return; }
    setLoading(true);

    const { data: myParts } = await supabase
      .from('conversation_participants').select('conversation_id').eq('user_id', user.id);
    const convIds = (myParts ?? []).map(r => r.conversation_id);
    if (convIds.length === 0) { setConversations([]); setLoading(false); return; }

    const [convsRes, partsRes, msgsRes] = await Promise.all([
      supabase.from('conversations').select('*').in('id', convIds),
      supabase.from('conversation_participants').select('*').in('conversation_id', convIds),
      supabase.from('messages').select('*').in('conversation_id', convIds).order('created_at', { ascending: false }),
    ]);
    const profileIds = [...new Set((partsRes.data ?? []).map(p => p.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles').select('id, full_name, avatar_url, type').in('id', profileIds);
    const profileMap = new Map((profilesData ?? []).map(p => [p.id, p]));

    const list: ConversationRow[] = (convsRes.data ?? []).map(c => {
      const participants = (partsRes.data ?? [])
        .filter(p => p.conversation_id === c.id)
        .map(p => {
          const prof = profileMap.get(p.user_id);
          return { id: p.user_id, name: prof?.full_name ?? 'Utilizador', avatar: prof?.avatar_url ?? undefined, type: prof?.type };
        });
      const msgs = (msgsRes.data ?? []).filter(m => m.conversation_id === c.id);
      const last = msgs[0];
      const unread = msgs.filter(m => !m.read && m.sender_id !== user.id).length;
      return {
        id: c.id, propertyId: c.property_id ?? undefined, roomId: c.room_id ?? undefined,
        participants,
        lastMessage: last ? { content: last.content, createdAt: new Date(last.created_at), senderId: last.sender_id } : undefined,
        unreadCount: unread,
        updatedAt: new Date(c.updated_at),
      };
    }).sort((a, b) => (b.lastMessage?.createdAt.getTime() ?? 0) - (a.lastMessage?.createdAt.getTime() ?? 0));

    setConversations(list);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  useDataBusRefresh('messages', refresh);

  useEffect(() => {
    if (!user) return;
    // Qualquer message nova/alterada pode mexer em last_message ou unread.
    // O refresh enriquece com participants/profiles, por isso refazemos.
    const channel = supabase
      .channel(`realtime:conversations:${user.id}:${Math.random().toString(36).slice(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        void refresh();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, refresh]);

  return { conversations, loading, refresh };
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!conversationId) { setMessages([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    if (error) console.error('Messages fetch error:', error.message);
    setMessages((data ?? []).map(m => ({
      id: m.id, conversationId: m.conversation_id, senderId: m.sender_id,
      content: m.content, type: m.type, imageUrl: m.image_url ?? undefined,
      read: !!m.read, createdAt: new Date(m.created_at),
    })));
    setLoading(false);
  }, [conversationId]);

  useEffect(() => { refresh(); }, [refresh]);
  useDataBusRefresh('messages', refresh);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`realtime:messages:${conversationId}:${Math.random().toString(36).slice(2, 9)}`)
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
          const m = payload.new as {
            id: string; conversation_id: string; sender_id: string; content: string;
            type: 'text' | 'image'; image_url?: string | null; read: boolean; created_at: string;
          };
          const incoming: MessageRow = {
            id: m.id, conversationId: m.conversation_id, senderId: m.sender_id,
            content: m.content, type: m.type, imageUrl: m.image_url ?? undefined,
            read: !!m.read, createdAt: new Date(m.created_at),
          };
          setMessages(prev => {
            const idx = prev.findIndex(x => x.id === incoming.id);
            if (idx === -1) {
              // Manter ordem cronológica (ascending) usada por este hook.
              return [...prev, incoming];
            }
            return prev.map(x => x.id === incoming.id ? incoming : x);
          });
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId]);

  const send = async (content: string) => {
    if (!user || !conversationId) return null;
    const id = `msg-${Date.now()}`;
    const { error } = await supabase.from('messages').insert({
      id, conversation_id: conversationId, sender_id: user.id, content, type: 'text', read: false,
    });
    if (error) { console.error('Message send error:', error.message); return null; }
    await refresh();
    return id;
  };

  const markRead = async () => {
    if (!user || !conversationId) return;
    await supabase.from('messages').update({ read: true })
      .eq('conversation_id', conversationId).neq('sender_id', user.id).eq('read', false);
  };

  return { messages, loading, refresh, send, markRead };
}

// ============================================================
// REVIEWS & TRUST
// ============================================================
export interface ReviewRow {
  id: string;
  propertyId?: string;
  reviewedUserId?: string;
  reviewerId: string;
  reviewerName?: string;
  rating: number;
  criteria: { quality?: number; coexistence?: number; landlordResponse?: number; location?: number; valueForMoney?: number };
  comment: string;
  recommend?: boolean;
  helpful: number;
  verified: boolean;
  createdAt: Date;
}

export function useReviews(opts: { propertyId?: string; userId?: string } = {}) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (opts.propertyId) q = q.eq('property_id', opts.propertyId);
    if (opts.userId) q = q.eq('reviewed_user_id', opts.userId);
    const { data, error } = await q;
    if (error) console.error('Reviews fetch error:', error.message);
    const list: ReviewRow[] = (data ?? []).map(r => ({
      id: r.id, propertyId: r.property_id ?? undefined,
      reviewedUserId: r.reviewed_user_id ?? undefined, reviewerId: r.reviewer_id,
      rating: r.rating, criteria: r.criteria ?? {}, comment: r.comment ?? '',
      recommend: r.recommend ?? undefined, helpful: r.helpful ?? 0,
      verified: !!r.verified, createdAt: new Date(r.created_at),
    }));
    setReviews(list);
    setLoading(false);
  }, [opts.propertyId, opts.userId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { reviews, loading, refresh };
}

export function useTrustScore(userId: string | undefined) {
  const [trust, setTrust] = useState<any | null>(null);
  const [verification, setVerification] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) { setTrust(null); setVerification(null); setLoading(false); return; }
      setLoading(true);
      const [t, v] = await Promise.all([
        supabase.from('trust_scores').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('verification_status').select('*').eq('user_id', userId).maybeSingle(),
      ]);
      if (!cancelled) {
        setTrust(t.data ?? null);
        setVerification(v.data ?? null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return { trust, verification, loading };
}

// ============================================================
// ACTIVE HOME
// ============================================================
function dbToActiveHome(row: any): ActiveHome {
  return {
    id: row.id, studentId: row.student_id, propertyId: row.property_id,
    roomId: row.room_id, applicationId: row.application_id ?? '',
    landlordId: row.landlord_id, landlordName: '',
    moveInDate: new Date(row.move_in_date),
    contractEndDate: row.contract_end_date ? new Date(row.contract_end_date) : new Date(),
    paymentDay: row.payment_day ?? 1, createdAt: new Date(row.created_at),
    monthlyRent: row.monthly_rent ? Number(row.monthly_rent) : undefined,
    utilities: row.utilities ? Number(row.utilities) : undefined,
  };
}

export function useActiveHome() {
  const { user } = useAuth();
  const [home, setHome] = useState<ActiveHome | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setHome(null); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('active_homes').select('*').eq('student_id', user.id).maybeSingle();
    if (error) console.error('ActiveHome fetch error:', error.message);
    setHome(data ? dbToActiveHome(data) : null);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useDataBusRefresh('activeHome', refresh);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`realtime:active-home:${user.id}:${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_homes', filter: `student_id=eq.${user.id}` },
        () => { void refresh(); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, refresh]);

  return { home, loading, refresh };
}

// ============================================================
// ADMIN: REPORTS
// ============================================================
export interface ReportRow {
  id: string;
  reporterId?: string;
  targetType: string;
  targetId: string;
  targetName?: string;
  reason: string;
  description: string;
  status: 'pending' | 'under_review' | 'reviewed' | 'resolved' | 'dismissed';
  severity?: string;
  internalNote?: string;
  resolution?: string;
  resolvedBy?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export function useReports() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (error) console.error('Reports fetch error:', error.message);
    const list: ReportRow[] = (data ?? []).map(r => ({
      id: r.id,
      reporterId: r.reporter_id ?? undefined,
      targetType: r.target_type,
      targetId: r.target_id,
      targetName: r.target_name ?? undefined,
      reason: r.reason,
      description: r.description ?? '',
      status: r.status,
      severity: r.severity ?? undefined,
      internalNote: r.internal_note ?? undefined,
      resolution: r.resolution ?? undefined,
      resolvedBy: r.resolved_by ?? undefined,
      createdAt: new Date(r.created_at),
      resolvedAt: r.resolved_at ? new Date(r.resolved_at) : undefined,
    }));
    setReports(list);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useDataBusRefresh('reports', refresh);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:reports:list:${Math.random().toString(36).slice(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        void refresh();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refresh]);

  const updateStatus = async (
    id: string,
    status: ReportRow['status'],
    resolution?: string,
  ): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    const patch: Record<string, unknown> = { status };
    if (status === 'resolved' || status === 'dismissed') {
      patch.resolved_at = new Date().toISOString();
      patch.resolved_by = session?.user?.id ?? null;
      if (resolution) patch.resolution = resolution;
    }
    const { error } = await supabase.from('reports').update(patch).eq('id', id);
    if (error) { console.error('Report status error:', error.message); return false; }
    await refresh();
    return true;
  };

  const addInternalNote = async (id: string, note: string): Promise<boolean> => {
    const { error } = await supabase
      .from('reports')
      .update({ internal_note: note })
      .eq('id', id);
    if (error) { console.error('Report note error:', error.message); return false; }
    await refresh();
    return true;
  };

  const openCount = reports.filter(
    r => r.status === 'pending' || r.status === 'under_review',
  ).length;

  const criticalCount = reports.filter(
    r => r.severity === 'critical' && r.status !== 'resolved' && r.status !== 'dismissed',
  ).length;

  return { reports, loading, refresh, updateStatus, addInternalNote, openCount, criticalCount };
}

// ============================================================
// ADMIN: AUDIT LOG
// ============================================================
export interface AuditLogRow {
  id: string;
  actorId?: string;
  actorName?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  severity: 'low' | 'medium' | 'high';
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export function useAuditLog() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) console.error('Audit fetch error:', error.message);
    setLogs((data ?? []).map(r => ({
      id: r.id, actorId: r.actor_id ?? undefined, actorName: r.actor_name ?? undefined,
      action: r.action, targetType: r.target_type ?? undefined,
      targetId: r.target_id ?? undefined, targetName: r.target_name ?? undefined,
      severity: r.severity ?? 'low', metadata: r.metadata ?? {},
      createdAt: new Date(r.created_at),
    })));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const log = async (entry: Omit<AuditLogRow, 'id' | 'createdAt'>) => {
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: entry.actorId ?? null, actor_name: entry.actorName ?? null,
      action: entry.action, target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null, target_name: entry.targetName ?? null,
      severity: entry.severity, metadata: entry.metadata ?? {},
    });
    if (error) console.error('Audit insert error:', error.message);
    else await refresh();
  };

  return { logs, loading, refresh, log };
}

// ============================================================
// ADMIN: USERS
// ============================================================
export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  type: 'student' | 'landlord' | 'admin';
  status: 'active' | 'suspended' | 'blocked';
  verified: boolean;
  onboardingCompleted: boolean;
  createdAt: Date;
  lastActive?: Date;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) console.error('Admin users fetch error:', error.message);
    setUsers((data ?? []).map(r => ({
      id: r.id, email: r.email, fullName: r.full_name ?? '',
      type: r.type, status: r.status, verified: !!r.verified,
      onboardingCompleted: !!r.onboarding_completed,
      createdAt: new Date(r.created_at),
      lastActive: r.last_active ? new Date(r.last_active) : undefined,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useDataBusRefresh('adminUsers', refresh);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:admin-users:profiles:${Math.random().toString(36).slice(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        void refresh();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refresh]);

  const setStatus = async (id: string, status: AdminUserRow['status']) => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (error) { console.error('User status error:', error.message); return; }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
  };

  const setVerified = async (id: string, verified: boolean) => {
    const { error } = await supabase.from('profiles').update({ verified }).eq('id', id);
    if (error) { console.error('User verified error:', error.message); return; }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, verified } : u));
  };

  return { users, loading, refresh, setStatus, setVerified };
}

// ============================================================
// ANALYTICS
// ============================================================
export function useListingAnalytics(propertyId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('listing_analytics').select('*').order('snapshot_at', { ascending: false });
    if (propertyId) q = q.eq('property_id', propertyId);
    const { data: rows, error } = await q;
    if (error) console.error('Analytics fetch error:', error.message);
    setData(rows ?? []);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, refresh };
}

// ============================================================
// LANDLORD APPLICATIONS (enriched with profiles)
// ============================================================
export interface LandlordApplicationRow {
  id: string;
  propertyId: string;
  roomId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  course?: string;
  university?: string;
  year?: number;
  status: ApplicationStatus;
  message: string;
  appliedAt: Date;
  visitDate?: string;
  visitFormat?: 'presencial' | 'videochamada';
  visitNote?: string;
}

export function useLandlordApplications(landlordId?: string) {
  const [applications, setApplications] = useState<LandlordApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!landlordId) { setApplications([]); setLoading(false); return; }
    setLoading(true);

    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('*')
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('Landlord applications fetch error:', appsError.message);
      setApplications([]);
      setLoading(false);
      return;
    }

    if (!apps || apps.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const studentIds = [...new Set(apps.map(a => a.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, course, university, year')
      .in('id', studentIds);

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError.message);
    }

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

    const enriched: LandlordApplicationRow[] = apps.map(app => {
      const profile = profileMap.get(app.user_id);
      return {
        id: app.id,
        propertyId: app.property_id ?? '',
        roomId: app.room_id ?? '',
        studentId: app.user_id,
        studentName: profile?.full_name ?? 'Estudante',
        studentEmail: profile?.email,
        course: profile?.course ?? undefined,
        university: profile?.university ?? undefined,
        year: profile?.year ?? undefined,
        status: app.status,
        message: app.message ?? '',
        appliedAt: new Date(app.created_at),
        visitDate: app.visit_date ?? undefined,
        visitFormat: app.visit_format ?? undefined,
        visitNote: app.visit_note ?? undefined,
      };
    });

    setApplications(enriched);
    setLoading(false);
  }, [landlordId]);

  useEffect(() => { refresh(); }, [refresh]);
  useDataBusRefresh('applications', refresh);

  useEffect(() => {
    if (!landlordId) return;
    // Esta lista é enriquecida com profiles (join); um upsert local não
    // teria os campos do estudante. Disparamos refresh apenas quando a row
    // pertence a este senhorio.
    const channel = supabase
      .channel(`realtime:landlord-applications:${landlordId}:${Math.random().toString(36).slice(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, payload => {
        const row = (payload.new ?? payload.old) as { landlord_id?: string };
        if (row?.landlord_id !== landlordId) return;
        void refresh();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [landlordId, refresh]);

  const accept = async (applicationId: string) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: 'accepted', reviewed_at: new Date().toISOString() })
      .eq('id', applicationId);

    if (error) {
      console.error('Accept application error:', error.message);
      return false;
    }

    const app = applications.find(a => a.id === applicationId);
    if (app) {
      await supabase.from('notifications').insert({
        user_id: app.studentId,
        type: 'application_accepted',
        title: 'Candidatura aceite',
        message: 'O senhorio aceitou a tua candidatura. Confirma a estadia para garantir o quarto.',
        link: '/applications',
        read: false,
      });
    }

    await refresh();
    return true;
  };

  const reject = async (applicationId: string) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', applicationId);

    if (error) {
      console.error('Reject application error:', error.message);
      return false;
    }

    const app = applications.find(a => a.id === applicationId);
    if (app) {
      await supabase.from('notifications').insert({
        user_id: app.studentId,
        type: 'application_rejected',
        title: 'Candidatura recusada',
        message: 'O senhorio recusou a tua candidatura.',
        link: '/applications',
        read: false,
      });
    }

    await refresh();
    return true;
  };

  const scheduleVisit = async (applicationId: string, visitDate: string, visitFormat: 'presencial' | 'videochamada', visitNote?: string) => {
    const { error } = await supabase
      .from('applications')
      .update({
        visit_date: visitDate,
        visit_format: visitFormat,
        visit_note: visitNote ?? null,
        status: 'under_review',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Schedule visit error:', error.message);
      return false;
    }

    const app = applications.find(a => a.id === applicationId);
    if (app) {
      await supabase.from('notifications').insert({
        user_id: app.studentId,
        type: 'visit_scheduled',
        title: 'Visita agendada',
        message: `O senhorio agendou uma ${visitFormat === 'videochamada' ? 'videochamada' : 'visita presencial'} para ${new Date(visitDate).toLocaleDateString('pt-PT')}.`,
        link: '/applications',
        read: false,
      });
    }

    await refresh();
    return true;
  };

  const getByProperty = useCallback((propertyId: string) => {
    return applications.filter(app => app.propertyId === propertyId);
  }, [applications]);

  const getByRoom = useCallback((propertyId: string, roomId: string) => {
    return applications.filter(app => app.propertyId === propertyId && app.roomId === roomId);
  }, [applications]);

  const getPendingCount = useCallback(() => {
    return applications.filter(app => app.status === 'pending' || app.status === 'under_review').length;
  }, [applications]);

  return {
    applications,
    loading,
    refresh,
    accept,
    reject,
    scheduleVisit,
    getByProperty,
    getByRoom,
    getPendingCount,
  };
}

// ============================================================
// STUDENT PROFILE
// ============================================================

// Module-level cache: avoids duplicate Supabase fetches when multiple
// components (e.g. a list of RoomCards) call this hook with the same userId.
const studentProfileCache = new Map<string, StudentProfile | null>();

export function useStudentProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<StudentProfile | null>(
    () => (userId ? studentProfileCache.get(userId) ?? null : null),
  );
  const [loading, setLoading] = useState(() => Boolean(userId && !studentProfileCache.has(userId)));

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (studentProfileCache.has(userId)) {
      setProfile(studentProfileCache.get(userId) ?? null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchStudentProfileFromDb(userId)
      .then(result => {
        studentProfileCache.set(userId, result);
        setProfile(result);
        setLoading(false);
      })
      .catch(() => {
        setProfile(null);
        setLoading(false);
      });
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    studentProfileCache.delete(userId);
    setLoading(true);
    try {
      const result = await fetchStudentProfileFromDb(userId);
      studentProfileCache.set(userId, result);
      setProfile(result);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`realtime:student-profile:${userId}:${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personal_profiles', filter: `user_id=eq.${userId}` },
        () => { void refresh(); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, refresh]);

  return { profile, loading, refresh };
}

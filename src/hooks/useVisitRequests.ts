import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { isSupabaseUuid } from '../lib/identity';
import type { VisitRequest, VisitRequestStatus } from '../types/accommodation';

// ── DB mapper ─────────────────────────────────────────────────────────────────
function dbToVisitRequest(row: Record<string, unknown>): VisitRequest {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    landlordId: row.landlord_id as string,
    propertyId: (row.property_id as string | null) ?? undefined,
    roomId: (row.room_id as string | null) ?? undefined,
    requestedAt: new Date(row.requested_at as string),
    proposedAt: row.proposed_at ? new Date(row.proposed_at as string) : undefined,
    status: row.status as VisitRequestStatus,
    studentMessage: (row.student_message as string | null) ?? undefined,
    landlordMessage: (row.landlord_message as string | null) ?? undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useVisitRequests() {
  const { user } = useAuth();
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || user.type === 'admin') {
      setVisitRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const field = user.type === 'student' ? 'student_id' : 'landlord_id';
    const { data, error } = await supabase
      .from('room_visit_requests')
      .select('*')
      .eq(field, user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('[VisitRequests]', error.message);
    setVisitRequests((data ?? []).map(dbToVisitRequest));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Single realtime channel with cleanup
  useEffect(() => {
    if (!user || user.type === 'admin') return;
    const channel = supabase
      .channel(`visit_requests:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_visit_requests' },
        payload => {
          if (payload.eventType === 'DELETE') {
            const id = String((payload.old as { id?: string }).id ?? '');
            if (id) setVisitRequests(prev => prev.filter(r => r.id !== id));
            return;
          }
          const row = payload.new as Record<string, unknown>;
          const isRelevant = row.student_id === user.id || row.landlord_id === user.id;
          if (!isRelevant) return;
          const incoming = dbToVisitRequest(row);
          setVisitRequests(prev => {
            const idx = prev.findIndex(r => r.id === incoming.id);
            return idx === -1
              ? [incoming, ...prev]
              : prev.map(r => r.id === incoming.id ? incoming : r);
          });
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);

  // ── Student creates a visit request ────────────────────────────────────────
  const createVisitRequest = async (input: {
    landlordId: string;
    propertyId?: string;
    roomId?: string;
    requestedAt: Date;
    studentMessage?: string;
  }): Promise<string | null> => {
    if (!user) return null;
    if (!isSupabaseUuid(input.landlordId)) {
      console.error('[createVisitRequest] landlordId is not a valid UUID:', input.landlordId);
      return null;
    }
    if (!isSupabaseUuid(user.id)) {
      console.error('[createVisitRequest] student user.id is not a valid UUID:', user.id);
      return null;
    }
    const rand = Math.random().toString(36).slice(2, 8);
    const id = `visit-${Date.now()}-${rand}`;
    const { error } = await supabase.from('room_visit_requests').insert({
      id,
      student_id: user.id,
      landlord_id: input.landlordId,
      property_id: input.propertyId ?? null,
      room_id: input.roomId ?? null,
      requested_at: input.requestedAt.toISOString(),
      status: 'pending',
      student_message: input.studentMessage ?? null,
    });
    if (error) { console.error('[createVisitRequest]', error.message); return null; }
    await refresh();
    return id;
  };

  // ── Student cancels their request (pending or counter_proposed) ────────────
  const cancelVisitRequest = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('room_visit_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (error) { console.error('[cancelVisitRequest]', error.message); return false; }
    await refresh();
    return true;
  };

  // ── Accept: landlord accepts pending → "accepted"
  //            student accepts counter_proposed → "accepted" + requested_at = proposed_at ──
  const acceptVisitRequest = async (
    id: string,
    landlordMessage?: string,
    proposedAt?: Date
  ): Promise<boolean> => {
    const patch: Record<string, unknown> = { status: 'accepted' };
    if (landlordMessage) patch.landlord_message = landlordMessage;
    // When student accepts a counter-proposal, promote proposed_at → requested_at
    if (proposedAt) patch.requested_at = proposedAt.toISOString();
    const { error } = await supabase
      .from('room_visit_requests')
      .update(patch)
      .eq('id', id);
    if (error) { console.error('[acceptVisitRequest]', error.message); return false; }
    await refresh();
    return true;
  };

  // ── Landlord rejects the request ───────────────────────────────────────────
  const rejectVisitRequest = async (id: string, landlordMessage?: string): Promise<boolean> => {
    const patch: Record<string, unknown> = { status: 'rejected' };
    if (landlordMessage) patch.landlord_message = landlordMessage;
    const { error } = await supabase
      .from('room_visit_requests')
      .update(patch)
      .eq('id', id);
    if (error) { console.error('[rejectVisitRequest]', error.message); return false; }
    await refresh();
    return true;
  };

  // ── Landlord proposes an alternative date ──────────────────────────────────
  const counterProposeVisitRequest = async (
    id: string,
    proposedAt: Date,
    landlordMessage?: string
  ): Promise<boolean> => {
    const patch: Record<string, unknown> = {
      status: 'counter_proposed',
      proposed_at: proposedAt.toISOString(),
    };
    if (landlordMessage) patch.landlord_message = landlordMessage;
    const { error } = await supabase
      .from('room_visit_requests')
      .update(patch)
      .eq('id', id);
    if (error) { console.error('[counterProposeVisitRequest]', error.message); return false; }
    await refresh();
    return true;
  };

  // ── Landlord marks visit as completed ─────────────────────────────────────
  const markVisitCompleted = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('room_visit_requests')
      .update({ status: 'completed' })
      .eq('id', id);
    if (error) { console.error('[markVisitCompleted]', error.message); return false; }
    await refresh();
    return true;
  };

  return {
    visitRequests,
    loading,
    refresh,
    createVisitRequest,
    cancelVisitRequest,
    acceptVisitRequest,
    rejectVisitRequest,
    counterProposeVisitRequest,
    markVisitCompleted,
  };
}

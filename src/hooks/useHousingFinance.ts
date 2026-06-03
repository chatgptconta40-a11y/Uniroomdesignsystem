import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ContractStatus, RentPaymentStatus } from '../utils/housingFinanceLabels';
import { useDataBusRefresh } from '../lib/dataBus';

export type { ContractStatus, RentPaymentStatus };

export interface PaymentMethod {
  id: string;
  landlordId: string;
  propertyId?: string;
  roomId?: string;
  methodType: string;
  label: string;
  holderName?: string;
  iban?: string;
  mbwayPhone?: string;
  entity?: string;
  reference?: string;
  paypalEmail?: string;
  instructions?: string;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RentalContract {
  id: string;
  activeHomeId?: string;
  propertyId: string;
  roomId: string;
  landlordId: string;
  studentId: string;
  title?: string;
  contractNumber?: string;
  status: ContractStatus;
  fileUrl?: string;
  fileName?: string;
  startDate?: string;
  endDate?: string;
  monthlyRent: number;
  depositAmount?: number;
  utilitiesAmount?: number;
  uploadedBy?: string;
  signedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentPayment {
  id: string;
  activeHomeId?: string;
  studentId: string;
  landlordId: string;
  propertyId: string;
  roomId: string;
  paymentMethodId?: string;
  periodMonth: string;
  dueDate?: string;
  rentAmount: number;
  utilitiesAmount?: number;
  totalAmount: number;
  status: RentPaymentStatus;
  paidAt?: string;
  proofUrl?: string;
  proofFileName?: string;
  notes?: string;
  landlordNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractUpdateInput {
  title?: string;
  status?: ContractStatus;
  startDate?: string;
  endDate?: string;
  monthlyRent?: number;
  depositAmount?: number;
  utilitiesAmount?: number;
  notes?: string;
}

function dbToPaymentMethod(row: any): PaymentMethod {
  const pm: PaymentMethod = {
    id: row.id,
    landlordId: row.landlord_id,
    propertyId: row.property_id ?? undefined,
    roomId: row.room_id ?? undefined,
    methodType: row.method_type,
    label: row.label,
    holderName: row.holder_name ?? undefined,
    iban: row.iban ?? undefined,
    mbwayPhone: row.mbway_phone ?? undefined,
    entity: row.entity ?? undefined,
    reference: row.reference ?? undefined,
    instructions: row.instructions ?? undefined,
    isDefault: row.is_default,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.method_type === 'paypal' && row.instructions) {
    pm.paypalEmail = row.instructions;
  }
  return pm;
}

function dbToContract(row: any): RentalContract {
  return {
    id: row.id,
    activeHomeId: row.active_home_id ?? undefined,
    propertyId: row.property_id,
    roomId: row.room_id,
    landlordId: row.landlord_id,
    studentId: row.student_id,
    title: row.title ?? undefined,
    contractNumber: row.contract_number ?? undefined,
    status: row.status as ContractStatus,
    fileUrl: row.file_url ?? undefined,
    fileName: row.file_name ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    monthlyRent: Number(row.monthly_rent),
    depositAmount: row.deposit_amount != null ? Number(row.deposit_amount) : undefined,
    utilitiesAmount: row.utilities_amount != null ? Number(row.utilities_amount) : undefined,
    uploadedBy: row.uploaded_by ?? undefined,
    signedAt: row.signed_at ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbToPayment(row: any): RentPayment {
  return {
    id: row.id,
    activeHomeId: row.active_home_id ?? undefined,
    studentId: row.student_id,
    landlordId: row.landlord_id,
    propertyId: row.property_id,
    roomId: row.room_id,
    paymentMethodId: row.payment_method_id ?? undefined,
    periodMonth: row.period_month,
    dueDate: row.due_date ?? undefined,
    rentAmount: Number(row.rent_amount),
    utilitiesAmount: row.utilities_amount != null ? Number(row.utilities_amount) : undefined,
    totalAmount: Number(row.total_amount),
    status: row.status as RentPaymentStatus,
    paidAt: row.paid_at ?? undefined,
    proofUrl: row.proof_url ?? undefined,
    proofFileName: row.proof_file_name ?? undefined,
    notes: row.notes ?? undefined,
    landlordNote: row.landlord_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function usePaymentMethod(landlordId: string) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!landlordId) { setMethods([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('landlord_id', landlordId)
      .eq('active', true)
      .order('is_default', { ascending: false });
    setLoading(false);
    if (!error && data) setMethods(data.map(dbToPaymentMethod));
  }, [landlordId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const method = methods.find(m => m.isDefault) ?? methods[0] ?? null;

  const upsert = useCallback(async (input: Partial<PaymentMethod>) => {
    if (!landlordId) return null;
    const now = new Date().toISOString();
    const existing = methods.find(m => m.isDefault) ?? methods[0];

    const row: Record<string, any> = {
      landlord_id: landlordId,
      method_type: input.methodType ?? existing?.methodType ?? 'mbway',
      label: input.label ?? existing?.label ?? 'Método principal',
      holder_name: input.holderName || null,
      iban: input.methodType === 'iban' ? (input.iban || null) : null,
      mbway_phone: input.methodType === 'mbway' ? (input.mbwayPhone || null) : null,
      entity: input.entity || null,
      reference: input.reference || null,
      instructions: input.methodType === 'paypal'
        ? (input.paypalEmail || input.instructions || null)
        : (input.instructions || null),
      is_default: true,
      active: true,
      updated_at: now,
    };

    if (existing) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false, updated_at: now })
        .eq('landlord_id', landlordId)
        .neq('id', existing.id);

      const { data, error } = await supabase
        .from('payment_methods')
        .update(row)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) { console.error('[FINANCE] update payment_method', error); return null; }
      await refresh();
      return data ? dbToPaymentMethod(data) : null;
    } else {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({ ...row, created_at: now })
        .select()
        .single();
      if (error) { console.error('[FINANCE] insert payment_method', error); return null; }
      await refresh();
      return data ? dbToPaymentMethod(data) : null;
    }
  }, [landlordId, methods, refresh]);

  return { method, methods, upsert, loading, refresh };
}

export function useRentalContracts(params: { landlordId?: string; activeHomeId?: string }) {
  const { landlordId, activeHomeId } = params;
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!landlordId && !activeHomeId) { setContracts([]); return; }
    setLoading(true);
    let query = supabase.from('rental_contracts').select('*');
    if (activeHomeId) {
      query = query.eq('active_home_id', activeHomeId);
    } else if (landlordId) {
      query = query.eq('landlord_id', landlordId).order('updated_at', { ascending: false });
    }
    const { data, error } = await query;
    setLoading(false);
    if (!error && data) setContracts(data.map(dbToContract));
    else if (error) console.error('[FINANCE] fetch rental_contracts', error);
  }, [landlordId, activeHomeId]);

  useEffect(() => { void refresh(); }, [refresh]);
  useDataBusRefresh('payments', refresh);

  const contract = contracts[0] ?? null;

  const update = useCallback(async (contractId: string, input: ContractUpdateInput) => {
    const now = new Date().toISOString();
    const row: Record<string, any> = { updated_at: now };
    if (input.title !== undefined) row.title = input.title;
    if (input.status !== undefined) row.status = input.status;
    if (input.startDate !== undefined) row.start_date = input.startDate || null;
    if (input.endDate !== undefined) row.end_date = input.endDate || null;
    if (input.monthlyRent !== undefined) row.monthly_rent = input.monthlyRent;
    if (input.depositAmount !== undefined) row.deposit_amount = input.depositAmount;
    if (input.utilitiesAmount !== undefined) row.utilities_amount = input.utilitiesAmount;
    if (input.notes !== undefined) row.notes = input.notes || null;

    const { data, error } = await supabase
      .from('rental_contracts')
      .update(row)
      .eq('id', contractId)
      .select()
      .single();
    if (error) { console.error('[FINANCE] update rental_contract', error); return null; }
    await refresh();
    return data ? dbToContract(data) : null;
  }, [refresh]);

  return { contracts, contract, update, refresh, loading };
}

export function useRentPayments(params: { landlordId?: string; activeHomeId?: string }) {
  const { landlordId, activeHomeId } = params;
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!landlordId && !activeHomeId) { setPayments([]); return; }
    setLoading(true);
    let query = supabase
      .from('rent_payments')
      .select('*')
      .order('period_month', { ascending: false });
    if (activeHomeId) {
      query = query.eq('active_home_id', activeHomeId);
    } else if (landlordId) {
      query = query.eq('landlord_id', landlordId);
    }
    const { data, error } = await query;
    setLoading(false);
    if (!error && data) setPayments(data.map(dbToPayment));
    else if (error) console.error('[FINANCE] fetch rent_payments', error);
  }, [landlordId, activeHomeId]);

  useEffect(() => { void refresh(); }, [refresh]);
  useDataBusRefresh('payments', refresh);

  const uploadProof = useCallback(async (paymentId: string, proofUrl: string, proofFileName: string) => {
    const { data, error } = await supabase
      .from('rent_payments')
      .update({ proof_url: proofUrl, proof_file_name: proofFileName, updated_at: new Date().toISOString() })
      .eq('id', paymentId)
      .select()
      .single();
    if (error) { console.error('[FINANCE] upload proof', error); return null; }
    await refresh();
    return data ? dbToPayment(data) : null;
  }, [refresh]);

  const validatePayment = useCallback(async (paymentId: string, note = 'Pagamento confirmado pelo senhorio.') => {
    const { data, error } = await supabase
      .from('rent_payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        landlord_note: note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();
    if (error) { console.error('[FINANCE] validate payment', error); return null; }
    await refresh();
    return data ? dbToPayment(data) : null;
  }, [refresh]);

  return { payments, uploadProof, validatePayment, refresh, loading };
}

export function useLandlordFinanceSummary(landlordId: string) {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [activeContractsCount, setActiveContractsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!landlordId) return;
    setLoading(true);
    const [pmRes, rcRes] = await Promise.all([
      supabase.from('rent_payments').select('*').eq('landlord_id', landlordId),
      supabase.from('rental_contracts').select('id, status').eq('landlord_id', landlordId),
    ]);
    setLoading(false);
    if (!pmRes.error && pmRes.data) setPayments(pmRes.data.map(dbToPayment));
    if (!rcRes.error && rcRes.data) {
      setActiveContractsCount(rcRes.data.filter(r => r.status === 'active').length);
    }
  }, [landlordId]);

  useEffect(() => { void refresh(); }, [refresh]);
  useDataBusRefresh('payments', refresh);

  const validatePayment = useCallback(async (paymentId: string) => {
    const { data, error } = await supabase
      .from('rent_payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        landlord_note: 'Pagamento confirmado pelo senhorio.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();
    if (error) { console.error('[FINANCE] validate payment (summary)', error); return null; }
    await refresh();
    return data ? dbToPayment(data) : null;
  }, [refresh]);

  const now = new Date();
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const latePayments = payments.filter(p => p.status === 'late');
  const proofPayments = payments.filter(p => p.proofUrl && p.status !== 'paid');
  const expectedThisMonth = payments
    .filter(p => {
      const period = new Date(p.periodMonth);
      return period.getMonth() === now.getMonth() && period.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.totalAmount, 0);

  return {
    pendingPayments,
    latePayments,
    proofPayments,
    activeContracts: activeContractsCount,
    expectedThisMonth,
    validatePayment,
    loading,
    refresh,
  };
}

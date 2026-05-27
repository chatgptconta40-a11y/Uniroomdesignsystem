import { ActiveHome } from '../types/accommodation';
import { supabase } from '../lib/supabase';

const PAYMENT_METHODS_KEY = 'uniroom_payment_methods';
const RENTAL_CONTRACTS_KEY = 'uniroom_rental_contracts';
const RENT_PAYMENTS_KEY = 'uniroom_rent_payments';

export type PaymentMethodType = 'iban' | 'mbway' | 'multibanco_reference' | 'cash' | 'other';

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'active' | 'expired' | 'cancelled';

export type RentPaymentStatus = 'pending' | 'paid' | 'late' | 'waived' | 'cancelled';

export interface PaymentMethod {
  id: string;
  landlordId: string;
  propertyId?: string;
  roomId?: string;
  methodType: PaymentMethodType;
  label: string;
  holderName?: string;
  iban?: string;
  mbwayPhone?: string;
  entity?: string;
  reference?: string;
  instructions?: string;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RentalContract {
  id: string;
  activeHomeId: string;
  applicationId?: string;
  propertyId: string;
  roomId: string;
  landlordId: string;
  studentId: string;
  title: string;
  contractNumber: string;
  status: ContractStatus;
  fileUrl?: string;
  fileName?: string;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  depositAmount: number;
  utilitiesAmount: number;
  uploadedBy?: string;
  signedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentPayment {
  id: string;
  activeHomeId: string;
  studentId: string;
  landlordId: string;
  propertyId: string;
  roomId: string;
  paymentMethodId?: string;
  periodMonth: string;
  dueDate: string;
  rentAmount: number;
  utilitiesAmount: number;
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

let paymentMethodsCache: PaymentMethod[] = readLocal<PaymentMethod>(PAYMENT_METHODS_KEY);
let rentalContractsCache: RentalContract[] = readLocal<RentalContract>(RENTAL_CONTRACTS_KEY);
let rentPaymentsCache: RentPayment[] = readLocal<RentPayment>(RENT_PAYMENTS_KEY);

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function readLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

function syncLocalStorage() {
  writeLocal(PAYMENT_METHODS_KEY, paymentMethodsCache);
  writeLocal(RENTAL_CONTRACTS_KEY, rentalContractsCache);
  writeLocal(RENT_PAYMENTS_KEY, rentPaymentsCache);
}

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function iso(date: Date) {
  return date.toISOString();
}

function monthKey(date: Date) {
  const copy = new Date(date);
  copy.setDate(1);
  return copy.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function buildDueDate(period: Date, paymentDay: number) {
  const due = new Date(period);
  due.setDate(Math.min(Math.max(paymentDay || 1, 1), 28));
  return due;
}

function rowToPaymentMethod(row: any): PaymentMethod {
  return {
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
    isDefault: !!row.is_default,
    active: !!row.active,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

function rowToRentalContract(row: any): RentalContract {
  return {
    id: row.id,
    activeHomeId: row.active_home_id ?? '',
    applicationId: row.application_id ?? undefined,
    propertyId: row.property_id,
    roomId: row.room_id ?? '',
    landlordId: row.landlord_id,
    studentId: row.student_id,
    title: row.title ?? 'Contrato de arrendamento',
    contractNumber: row.contract_number ?? '—',
    status: row.status,
    fileUrl: row.file_url ?? undefined,
    fileName: row.file_name ?? undefined,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    monthlyRent: Number(row.monthly_rent ?? 0),
    depositAmount: Number(row.deposit_amount ?? 0),
    utilitiesAmount: Number(row.utilities_amount ?? 0),
    uploadedBy: row.uploaded_by ?? undefined,
    signedAt: row.signed_at ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

function rowToRentPayment(row: any): RentPayment {
  return {
    id: row.id,
    activeHomeId: row.active_home_id,
    studentId: row.student_id,
    landlordId: row.landlord_id,
    propertyId: row.property_id,
    roomId: row.room_id ?? '',
    paymentMethodId: row.payment_method_id ?? undefined,
    periodMonth: row.period_month,
    dueDate: row.due_date,
    rentAmount: Number(row.rent_amount ?? 0),
    utilitiesAmount: Number(row.utilities_amount ?? 0),
    totalAmount: Number(row.total_amount ?? (Number(row.rent_amount ?? 0) + Number(row.utilities_amount ?? 0))),
    status: row.status,
    paidAt: row.paid_at ?? undefined,
    proofUrl: row.proof_url ?? undefined,
    proofFileName: row.proof_file_name ?? undefined,
    notes: row.notes ?? undefined,
    landlordNote: row.landlord_note ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

function paymentMethodToRow(method: PaymentMethod) {
  return {
    id: method.id,
    landlord_id: method.landlordId,
    property_id: method.propertyId ?? null,
    room_id: method.roomId ?? null,
    method_type: method.methodType,
    label: method.label,
    holder_name: method.holderName ?? null,
    iban: method.iban ?? null,
    mbway_phone: method.mbwayPhone ?? null,
    entity: method.entity ?? null,
    reference: method.reference ?? null,
    instructions: method.instructions ?? null,
    is_default: method.isDefault,
    active: method.active,
  };
}

function rentalContractToRow(contract: RentalContract) {
  return {
    id: contract.id,
    active_home_id: contract.activeHomeId,
    application_id: contract.applicationId ?? null,
    property_id: contract.propertyId,
    room_id: contract.roomId || null,
    landlord_id: contract.landlordId,
    student_id: contract.studentId,
    title: contract.title,
    contract_number: contract.contractNumber,
    status: contract.status,
    file_url: contract.fileUrl ?? null,
    file_name: contract.fileName ?? null,
    start_date: contract.startDate,
    end_date: contract.endDate ?? null,
    monthly_rent: contract.monthlyRent,
    deposit_amount: contract.depositAmount,
    utilities_amount: contract.utilitiesAmount,
    uploaded_by: contract.uploadedBy ?? null,
    signed_at: contract.signedAt ?? null,
    notes: contract.notes ?? null,
  };
}

function rentPaymentToRow(payment: RentPayment) {
  return {
    id: payment.id,
    active_home_id: payment.activeHomeId,
    student_id: payment.studentId,
    landlord_id: payment.landlordId,
    property_id: payment.propertyId,
    room_id: payment.roomId || null,
    payment_method_id: payment.paymentMethodId ?? null,
    period_month: payment.periodMonth,
    due_date: payment.dueDate,
    rent_amount: payment.rentAmount,
    utilities_amount: payment.utilitiesAmount,
    status: payment.status,
    paid_at: payment.paidAt ?? null,
    proof_url: payment.proofUrl ?? null,
    proof_file_name: payment.proofFileName ?? null,
    notes: payment.notes ?? null,
    landlord_note: payment.landlordNote ?? null,
  };
}

function mergeById<T extends { id: string }>(local: T[], remote: T[]) {
  const map = new Map<string, T>();
  local.forEach(item => map.set(item.id, item));
  remote.forEach(item => map.set(item.id, item));
  return Array.from(map.values());
}

export async function refreshHousingFinanceState(): Promise<void> {
  hydratePromise = null;
  hydrated = false;
  await hydrateHousingFinance();
}

export async function hydrateHousingFinance(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    const [methodsRes, contractsRes, paymentsRes] = await Promise.all([
      supabase.from('payment_methods').select('*'),
      supabase.from('rental_contracts').select('*'),
      supabase.from('rent_payments').select('*'),
    ]);

    if (methodsRes.error) {
      console.warn('Housing finance hydrate payment_methods:', methodsRes.error.message);
    } else {
      paymentMethodsCache = mergeById(paymentMethodsCache, (methodsRes.data ?? []).map(rowToPaymentMethod));
    }

    if (contractsRes.error) {
      console.warn('Housing finance hydrate rental_contracts:', contractsRes.error.message);
    } else {
      rentalContractsCache = mergeById(rentalContractsCache, (contractsRes.data ?? []).map(rowToRentalContract));
    }

    if (paymentsRes.error) {
      console.warn('Housing finance hydrate rent_payments:', paymentsRes.error.message);
    } else {
      rentPaymentsCache = mergeById(rentPaymentsCache, (paymentsRes.data ?? []).map(rowToRentPayment));
    }

    syncLocalStorage();
    hydrated = true;
  })();

  return hydratePromise;
}

void hydrateHousingFinance();

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function getPaymentStatusLabel(status: RentPaymentStatus) {
  const labels: Record<RentPaymentStatus, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    late: 'Em atraso',
    waived: 'Dispensado',
    cancelled: 'Cancelado',
  };

  return labels[status];
}

export function getContractStatusLabel(status: ContractStatus) {
  const labels: Record<ContractStatus, string> = {
    draft: 'Rascunho',
    sent: 'Enviado',
    signed: 'Assinado',
    active: 'Ativo',
    expired: 'Expirado',
    cancelled: 'Cancelado',
  };

  return labels[status];
}

export function getPaymentMethodLabel(method?: PaymentMethod | null) {
  if (!method) return 'Método não configurado';

  if (method.methodType === 'iban') return 'Transferência bancária';
  if (method.methodType === 'mbway') return 'MB WAY';
  if (method.methodType === 'multibanco_reference') return 'Referência Multibanco';
  if (method.methodType === 'cash') return 'Dinheiro';
  return 'Outro método';
}

export function getPaymentMethodMainValue(method?: PaymentMethod | null) {
  if (!method) return '';

  if (method.methodType === 'iban') return method.iban || '';
  if (method.methodType === 'mbway') return method.mbwayPhone || '';
  if (method.methodType === 'multibanco_reference') {
    return `Entidade ${method.entity || '—'} · Ref. ${method.reference || '—'}`;
  }

  return method.instructions || '';
}

export function ensureDefaultPaymentMethod(landlordId: string): PaymentMethod {
  const existing = paymentMethodsCache.find(method => method.landlordId === landlordId && method.isDefault && method.active);

  if (existing) return existing;

  const now = iso(new Date());

  const method: PaymentMethod = {
    id: uid('pm'),
    landlordId,
    methodType: 'mbway',
    label: 'MB WAY principal',
    holderName: 'Senhorio UniRoom',
    mbwayPhone: '912 345 678',
    instructions: 'Envia o pagamento por MB WAY e carrega o comprovativo na plataforma.',
    isDefault: true,
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  paymentMethodsCache = [...paymentMethodsCache, method];
  syncLocalStorage();

  void supabase.from('payment_methods').insert(paymentMethodToRow(method)).then(({ error }) => {
    if (error) console.warn('Payment method insert error:', error.message);
  });

  return method;
}

export function getPaymentMethodsForLandlord(landlordId: string): PaymentMethod[] {
  const own = paymentMethodsCache.filter(method => method.landlordId === landlordId);

  if (own.length > 0) return own;

  return [ensureDefaultPaymentMethod(landlordId)];
}

export function upsertDefaultPaymentMethod(
  landlordId: string,
  input: Partial<PaymentMethod>,
): PaymentMethod {
  const now = iso(new Date());

  const existing = paymentMethodsCache.find(method => method.landlordId === landlordId && method.isDefault);

  const next: PaymentMethod = {
    id: existing?.id || uid('pm'),
    landlordId,
    methodType: input.methodType || existing?.methodType || 'mbway',
    label: input.label || existing?.label || 'Método principal',
    holderName: input.holderName || existing?.holderName || 'Senhorio UniRoom',
    iban: input.iban ?? existing?.iban,
    mbwayPhone: input.mbwayPhone ?? existing?.mbwayPhone,
    entity: input.entity ?? existing?.entity,
    reference: input.reference ?? existing?.reference,
    instructions: input.instructions ?? existing?.instructions,
    isDefault: true,
    active: true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  paymentMethodsCache = [
    ...paymentMethodsCache.filter(method => method.id !== next.id),
    next,
  ];
  syncLocalStorage();

  void supabase
    .from('payment_methods')
    .upsert(paymentMethodToRow(next), { onConflict: 'id' })
    .then(({ error }) => {
      if (error) console.warn('Payment method upsert error:', error.message);
    });

  return next;
}

export function getPaymentMethodForHome(activeHome: ActiveHome): PaymentMethod {
  const methods = getPaymentMethodsForLandlord(activeHome.landlordId);

  const byRoom = methods.find(method => method.active && method.roomId === activeHome.roomId);
  if (byRoom) return byRoom;

  const byProperty = methods.find(method => method.active && method.propertyId === activeHome.propertyId);
  if (byProperty) return byProperty;

  return methods.find(method => method.active && method.isDefault) || ensureDefaultPaymentMethod(activeHome.landlordId);
}

function createFallbackContract(
  activeHome: ActiveHome,
  monthlyRent: number,
  utilities: number,
): RentalContract {
  const now = iso(new Date());

  return {
    id: uid('contract'),
    activeHomeId: activeHome.id,
    applicationId: activeHome.applicationId,
    propertyId: activeHome.propertyId,
    roomId: activeHome.roomId,
    landlordId: activeHome.landlordId,
    studentId: activeHome.studentId,
    title: 'Contrato de arrendamento',
    contractNumber: `UNI-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    status: 'active',
    fileUrl: '#contrato-demo',
    fileName: 'contrato-arrendamento-uniroom.pdf',
    startDate: new Date(activeHome.moveInDate).toISOString().slice(0, 10),
    endDate: activeHome.contractEndDate
      ? new Date(activeHome.contractEndDate).toISOString().slice(0, 10)
      : undefined,
    monthlyRent,
    depositAmount: monthlyRent,
    utilitiesAmount: utilities,
    uploadedBy: activeHome.landlordId,
    signedAt: now,
    notes: 'Contrato demonstrativo criado para simular a experiência do estudante.',
    createdAt: now,
    updatedAt: now,
  };
}

export function getOrCreateRentalContract(
  activeHome: ActiveHome,
  monthlyRent: number,
  utilities: number,
): RentalContract {
  const existing = rentalContractsCache.find(contract => contract.activeHomeId === activeHome.id);

  if (existing) return existing;

  const contract = createFallbackContract(activeHome, monthlyRent, utilities);
  rentalContractsCache = [...rentalContractsCache, contract];
  syncLocalStorage();

  void supabase
    .rpc('ensure_rental_contract_for_home', { p_active_home_id: activeHome.id })
    .then(async ({ data, error }) => {
      if (error) {
        // Fallback local: student may not be allowed to create contracts directly.
        // The RPC below is added by the SQL patch and creates the contract safely.
        console.warn('Contract RPC error:', error.message);
        return;
      }

      if (!data) return;

      const { data: row, error: readError } = await supabase
        .from('rental_contracts')
        .select('*')
        .eq('id', data)
        .single();

      if (readError || !row) return;

      const remote = rowToRentalContract(row);
      rentalContractsCache = [
        ...rentalContractsCache.filter(item => item.id !== contract.id && item.id !== remote.id),
        remote,
      ];
      syncLocalStorage();
    });

  return contract;
}

function createFallbackRentPayments(
  activeHome: ActiveHome,
  monthlyRent: number,
  utilities: number,
): RentPayment[] {
  const paymentMethod = getPaymentMethodForHome(activeHome);
  const moveIn = new Date(activeHome.moveInDate);
  const now = new Date();

  return [0, 1, 2].map(offset => {
    const period = addMonths(moveIn, offset);
    const dueDate = buildDueDate(period, activeHome.paymentDay);
    const isFirst = offset === 0;
    const isLate = !isFirst && dueDate.getTime() < now.getTime();

    const createdAt = iso(new Date());

    return {
      id: uid('rent'),
      activeHomeId: activeHome.id,
      studentId: activeHome.studentId,
      landlordId: activeHome.landlordId,
      propertyId: activeHome.propertyId,
      roomId: activeHome.roomId,
      paymentMethodId: paymentMethod.id,
      periodMonth: monthKey(period),
      dueDate: iso(dueDate),
      rentAmount: monthlyRent,
      utilitiesAmount: utilities,
      totalAmount: monthlyRent + utilities,
      status: isFirst ? 'paid' : isLate ? 'late' : 'pending',
      paidAt: isFirst ? iso(dueDate) : undefined,
      proofUrl: isFirst ? '#comprovativo-demo' : undefined,
      proofFileName: isFirst ? 'comprovativo-renda-demo.pdf' : undefined,
      notes: isFirst ? 'Pagamento demonstrativo validado.' : undefined,
      createdAt,
      updatedAt: createdAt,
    } satisfies RentPayment;
  });
}

export function getRentPaymentsForHome(
  activeHome: ActiveHome,
  monthlyRent: number,
  utilities: number,
): RentPayment[] {
  const existing = rentPaymentsCache.filter(payment => payment.activeHomeId === activeHome.id);

  if (existing.length > 0) {
    return existing.sort((a, b) => new Date(b.periodMonth).getTime() - new Date(a.periodMonth).getTime());
  }

  const generated = createFallbackRentPayments(activeHome, monthlyRent, utilities);
  rentPaymentsCache = [...rentPaymentsCache, ...generated];
  syncLocalStorage();

  return generated.sort((a, b) => new Date(b.periodMonth).getTime() - new Date(a.periodMonth).getTime());
}

export async function ensureFinanceForHome(
  activeHome: ActiveHome,
  monthlyRent: number,
  utilities: number,
): Promise<void> {
  await hydrateHousingFinance();

  const monthsToGenerate = 3;

  const rpcPayments = await supabase.rpc('generate_rent_payments_for_home', {
    p_active_home_id: activeHome.id,
    p_months: monthsToGenerate,
  });

  if (rpcPayments.error) {
    // Backwards compatibility if the batch RPC was not created yet.
    const moveIn = new Date(activeHome.moveInDate);

    await Promise.all(
      [0, 1, 2].map(offset => {
        const period = addMonths(moveIn, offset);
        return supabase.rpc('generate_rent_payment_for_home', {
          p_active_home_id: activeHome.id,
          p_period_month: monthKey(period),
        });
      }),
    );
  }

  await supabase.rpc('ensure_rental_contract_for_home', {
    p_active_home_id: activeHome.id,
  });

  const [contractsRes, paymentsRes] = await Promise.all([
    supabase.from('rental_contracts').select('*').eq('active_home_id', activeHome.id),
    supabase.from('rent_payments').select('*').eq('active_home_id', activeHome.id),
  ]);

  if (!contractsRes.error) {
    const remoteContracts = (contractsRes.data ?? []).map(rowToRentalContract);
    rentalContractsCache = mergeById(
      rentalContractsCache.filter(contract => contract.activeHomeId !== activeHome.id),
      remoteContracts,
    );
  }

  if (!paymentsRes.error) {
    const remotePayments = (paymentsRes.data ?? []).map(rowToRentPayment);
    rentPaymentsCache = mergeById(
      rentPaymentsCache.filter(payment => payment.activeHomeId !== activeHome.id),
      remotePayments,
    );
  }

  syncLocalStorage();
}

export function uploadPaymentProof(paymentId: string, fileName = 'comprovativo-pagamento.pdf'): RentPayment | null {
  const current = rentPaymentsCache.find(payment => payment.id === paymentId);

  if (!current) return null;

  const updated: RentPayment = {
    ...current,
    proofUrl: '#comprovativo-carregado',
    proofFileName: fileName,
    landlordNote: 'Comprovativo enviado pelo estudante. Aguarda validação do senhorio.',
    updatedAt: iso(new Date()),
  };

  rentPaymentsCache = rentPaymentsCache.map(payment => payment.id === paymentId ? updated : payment);
  syncLocalStorage();

  void supabase
    .from('rent_payments')
    .update({
      proof_url: updated.proofUrl,
      proof_file_name: updated.proofFileName,
      landlord_note: updated.landlordNote,
    })
    .eq('id', paymentId)
    .then(({ error }) => {
      if (error) console.warn('Payment proof update error:', error.message);
    });

  return updated;
}

export function markRentPaymentAsPaid(paymentId: string): RentPayment | null {
  const current = rentPaymentsCache.find(payment => payment.id === paymentId);

  if (!current) return null;

  const updated: RentPayment = {
    ...current,
    status: 'paid',
    paidAt: iso(new Date()),
    landlordNote: 'Pagamento confirmado pelo senhorio.',
    updatedAt: iso(new Date()),
  };

  rentPaymentsCache = rentPaymentsCache.map(payment => payment.id === paymentId ? updated : payment);
  syncLocalStorage();

  void supabase
    .from('rent_payments')
    .update({
      status: 'paid',
      paid_at: updated.paidAt,
      landlord_note: updated.landlordNote,
    })
    .eq('id', paymentId)
    .then(({ error }) => {
      if (error) console.warn('Payment paid update error:', error.message);
    });

  return updated;
}

export function getLandlordFinanceSummary(landlordId: string) {
  const methods = getPaymentMethodsForLandlord(landlordId);
  const contracts = rentalContractsCache.filter(contract => contract.landlordId === landlordId);
  const payments = rentPaymentsCache.filter(payment => payment.landlordId === landlordId);

  const pendingPayments = payments.filter(payment => payment.status === 'pending');
  const latePayments = payments.filter(payment => payment.status === 'late');
  const proofPayments = payments.filter(payment => payment.proofUrl && payment.status !== 'paid');

  const expectedThisMonth = payments
    .filter(payment => {
      const period = new Date(payment.periodMonth);
      const now = new Date();
      return period.getMonth() === now.getMonth() && period.getFullYear() === now.getFullYear();
    })
    .reduce((total, payment) => total + payment.totalAmount, 0);

  return {
    methods,
    contracts,
    payments,
    pendingPayments,
    latePayments,
    proofPayments,
    expectedThisMonth,
    activeContracts: contracts.filter(contract => contract.status === 'active').length,
  };
}
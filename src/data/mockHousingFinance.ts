import { ActiveHome } from '../types/accommodation';

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

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function readLocal<T>(key: string): T[] {
  const value = safeParse<T[]>(localStorage.getItem(key), []);
  return Array.isArray(value) ? value : [];
}

function writeLocal<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

let paymentMethodsCache: PaymentMethod[] = readLocal<PaymentMethod>(PAYMENT_METHODS_KEY);
let rentalContractsCache: RentalContract[] = readLocal<RentalContract>(RENTAL_CONTRACTS_KEY);
let rentPaymentsCache: RentPayment[] = readLocal<RentPayment>(RENT_PAYMENTS_KEY);

function syncLocalStorage(): void {
  writeLocal(PAYMENT_METHODS_KEY, paymentMethodsCache);
  writeLocal(RENTAL_CONTRACTS_KEY, rentalContractsCache);
  writeLocal(RENT_PAYMENTS_KEY, rentPaymentsCache);
}

function reloadLocalStorage(): void {
  paymentMethodsCache = readLocal<PaymentMethod>(PAYMENT_METHODS_KEY);
  rentalContractsCache = readLocal<RentalContract>(RENTAL_CONTRACTS_KEY);
  rentPaymentsCache = readLocal<RentPayment>(RENT_PAYMENTS_KEY);
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function iso(date: Date): string {
  return date.toISOString();
}

function monthKey(date: Date): string {
  const copy = new Date(date);
  copy.setDate(1);
  return copy.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function buildDueDate(period: Date, paymentDay: number): Date {
  const due = new Date(period);
  due.setDate(Math.min(Math.max(paymentDay || 1, 1), 28));
  return due;
}

function normalizePaymentStatus(payment: RentPayment): RentPayment {
  if (payment.status === 'pending' && new Date(payment.dueDate).getTime() < Date.now()) {
    return {
      ...payment,
      status: 'late',
      updatedAt: iso(new Date()),
    };
  }

  return payment;
}

export async function refreshHousingFinanceState(): Promise<void> {
  reloadLocalStorage();

  rentPaymentsCache = rentPaymentsCache.map(normalizePaymentStatus);
  syncLocalStorage();
}

export async function hydrateHousingFinance(): Promise<void> {
  await refreshHousingFinanceState();
}

void hydrateHousingFinance();

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function getPaymentStatusLabel(status: RentPaymentStatus): string {
  const labels: Record<RentPaymentStatus, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    late: 'Em atraso',
    waived: 'Dispensado',
    cancelled: 'Cancelado',
  };

  return labels[status];
}

export function getContractStatusLabel(status: ContractStatus): string {
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

export function getPaymentMethodLabel(method?: PaymentMethod | null): string {
  if (!method) return 'Método não configurado';
  if (method.methodType === 'iban') return 'Transferência bancária';
  if (method.methodType === 'mbway') return 'MB WAY';
  if (method.methodType === 'multibanco_reference') return 'Referência Multibanco';
  if (method.methodType === 'cash') return 'Dinheiro';
  return 'Outro método';
}

export function getPaymentMethodMainValue(method?: PaymentMethod | null): string {
  if (!method) return '';
  if (method.methodType === 'iban') return method.iban || '';
  if (method.methodType === 'mbway') return method.mbwayPhone || '';
  if (method.methodType === 'multibanco_reference') {
    return `Entidade ${method.entity || '—'} · Ref. ${method.reference || '—'}`;
  }
  return method.instructions || '';
}

export function ensureDefaultPaymentMethod(landlordId: string): PaymentMethod {
  reloadLocalStorage();

  const existing = paymentMethodsCache.find(
    method => method.landlordId === landlordId && method.isDefault && method.active,
  );

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

  return method;
}

export function getPaymentMethodsForLandlord(landlordId: string): PaymentMethod[] {
  reloadLocalStorage();

  const own = paymentMethodsCache.filter(method => method.landlordId === landlordId);

  if (own.length > 0) return own;

  return [ensureDefaultPaymentMethod(landlordId)];
}

export function upsertDefaultPaymentMethod(
  landlordId: string,
  input: Partial<PaymentMethod>,
): PaymentMethod {
  reloadLocalStorage();

  const now = iso(new Date());
  const existing = paymentMethodsCache.find(method => method.landlordId === landlordId && method.isDefault);

  const next: PaymentMethod = {
    id: existing?.id || uid('pm'),
    landlordId,
    propertyId: input.propertyId ?? existing?.propertyId,
    roomId: input.roomId ?? existing?.roomId,
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

function createContract(
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
    fileUrl: '#contrato-local',
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
    notes: 'Contrato gerado localmente pela UniRoom.',
    createdAt: now,
    updatedAt: now,
  };
}

export function getOrCreateRentalContract(
  activeHome: ActiveHome,
  monthlyRent: number,
  utilities: number,
): RentalContract {
  reloadLocalStorage();

  const existing = rentalContractsCache.find(contract => contract.activeHomeId === activeHome.id);
  if (existing) return existing;

  const contract = createContract(activeHome, monthlyRent, utilities);
  rentalContractsCache = [...rentalContractsCache, contract];
  syncLocalStorage();

  return contract;
}

function createRentPayments(
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
      proofUrl: isFirst ? '#comprovativo-local' : undefined,
      proofFileName: isFirst ? 'comprovativo-renda-local.pdf' : undefined,
      notes: isFirst ? 'Pagamento inicial confirmado.' : undefined,
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
  reloadLocalStorage();

  const existing = rentPaymentsCache.filter(payment => payment.activeHomeId === activeHome.id);

  if (existing.length > 0) {
    const normalized = existing.map(normalizePaymentStatus);
    rentPaymentsCache = [
      ...rentPaymentsCache.filter(payment => payment.activeHomeId !== activeHome.id),
      ...normalized,
    ];
    syncLocalStorage();

    return normalized.sort((a, b) => new Date(b.periodMonth).getTime() - new Date(a.periodMonth).getTime());
  }

  const generated = createRentPayments(activeHome, monthlyRent, utilities);
  rentPaymentsCache = [...rentPaymentsCache, ...generated];
  syncLocalStorage();

  return generated.sort((a, b) => new Date(b.periodMonth).getTime() - new Date(a.periodMonth).getTime());
}

export async function ensureFinanceForHome(
  activeHome: ActiveHome,
  monthlyRent: number,
  utilities: number,
): Promise<void> {
  getOrCreateRentalContract(activeHome, monthlyRent, utilities);
  getRentPaymentsForHome(activeHome, monthlyRent, utilities);
}

export function uploadPaymentProof(paymentId: string, fileName = 'comprovativo-pagamento.pdf'): RentPayment | null {
  reloadLocalStorage();

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

  return updated;
}

export function markRentPaymentAsPaid(paymentId: string): RentPayment | null {
  reloadLocalStorage();

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

  return updated;
}

export function getLandlordFinanceSummary(landlordId: string) {
  reloadLocalStorage();

  const methods = getPaymentMethodsForLandlord(landlordId);
  const contracts = rentalContractsCache.filter(contract => contract.landlordId === landlordId);
  const payments = rentPaymentsCache
    .filter(payment => payment.landlordId === landlordId)
    .map(normalizePaymentStatus);

  const pendingPayments = payments.filter(payment => payment.status === 'pending');
  const latePayments = payments.filter(payment => payment.status === 'late');
  const proofPayments = payments.filter(payment => payment.proofUrl && payment.status !== 'paid');

  const now = new Date();

  const expectedThisMonth = payments
    .filter(payment => {
      const period = new Date(payment.periodMonth);
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

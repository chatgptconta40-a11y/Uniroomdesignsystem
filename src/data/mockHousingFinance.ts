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

export interface RentalContractUpdateInput {
  title?: string;
  status?: ContractStatus;
  startDate?: string;
  endDate?: string;
  monthlyRent?: number;
  depositAmount?: number;
  utilitiesAmount?: number;
  notes?: string;
  fileUrl?: string;
  fileName?: string;
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
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

export function ensureDefaultPaymentMethod(landlordId: string, landlordName = 'Senhorio UniRoom'): PaymentMethod {
  const methods = read<PaymentMethod>(PAYMENT_METHODS_KEY);
  const existing = methods.find(method => method.landlordId === landlordId && method.isDefault && method.active);
  if (existing) return existing;

  const now = iso(new Date());
  const method: PaymentMethod = {
    id: uid('pm'),
    landlordId,
    methodType: 'mbway',
    label: 'MB WAY principal',
    holderName: landlordName,
    mbwayPhone: '912 345 678',
    instructions: 'Envia o pagamento por MB WAY e carrega o comprovativo na plataforma.',
    isDefault: true,
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  write(PAYMENT_METHODS_KEY, [...methods, method]);
  return method;
}

export function getPaymentMethodsForLandlord(landlordId: string, landlordName = 'Senhorio UniRoom'): PaymentMethod[] {
  const methods = read<PaymentMethod>(PAYMENT_METHODS_KEY);
  const own = methods.filter(method => method.landlordId === landlordId);
  if (own.length > 0) return own;
  return [ensureDefaultPaymentMethod(landlordId, landlordName)];
}

export function upsertDefaultPaymentMethod(
  landlordId: string,
  input: Partial<PaymentMethod>,
): PaymentMethod {
  const methods = read<PaymentMethod>(PAYMENT_METHODS_KEY);
  const now = iso(new Date());
  const existing = methods.find(method => method.landlordId === landlordId && method.isDefault);

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

  const others = methods.filter(method => method.id !== next.id);
  write(PAYMENT_METHODS_KEY, [...others, next]);
  return next;
}

export function getPaymentMethodForHome(activeHome: ActiveHome): PaymentMethod {
  const methods = getPaymentMethodsForLandlord(activeHome.landlordId, activeHome.landlordName);
  const byRoom = methods.find(method => method.active && method.roomId === activeHome.roomId);
  if (byRoom) return byRoom;

  const byProperty = methods.find(method => method.active && method.propertyId === activeHome.propertyId);
  if (byProperty) return byProperty;

  return methods.find(method => method.active && method.isDefault) || ensureDefaultPaymentMethod(activeHome.landlordId, activeHome.landlordName);
}

export function getOrCreateRentalContract(
  activeHome: ActiveHome,
  monthlyRent: number,
  utilities: number,
): RentalContract {
  const contracts = read<RentalContract>(RENTAL_CONTRACTS_KEY);
  const existing = contracts.find(contract => contract.activeHomeId === activeHome.id);
  if (existing) return existing;

  const now = iso(new Date());
  const contract: RentalContract = {
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
    endDate: activeHome.contractEndDate ? new Date(activeHome.contractEndDate).toISOString().slice(0, 10) : undefined,
    monthlyRent,
    depositAmount: monthlyRent,
    utilitiesAmount: utilities,
    uploadedBy: activeHome.landlordId,
    signedAt: now,
    notes: 'Contrato demonstrativo criado para simular a experiência do estudante.',
    createdAt: now,
    updatedAt: now,
  };

  write(RENTAL_CONTRACTS_KEY, [...contracts, contract]);
  return contract;
}

export function getRentalContractsForLandlord(landlordId: string): RentalContract[] {
  const contracts = read<RentalContract>(RENTAL_CONTRACTS_KEY);

  return contracts
    .filter(contract => contract.landlordId === landlordId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getRentalContractsForStudent(studentId: string): RentalContract[] {
  const contracts = read<RentalContract>(RENTAL_CONTRACTS_KEY);

  return contracts
    .filter(contract => contract.studentId === studentId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getRentalContractById(contractId: string): RentalContract | null {
  const contracts = read<RentalContract>(RENTAL_CONTRACTS_KEY);

  return contracts.find(contract => contract.id === contractId) || null;
}

export function updateRentalContract(
  contractId: string,
  updates: RentalContractUpdateInput,
): RentalContract | null {
  const contracts = read<RentalContract>(RENTAL_CONTRACTS_KEY);
  const current = contracts.find(contract => contract.id === contractId);

  if (!current) return null;

  const updated: RentalContract = {
    ...current,
    ...updates,
    monthlyRent: updates.monthlyRent ?? current.monthlyRent,
    depositAmount: updates.depositAmount ?? current.depositAmount,
    utilitiesAmount: updates.utilitiesAmount ?? current.utilitiesAmount,
    updatedAt: iso(new Date()),
  };

  write(
    RENTAL_CONTRACTS_KEY,
    contracts.map(contract => contract.id === contractId ? updated : contract),
  );

  return updated;
}

export function upsertRentalContractForActiveHome(
  activeHome: ActiveHome,
  monthlyRent: number,
  utilities: number,
  updates: RentalContractUpdateInput = {},
): RentalContract {
  const existing = getOrCreateRentalContract(activeHome, monthlyRent, utilities);

  return updateRentalContract(existing.id, updates) || existing;
}

export function getContractStatusTone(status: ContractStatus): 'success' | 'warning' | 'outline' | 'default' {
  if (status === 'active' || status === 'signed') return 'success';
  if (status === 'draft' || status === 'sent') return 'warning';
  if (status === 'expired' || status === 'cancelled') return 'outline';
  return 'default';
}

export function getRentPaymentsForHome(
  activeHome: ActiveHome,
  monthlyRent: number,
  utilities: number,
): RentPayment[] {
  const payments = read<RentPayment>(RENT_PAYMENTS_KEY);
  const existing = payments.filter(payment => payment.activeHomeId === activeHome.id);

  if (existing.length > 0) {
    const normalized = existing.map(normalizePaymentStatus);
    const others = payments.filter(payment => payment.activeHomeId !== activeHome.id);
    write(RENT_PAYMENTS_KEY, [...others, ...normalized]);

    return normalized.sort((a, b) => new Date(b.periodMonth).getTime() - new Date(a.periodMonth).getTime());
  }

  const paymentMethod = getPaymentMethodForHome(activeHome);
  const moveIn = new Date(activeHome.moveInDate);
  const now = new Date();

  const generated: RentPayment[] = [0, 1, 2].map(offset => {
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
    };
  });

  write(RENT_PAYMENTS_KEY, [...payments, ...generated]);
  return generated.sort((a, b) => new Date(b.periodMonth).getTime() - new Date(a.periodMonth).getTime());
}

export function uploadPaymentProof(paymentId: string, fileName = 'comprovativo-pagamento.pdf'): RentPayment | null {
  const payments = read<RentPayment>(RENT_PAYMENTS_KEY);
  const current = payments.find(payment => payment.id === paymentId);
  if (!current) return null;

  const updated: RentPayment = {
    ...current,
    proofUrl: '#comprovativo-carregado',
    proofFileName: fileName,
    landlordNote: 'Comprovativo enviado pelo estudante. Aguarda validação do senhorio.',
    updatedAt: iso(new Date()),
  };

  write(RENT_PAYMENTS_KEY, payments.map(payment => payment.id === paymentId ? updated : payment));
  return updated;
}

export function markRentPaymentAsPaid(paymentId: string): RentPayment | null {
  const payments = read<RentPayment>(RENT_PAYMENTS_KEY);
  const current = payments.find(payment => payment.id === paymentId);
  if (!current) return null;

  const updated: RentPayment = {
    ...current,
    status: 'paid',
    paidAt: iso(new Date()),
    landlordNote: 'Pagamento confirmado pelo senhorio.',
    updatedAt: iso(new Date()),
  };

  write(RENT_PAYMENTS_KEY, payments.map(payment => payment.id === paymentId ? updated : payment));
  return updated;
}

export function getLandlordFinanceSummary(landlordId: string, landlordName = 'Senhorio UniRoom') {
  const methods = getPaymentMethodsForLandlord(landlordId, landlordName);
  const contracts = read<RentalContract>(RENTAL_CONTRACTS_KEY).filter(contract => contract.landlordId === landlordId);
  const payments = read<RentPayment>(RENT_PAYMENTS_KEY)
    .filter(payment => payment.landlordId === landlordId)
    .map(normalizePaymentStatus);

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

export async function refreshHousingFinanceState(): Promise<void> {
  const payments = read<RentPayment>(RENT_PAYMENTS_KEY);
  const updated = payments.map(normalizePaymentStatus);
  write(RENT_PAYMENTS_KEY, updated);
}

export async function ensureFinanceForHome(
  activeHome: ActiveHome,
  monthlyRent: number,
  utilities: number,
): Promise<void> {
  getOrCreateRentalContract(activeHome, monthlyRent, utilities);
  getRentPaymentsForHome(activeHome, monthlyRent, utilities);
}

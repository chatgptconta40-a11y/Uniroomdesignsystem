export type PaymentMethodType = 'iban' | 'mbway' | 'multibanco' | 'paypal' | 'other';
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'active' | 'expired' | 'cancelled';
export type RentPaymentStatus = 'pending' | 'paid' | 'late' | 'waived' | 'cancelled';

export interface PaymentMethodLabels {
  methodType: string;
  label?: string;
  holderName?: string;
  iban?: string;
  mbwayPhone?: string;
  entity?: string;
  reference?: string;
  paypalEmail?: string;
  instructions?: string;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function getPaymentStatusLabel(status: RentPaymentStatus | string) {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    late: 'Em atraso',
    waived: 'Dispensado',
    cancelled: 'Cancelado',
  };
  return labels[status] ?? status;
}

export function getContractStatusLabel(status: ContractStatus | string) {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    sent: 'Enviado',
    signed: 'Assinado',
    active: 'Ativo',
    expired: 'Expirado',
    cancelled: 'Cancelado',
  };
  return labels[status] ?? status;
}

export function getPaymentMethodLabel(method?: PaymentMethodLabels | null) {
  if (!method) return 'Método não configurado';
  if (method.methodType === 'iban') return 'Transferência bancária';
  if (method.methodType === 'mbway') return 'MB WAY';
  if (method.methodType === 'multibanco') return 'Referência Multibanco';
  if (method.methodType === 'paypal') return 'PayPal';
  return 'Outro método';
}

export function getPaymentMethodMainValue(method?: PaymentMethodLabels | null) {
  if (!method) return '';
  if (method.methodType === 'iban') return method.iban || '';
  if (method.methodType === 'mbway') return method.mbwayPhone || '';
  if (method.methodType === 'multibanco') {
    return `Entidade ${method.entity || '—'} · Ref. ${method.reference || '—'}`;
  }
  if (method.methodType === 'paypal') return method.paypalEmail || method.instructions || '';
  return method.instructions || '';
}

export function getContractStatusTone(status: ContractStatus | string): 'success' | 'warning' | 'outline' | 'default' {
  if (status === 'active' || status === 'signed') return 'success';
  if (status === 'draft' || status === 'sent') return 'warning';
  if (status === 'expired' || status === 'cancelled') return 'outline';
  return 'default';
}

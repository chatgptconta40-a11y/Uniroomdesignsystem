import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Wallet, FileText, Calendar, User as UserIcon, Home as HomeIcon, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import {
  getLandlordFinanceSummary,
  markRentPaymentAsPaid,
  getPaymentStatusLabel,
  formatCurrency,
  type RentPayment,
} from '../data/mockHousingFinance';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { toast } from 'sonner';

type TabId = 'pending' | 'proofs' | 'paid' | 'late' | 'all';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'proofs', label: 'Comprovativos por validar' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'late', label: 'Atrasos' },
  { id: 'paid', label: 'Pagos' },
  { id: 'all', label: 'Todos' },
];

function statusVariant(status: RentPayment['status']): 'default' | 'success' | 'warning' | 'outline' {
  if (status === 'paid') return 'success';
  if (status === 'late') return 'warning';
  if (status === 'pending') return 'default';
  return 'outline';
}

function formatDate(value?: string | Date) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function resolveStudentName(studentId: string): string {
  try {
    const users = JSON.parse(localStorage.getItem('uniroom_all_users') || '[]');
    const profiles = JSON.parse(localStorage.getItem('uniroom_student_profiles') || '[]');
    const student = users.find((u: any) => String(u?.id) === String(studentId));
    const profile = profiles.find((p: any) => String(p?.personal?.userId) === String(studentId));
    return profile?.personal?.fullName || student?.name || student?.email || 'Estudante';
  } catch {
    return 'Estudante';
  }
}

interface PaymentRowProps {
  payment: RentPayment;
  propertyTitle: string;
  roomTitle: string;
  onValidate: (id: string) => void;
}

function PaymentRow({ payment, propertyTitle, roomTitle, onValidate }: PaymentRowProps) {
  const studentName = resolveStudentName(payment.studentId);
  const hasProof = Boolean(payment.proofUrl || payment.proofFileName);
  const canValidate = hasProof && payment.status !== 'paid';

  return (
    <div className="p-5 border border-border rounded-xl hover:border-primary/40 transition-colors">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-base font-semibold text-foreground">
              {formatCurrency(payment.totalAmount)}
            </span>
            <Badge variant={statusVariant(payment.status)}>
              {getPaymentStatusLabel(payment.status)}
            </Badge>
            {hasProof && payment.status !== 'paid' && (
              <Badge variant="warning">Comprovativo recebido</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="w-3.5 h-3.5" />
              <span className="truncate">{studentName}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <HomeIcon className="w-3.5 h-3.5" />
              <span className="truncate">{propertyTitle} · {roomTitle}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>Vencimento: {formatDate(payment.dueDate)}</span>
            </div>
            {payment.paidAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pago em {formatDate(payment.paidAt)}</span>
              </div>
            )}
            {hasProof && (
              <div className="flex items-center gap-2 text-muted-foreground md:col-span-2">
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate">{payment.proofFileName || 'Comprovativo submetido'}</span>
              </div>
            )}
          </div>
        </div>

        {canValidate && (
          <div className="flex-shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onValidate(payment.id)}
            >
              Validar comprovativo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function LandlordPayments() {
  const { user } = useAuth();
  const { getProperty, getRoom } = useProperties();
  const [tab, setTab] = useState<TabId>('proofs');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const summary = useMemo(() => {
    if (!user) return null;
    return getLandlordFinanceSummary(user.id, user.name);
  }, [user?.id, refreshKey]);

  const properties = useMemo(() => {
    if (!summary) return [] as Array<{ id: string; title: string }>;
    const ids = Array.from(new Set(summary.payments.map(p => p.propertyId)));
    return ids
      .map(id => ({ id, title: getProperty(id)?.title || 'Alojamento' }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [summary]);

  const students = useMemo(() => {
    if (!summary) return [] as Array<{ id: string; name: string }>;
    const ids = Array.from(new Set(summary.payments.map(p => p.studentId)));
    return ids
      .map(id => ({ id, name: resolveStudentName(id) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [summary]);

  const filtered = useMemo(() => {
    if (!summary) return [];
    let list: RentPayment[];
    if (tab === 'proofs') list = summary.proofPayments;
    else if (tab === 'pending') list = summary.pendingPayments;
    else if (tab === 'late') list = summary.latePayments;
    else if (tab === 'paid') list = summary.payments.filter(p => p.status === 'paid');
    else list = summary.payments;

    return list
      .filter(p => propertyFilter === 'all' || p.propertyId === propertyFilter)
      .filter(p => studentFilter === 'all' || p.studentId === studentFilter)
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [summary, tab, propertyFilter, studentFilter]);

  if (!user || !summary) return null;

  const counts = {
    proofs: summary.proofPayments.length,
    pending: summary.pendingPayments.length,
    late: summary.latePayments.length,
    paid: summary.payments.filter(p => p.status === 'paid').length,
    all: summary.payments.length,
  };

  const totalReceived = summary.payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const handleValidate = (paymentId: string) => {
    const updated = markRentPaymentAsPaid(paymentId);
    if (!updated) {
      toast.error('Não foi possível validar o comprovativo.');
      return;
    }
    toast.success('Pagamento marcado como pago.');
    setRefreshKey(key => key + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <Link
          to="/landlord/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Pagamentos</h1>
          <p className="text-muted-foreground">
            A UniRoom não processa pagamentos. Aqui acompanhas comprovativos e validas rendas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Previsto este mês</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.expectedThisMonth)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Recebido (histórico)</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalReceived)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Por validar</p>
            <p className="text-2xl font-bold text-foreground">{counts.proofs}</p>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {TABS.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {item.label}
              <span className="ml-2 text-xs opacity-80">({counts[item.id]})</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={propertyFilter}
            onChange={e => setPropertyFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="all">Todos os alojamentos</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <select
            value={studentFilter}
            onChange={e => setStudentFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="all">Todos os estudantes</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <Card className="p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Sem pagamentos nesta vista.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(payment => {
                const property = getProperty(payment.propertyId);
                const room = getRoom(payment.roomId);
                return (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    propertyTitle={property?.title || 'Alojamento'}
                    roomTitle={room?.title || 'Quarto'}
                    onValidate={handleValidate}
                  />
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

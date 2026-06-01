import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, FileSignature, Calendar, User as UserIcon, Home as HomeIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertiesContext';
import {
  getRentalContractsForLandlord,
  getContractStatusLabel,
  formatCurrency,
  type RentalContract,
  type ContractStatus,
} from '../data/mockHousingFinance';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { LandlordContractManager } from '../components/LandlordContractManager';

const TABS: Array<{ id: 'active' | 'pending' | 'ended' | 'all'; label: string }> = [
  { id: 'active', label: 'Ativos' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'ended', label: 'Terminados' },
  { id: 'all', label: 'Todos' },
];

function statusBucket(status: ContractStatus): 'active' | 'pending' | 'ended' {
  if (status === 'active' || status === 'signed') return 'active';
  if (status === 'draft' || status === 'sent') return 'pending';
  return 'ended';
}

function statusVariant(status: ContractStatus): 'default' | 'success' | 'warning' | 'outline' {
  if (status === 'active' || status === 'signed') return 'success';
  if (status === 'draft' || status === 'sent') return 'warning';
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

interface ContractRowProps {
  contract: RentalContract;
  propertyTitle: string;
  roomTitle: string;
}

function ContractRow({ contract, propertyTitle, roomTitle }: ContractRowProps) {
  const studentName = resolveStudentName(contract.studentId);

  return (
    <div className="p-5 border border-border rounded-xl hover:border-primary/40 transition-colors">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <FileSignature className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {contract.contractNumber || contract.title || 'Contrato'}
            </span>
            <Badge variant={statusVariant(contract.status)}>
              {getContractStatusLabel(contract.status)}
            </Badge>
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
              <span>
                {formatDate(contract.startDate)} → {contract.endDate ? formatDate(contract.endDate) : 'sem termo'}
              </span>
            </div>
            <div className="text-muted-foreground">
              Renda mensal: <span className="font-semibold text-foreground">{formatCurrency(contract.monthlyRent)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandlordContracts() {
  const { user } = useAuth();
  const { getProperty, getRoom } = useProperties();
  const [tab, setTab] = useState<'active' | 'pending' | 'ended' | 'all'>('active');

  const contracts = useMemo(() => {
    if (!user) return [];
    return getRentalContractsForLandlord(user.id);
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (tab === 'all') return contracts;
    return contracts.filter(contract => statusBucket(contract.status) === tab);
  }, [contracts, tab]);

  const counts = useMemo(() => ({
    active: contracts.filter(c => statusBucket(c.status) === 'active').length,
    pending: contracts.filter(c => statusBucket(c.status) === 'pending').length,
    ended: contracts.filter(c => statusBucket(c.status) === 'ended').length,
    all: contracts.length,
  }), [contracts]);

  if (!user) return null;

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Contratos</h1>
          <p className="text-muted-foreground">Contratos associados aos teus alojamentos.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
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

        <Card className="p-6 mb-8">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileSignature className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Sem contratos nesta vista.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(contract => {
                const property = getProperty(contract.propertyId);
                const room = getRoom(contract.roomId);
                return (
                  <ContractRow
                    key={contract.id}
                    contract={contract}
                    propertyTitle={property?.title || 'Alojamento'}
                    roomTitle={room?.title || 'Quarto'}
                  />
                );
              })}
            </div>
          )}
        </Card>

        <div className="mb-2">
          <h2 className="text-xl font-bold text-foreground mb-4">Gestão detalhada</h2>
          <LandlordContractManager landlordId={user.id} />
        </div>
      </div>
    </div>
  );
}

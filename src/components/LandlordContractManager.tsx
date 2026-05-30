import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Edit3,
  FileText,
  Home,
  RefreshCw,
  Save,
  User,
  X,
} from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import {
  ContractStatus,
  RentalContract,
  formatCurrency,
  getContractStatusLabel,
  getOrCreateRentalContract,
  getRentalContractsForLandlord,
  updateRentalContract,
} from '../data/mockHousingFinance';

interface LandlordContractManagerProps {
  landlordId: string;
  onUpdated?: () => void;
}

type ContractFormState = {
  title: string;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  depositAmount: string;
  utilitiesAmount: string;
  notes: string;
};

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'sent', label: 'Enviado' },
  { value: 'signed', label: 'Assinado' },
  { value: 'active', label: 'Ativo' },
  { value: 'expired', label: 'Expirado' },
  { value: 'cancelled', label: 'Cancelado' },
];

function getContractStatusTone(status: ContractStatus): 'success' | 'warning' | 'outline' | 'default' {
  if (status === 'active' || status === 'signed') return 'success';
  if (status === 'draft' || status === 'sent') return 'warning';
  if (status === 'expired' || status === 'cancelled') return 'outline';
  return 'default';
}

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function toDateInput(value?: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'E';
}

function getContractContext(contract: RentalContract) {
  const users = safeParse<any[]>(localStorage.getItem('uniroom_all_users'), []);
  const profiles = safeParse<any[]>(localStorage.getItem('uniroom_student_profiles'), []);
  const properties = safeParse<any[]>(localStorage.getItem('uniroom_properties'), []);
  const rooms = safeParse<any[]>(localStorage.getItem('uniroom_rooms'), []);

  const student = users.find(user => String(user.id) === String(contract.studentId));
  const profile = profiles.find(profile => String(profile?.personal?.userId) === String(contract.studentId));
  const property = properties.find(property => String(property.id) === String(contract.propertyId));
  const room = rooms.find(room => String(room.id) === String(contract.roomId));

  const studentName =
    profile?.personal?.fullName ||
    student?.name ||
    student?.email ||
    'Estudante';

  return {
    studentName,
    studentInitials: getInitials(studentName),
    propertyTitle: property?.title || 'Alojamento',
    propertyAddress: [property?.address, property?.zone, property?.city].filter(Boolean).join(', '),
    roomTitle: room?.roomNumber || room?.title || 'Quarto',
  };
}

function ensureContractsFromActiveHomes(landlordId: string) {
  const activeHomes = safeParse<any[]>(localStorage.getItem('uniroom_active_homes'), []);
  const rooms = safeParse<any[]>(localStorage.getItem('uniroom_rooms'), []);

  activeHomes
    .filter(home => String(home.landlordId) === String(landlordId))
    .forEach(home => {
      const room = rooms.find(item => String(item.id) === String(home.roomId));
      const rent = Number(home.monthlyRent ?? room?.price ?? 0);
      const utilities = Number(home.utilities ?? room?.utilities ?? 0);

      getOrCreateRentalContract(home, rent, utilities);
    });
}

function contractToForm(contract: RentalContract): ContractFormState {
  return {
    title: contract.title || 'Contrato de arrendamento',
    status: contract.status || 'active',
    startDate: toDateInput(contract.startDate),
    endDate: toDateInput(contract.endDate),
    monthlyRent: String(contract.monthlyRent ?? 0),
    depositAmount: String(contract.depositAmount ?? 0),
    utilitiesAmount: String(contract.utilitiesAmount ?? 0),
    notes: contract.notes || '',
  };
}

export function LandlordContractManager({ landlordId, onUpdated }: LandlordContractManagerProps) {
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);
  const [form, setForm] = useState<ContractFormState | null>(null);

  const selectedContext = useMemo(
    () => selectedContract ? getContractContext(selectedContract) : null,
    [selectedContract],
  );

  const loadContracts = () => {
    if (!landlordId) {
      setContracts([]);
      return;
    }

    ensureContractsFromActiveHomes(landlordId);
    setContracts(getRentalContractsForLandlord(landlordId));
  };

  useEffect(() => {
    loadContracts();
  }, [landlordId]);

  const openEditor = (contract: RentalContract) => {
    setSelectedContract(contract);
    setForm(contractToForm(contract));
  };

  const closeEditor = () => {
    setSelectedContract(null);
    setForm(null);
  };

  const saveContract = () => {
    if (!selectedContract || !form) return;

    const updated = updateRentalContract(selectedContract.id, {
      title: form.title.trim() || 'Contrato de arrendamento',
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      monthlyRent: Number(form.monthlyRent) || 0,
      depositAmount: Number(form.depositAmount) || 0,
      utilitiesAmount: Number(form.utilitiesAmount) || 0,
      notes: form.notes.trim(),
    });

    if (updated) {
      setSelectedContract(updated);
      setForm(contractToForm(updated));
      loadContracts();
      onUpdated?.();
      alert('Contrato atualizado. O estudante já consegue ver a versão atualizada.');
    }
  };

  return (
    <Card className="p-5 md:p-6 mb-8 border-primary/10">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-3">
            <FileText className="w-3.5 h-3.5" />
            Contratos digitais
          </div>

          <h2 className="text-xl font-bold text-foreground mb-1">
            Gerir contratos dos estudantes
          </h2>

          <p className="text-sm text-muted-foreground max-w-2xl">
            Edita renda, caução, datas, estado e observações. O estudante vê estes dados em
            “A Minha Casa” ao clicar em “Ver contrato”.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadContracts}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Atualizar
        </Button>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">Ainda não há contratos</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Quando aceitares uma candidatura e o estudante confirmar estadia, o contrato digital
            fica disponível para edição.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-5">
          <div className="space-y-3">
            {contracts.map(contract => {
              const context = getContractContext(contract);

              return (
                <button
                  key={contract.id}
                  type="button"
                  onClick={() => openEditor(contract)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    selectedContract?.id === contract.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold">
                        {context.studentInitials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground truncate">{context.studentName}</h3>
                          <Badge variant={getContractStatusTone(contract.status)}>
                            {getContractStatusLabel(contract.status)}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {context.propertyTitle} · {context.roomTitle}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          N.º {contract.contractNumber}
                        </p>
                      </div>
                    </div>

                    <div className="text-left md:text-right flex-shrink-0">
                      <p className="font-bold text-primary">{formatCurrency(contract.monthlyRent)}</p>
                      <p className="text-xs text-muted-foreground">
                        Caução {formatCurrency(contract.depositAmount)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-5 min-h-[420px]">
            {!selectedContract || !form ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <Edit3 className="w-10 h-10 text-muted-foreground mb-3" />
                <h3 className="font-bold text-foreground mb-1">Seleciona um contrato</h3>
                <p className="text-sm text-muted-foreground">
                  Escolhe um estudante à esquerda para editar o contrato digital.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h3 className="font-bold text-foreground">Editar contrato</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedContext?.studentName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeEditor}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-card transition-colors"
                    aria-label="Fechar edição"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-foreground">Título</span>
                    <input
                      value={form.title}
                      onChange={event => setForm({ ...form, title: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-foreground">Estado</span>
                    <select
                      value={form.status}
                      onChange={event => setForm({ ...form, status: event.target.value as ContractStatus })}
                      className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-sm font-medium text-foreground">Início</span>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={event => setForm({ ...form, startDate: event.target.value })}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-foreground">Fim</span>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={event => setForm({ ...form, endDate: event.target.value })}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <label className="block">
                      <span className="text-sm font-medium text-foreground">Renda</span>
                      <input
                        type="number"
                        min={0}
                        value={form.monthlyRent}
                        onChange={event => setForm({ ...form, monthlyRent: event.target.value })}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-foreground">Despesas</span>
                      <input
                        type="number"
                        min={0}
                        value={form.utilitiesAmount}
                        onChange={event => setForm({ ...form, utilitiesAmount: event.target.value })}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-foreground">Caução</span>
                      <input
                        type="number"
                        min={0}
                        value={form.depositAmount}
                        onChange={event => setForm({ ...form, depositAmount: event.target.value })}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-foreground">Observações</span>
                    <textarea
                      rows={5}
                      value={form.notes}
                      onChange={event => setForm({ ...form, notes: event.target.value })}
                      placeholder="Ex: contrato renovável, condições especiais, regras adicionais..."
                      className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </label>

                  <div className="rounded-xl bg-card border border-border p-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="w-3.5 h-3.5" />
                      <span>{selectedContext?.propertyTitle}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3.5 h-3.5" />
                      <span>{selectedContext?.studentName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>N.º {selectedContract.contractNumber}</span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={saveContract}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar contrato
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {contracts.length > 0 && (
        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-secondary" />
          Alterações guardadas em localStorage e refletidas no contrato do estudante.
        </div>
      )}
    </Card>
  );
}

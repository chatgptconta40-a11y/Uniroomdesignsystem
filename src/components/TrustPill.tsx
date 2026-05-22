import { ShieldCheck, CheckCircle, GraduationCap, Star, User, ThumbsUp, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TrustPillType =
  | 'verified-listing'
  | 'verified-landlord'
  | 'confirmed-profile'
  | 'verified-student'
  | 'trusted-member'
  | 'new-member'
  | 'positive-review';

interface PillConfig {
  Icon: LucideIcon;
  label: string;
  cls: string;
}

const PILL_CONFIG: Record<TrustPillType, PillConfig> = {
  'verified-listing': {
    Icon: ShieldCheck,
    label: 'Anúncio verificado',
    cls: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  'verified-landlord': {
    Icon: ShieldCheck,
    label: 'Senhorio verificado',
    cls: 'bg-green-50 text-green-700 border border-green-200',
  },
  'confirmed-profile': {
    Icon: CheckCircle,
    label: 'Perfil confirmado',
    cls: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  'verified-student': {
    Icon: GraduationCap,
    label: 'Estudante verificado',
    cls: 'bg-violet-50 text-violet-700 border border-violet-200',
  },
  'trusted-member': {
    Icon: Star,
    label: 'Membro de confiança',
    cls: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  'new-member': {
    Icon: User,
    label: 'Novo membro',
    cls: 'bg-gray-50 text-gray-600 border border-gray-200',
  },
  'positive-review': {
    Icon: ThumbsUp,
    label: 'Avaliação positiva',
    cls: 'bg-green-50 text-green-700 border border-green-200',
  },
};

type PillSize = 'xs' | 'sm' | 'md';

const SIZE_CLS: Record<PillSize, { wrap: string; icon: string }> = {
  xs: { wrap: 'px-1.5 py-0.5 gap-1 text-[10px]', icon: 'w-3 h-3' },
  sm: { wrap: 'px-2 py-1 gap-1.5 text-xs', icon: 'w-3.5 h-3.5' },
  md: { wrap: 'px-3 py-1.5 gap-1.5 text-sm', icon: 'w-4 h-4' },
};

interface TrustPillProps {
  type: TrustPillType;
  size?: PillSize;
  className?: string;
  /** Override the default label */
  label?: string;
}

export function TrustPill({ type, size = 'sm', className = '', label }: TrustPillProps) {
  const { Icon, label: defaultLabel, cls } = PILL_CONFIG[type];
  const { wrap, icon } = SIZE_CLS[size];

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${wrap} ${cls} ${className}`}>
      <Icon className={`${icon} flex-shrink-0`} />
      {label ?? defaultLabel}
    </span>
  );
}

/** Derive TrustPill type from trust level string */
export function trustLevelToPill(level: 'new' | 'confirmed' | 'trusted'): TrustPillType {
  if (level === 'trusted') return 'trusted-member';
  if (level === 'confirmed') return 'confirmed-profile';
  return 'new-member';
}

/** Small inline trust shield — used in compact contexts */
export function TrustDot({ level }: { level: 'new' | 'confirmed' | 'trusted' }) {
  const cfg = {
    new: { cls: 'bg-gray-200 text-gray-500', title: 'Novo membro' },
    confirmed: { cls: 'bg-blue-100 text-blue-600', title: 'Membro confirmado' },
    trusted: { cls: 'bg-green-100 text-green-600', title: 'Membro de confiança' },
  }[level];
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${cfg.cls}`}
      title={cfg.title}
    >
      <Shield className="w-3 h-3" />
    </span>
  );
}

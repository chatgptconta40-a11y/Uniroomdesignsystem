import { Shield, Check } from 'lucide-react';
import { useTrustScore, useVerificationStatus } from '../hooks/useTrust';
import { getVerificationBadge, getTrustBadge } from '../utils/trustLabels';

interface TrustBadgeProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function TrustBadge({ userId, size = 'md', showLabel = true }: TrustBadgeProps) {
  const { score: trustScore } = useTrustScore(userId);
  const { status: verification } = useVerificationStatus(userId);

  if (!trustScore && !verification) return null;

  const verificationBadge = getVerificationBadge(verification?.level ?? 'none');
  const trustBadge = getTrustBadge(trustScore?.level ?? 'new');

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-2">
      {showLabel && trustScore && (
        <div
          className={`${sizes[size]} rounded-full font-medium flex items-center gap-1.5 ${trustBadge.bgColor} ${trustBadge.color}`}
        >
          <Shield className={iconSizes[size]} />
          <span>{trustBadge.label}</span>
        </div>
      )}

      {verification && verification.level !== 'none' && (
        <div
          className={`${sizes[size]} rounded-full font-medium flex items-center gap-1 bg-card border-2 ${
            verification.level === 'gold'
              ? 'border-yellow-400'
              : verification.level === 'silver'
              ? 'border-gray-400'
              : 'border-amber-600'
          }`}
          title={`Verificado ${verificationBadge.label}`}
        >
          <span className="text-base">{verificationBadge.icon}</span>

          {showLabel && size !== 'sm' && (
            <span className={verificationBadge.color}>
              {verificationBadge.label}
            </span>
          )}
        </div>
      )}

      {verification?.emailVerified && !showLabel && (
        <div
          className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
          title="Email verificado"
        >
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
}

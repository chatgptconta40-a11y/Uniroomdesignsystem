import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-primary text-primary-foreground',
    success: 'bg-secondary text-secondary-foreground',
    warning: 'bg-accent text-accent-foreground',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

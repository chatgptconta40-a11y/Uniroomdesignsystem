import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-secondary/10 text-secondary border border-secondary/20',
    warning: 'bg-accent/10 text-accent-foreground border border-accent/20',
    outline: 'bg-transparent text-muted-foreground border border-border',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

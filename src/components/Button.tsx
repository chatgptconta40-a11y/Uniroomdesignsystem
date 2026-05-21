import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/30';

  const sizeStyles = {
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-md',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-sm hover:shadow-md',
    outline: 'bg-card text-foreground border-2 border-border hover:bg-muted hover:border-primary/40',
    ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

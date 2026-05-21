import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  // Add default padding if no padding class is provided
  const hasCustomPadding = /p-|px-|py-|pt-|pb-|pl-|pr-/.test(className);
  const defaultPadding = hasCustomPadding ? '' : 'p-6';

  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-xl border border-border shadow-sm transition-all duration-200 ${defaultPadding} ${
        hover ? 'hover:shadow-md hover:border-primary/20 hover:-translate-y-1 cursor-pointer' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent';
}

export function ProgressBar({ progress, showLabel = true, size = 'md', color = 'primary' }: ProgressBarProps) {
  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorStyles = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-muted rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`${sizeStyles[size]} ${colorStyles[color]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-muted-foreground mt-1.5">
          {Math.round(progress)}% completo
        </p>
      )}
    </div>
  );
}

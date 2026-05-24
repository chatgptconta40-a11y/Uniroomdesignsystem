import { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  title: string;
  description?: string;
  disabled?: boolean;
}

export function OptionCard({
  selected,
  onClick,
  icon,
  title,
  description,
  disabled = false,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`group relative w-full min-h-[88px] rounded-lg border bg-card p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        selected
          ? 'border-primary shadow-sm ring-1 ring-primary/20'
          : 'border-border hover:border-primary/40 hover:shadow-sm'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <div className="flex items-start gap-3 pr-8">
        {icon && (
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
              selected
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary'
            }`}
          >
            {icon}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h4
            className={`text-sm font-semibold leading-snug ${
              selected ? 'text-primary' : 'text-foreground'
            }`}
          >
            {title}
          </h4>

          {description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      <span
        className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
          selected
            ? 'border-primary bg-primary text-white'
            : 'border-border bg-background text-transparent group-hover:border-primary/40'
        }`}
        aria-hidden="true"
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
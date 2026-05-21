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

export function OptionCard({ selected, onClick, icon, title, description, disabled = false }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full p-5 border-2 rounded-xl transition-all text-left ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="flex items-start gap-4">
        {icon && (
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
            selected ? 'bg-primary/10' : 'bg-muted'
          }`}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h4 className={`mb-1 ${selected ? 'text-primary' : ''}`}>{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </button>
  );
}

import { InputHTMLAttributes, forwardRef } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: InputHTMLAttributes<HTMLInputElement>['onChange'];
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', onCheckedChange, onChange, checked, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          ref={ref}
          type="checkbox"
          className={`w-5 h-5 text-primary bg-input-background border-2 border-border rounded-md focus:ring-2 focus:ring-primary focus:ring-offset-1 cursor-pointer transition-all checked:bg-primary checked:border-primary ${className}`}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <span className="text-sm text-foreground group-hover:text-primary transition-colors">{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

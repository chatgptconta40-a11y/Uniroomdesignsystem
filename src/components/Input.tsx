import { InputHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`w-full px-4 py-3 bg-input-background border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder:text-muted-foreground ${
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 pr-10'
                : 'border-border focus:ring-primary focus:border-primary'
            } ${className}`}
            {...props}
          />
          {error && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500 flex items-start gap-1">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

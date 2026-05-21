import { InputHTMLAttributes } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  labels?: { min: string; max: string };
}

export function Slider({
  label,
  min = 1,
  max = 5,
  step = 1,
  value,
  onChange,
  labels,
  className = '',
}: SliderProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-3 text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="space-y-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full h-2 bg-muted rounded-full appearance-none cursor-pointer slider ${className}`}
          style={{
            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((value - min) / (max - min)) * 100}%, var(--muted) ${((value - min) / (max - min)) * 100}%, var(--muted) 100%)`,
          }}
        />
        {labels && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{labels.min}</span>
            <span className="font-medium text-primary">{value}</span>
            <span>{labels.max}</span>
          </div>
        )}
      </div>
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}

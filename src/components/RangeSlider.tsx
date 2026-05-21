import { useState } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  label?: string;
  formatValue?: (value: number) => string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  formatValue = (v) => String(v),
}: RangeSliderProps) {
  const [minVal, maxVal] = value;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value);
    if (newMin < maxVal) {
      onChange([newMin, maxVal]);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value);
    if (newMax > minVal) {
      onChange([minVal, newMax]);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-3 text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div className="relative h-12">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none z-20"
          style={{
            background: 'transparent',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none z-20"
          style={{
            background: 'transparent',
          }}
        />

        <div className="absolute w-full h-2 bg-muted rounded-full z-10" />
        <div
          className="absolute h-2 bg-primary rounded-full z-10"
          style={{
            left: `${((minVal - min) / (max - min)) * 100}%`,
            right: `${100 - ((maxVal - min) / (max - min)) * 100}%`,
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="text-muted-foreground">{formatValue(minVal)}</span>
        <span className="font-medium text-primary">
          {formatValue(minVal)} - {formatValue(maxVal)}
        </span>
        <span className="text-muted-foreground">{formatValue(maxVal)}</span>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          pointer-events: all;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          pointer-events: all;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}

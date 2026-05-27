'use client';

interface NumberInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function NumberInput({ id, label, value, onChange, min, max, step = 0.1, unit }: NumberInputProps) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative">
        <input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          placeholder={`Enter value${unit ? ` (${unit})` : ''}`}
          data-testid={`number-input-${id}`}
          className="w-full border border-gray-200 bg-gray-50/20 rounded-2xl px-5 py-4 text-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal focus:bg-white shadow-sm transition-all duration-300"
        />
        {unit && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-coral font-bold bg-brand-cream/80 border border-brand-teal/20 px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

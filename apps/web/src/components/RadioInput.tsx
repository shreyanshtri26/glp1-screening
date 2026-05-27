'use client';

interface Option {
  value: string;
  label: string;
}

interface RadioInputProps {
  id: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function RadioInput({ id, options, value, onChange }: RadioInputProps) {
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} data-testid={`radio-group-${id}`} className="space-y-3">
      {options.map((opt) => {
        const isChecked = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
              isChecked
                ? 'border-brand-teal bg-brand-cream/40 shadow-md shadow-brand-teal/10 scale-[1.005]'
                : 'border-gray-100 bg-gray-50/30 hover:bg-brand-cream/30 hover:border-brand-teal/50 shadow-sm'
            }`}
            data-testid={`radio-option-${opt.value}`}
          >
            <div className="relative flex items-center justify-center">
              <input
                type="radio"
                name={id}
                value={opt.value}
                checked={isChecked}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  isChecked
                    ? 'border-brand-teal bg-brand-teal shadow-inner'
                    : 'border-gray-300 bg-white hover:border-brand-teal/80'
                }`}
              >
                {isChecked && (
                  <div className="w-2 h-2 rounded-full bg-white animate-scale-up" />
                )}
              </div>
            </div>
            <span className={`text-base transition-colors duration-200 ${isChecked ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
              {opt.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

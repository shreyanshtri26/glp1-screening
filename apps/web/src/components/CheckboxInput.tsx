'use client';

interface Option {
  value: string;
  label: string;
}

interface CheckboxInputProps {
  id: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function CheckboxInput({ id, options, value, onChange }: CheckboxInputProps) {
  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  return (
    <fieldset data-testid={`checkbox-group-${id}`} className="space-y-3">
      <legend className="sr-only">Select all that apply</legend>
      {options.map((opt) => {
        const isChecked = value.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
              isChecked
                ? 'border-brand-teal bg-brand-cream/40 shadow-md shadow-brand-teal/10 scale-[1.005]'
                : 'border-gray-100 bg-gray-50/30 hover:bg-brand-cream/30 hover:border-brand-teal/50 shadow-sm'
            }`}
            data-testid={`checkbox-option-${opt.value}`}
          >
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                name={id}
                value={opt.value}
                checked={isChecked}
                onChange={() => toggle(opt.value)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 ${
                  isChecked
                    ? 'border-brand-teal bg-brand-teal shadow-inner'
                    : 'border-gray-300 bg-white hover:border-brand-teal/80'
                }`}
              >
                {isChecked && (
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="3"
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className={`text-base transition-colors duration-200 ${isChecked ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
              {opt.label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

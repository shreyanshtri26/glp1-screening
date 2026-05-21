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
    <div role="radiogroup" aria-labelledby={`${id}-label`} data-testid={`radio-group-${id}`}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-3 p-3 mb-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
          data-testid={`radio-option-${opt.value}`}
        >
          <input
            type="radio"
            name={id}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-gray-800">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

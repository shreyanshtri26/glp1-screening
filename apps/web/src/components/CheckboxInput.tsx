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
    <fieldset data-testid={`checkbox-group-${id}`}>
      <legend className="sr-only">Select all that apply</legend>
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-3 p-3 mb-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
          data-testid={`checkbox-option-${opt.value}`}
        >
          <input
            type="checkbox"
            name={id}
            value={opt.value}
            checked={value.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-gray-800">{opt.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

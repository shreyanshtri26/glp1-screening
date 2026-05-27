'use client';

import { useState } from 'react';
import type { FormStep as FormStepType } from '@glp1/shared';
import { ProgressBar } from './ProgressBar';
import { RadioInput } from './RadioInput';
import { CheckboxInput } from './CheckboxInput';
import { NumberInput } from './NumberInput';

interface FormStepProps {
  step: FormStepType;
  totalInputScreens: number;
  initialValue?: unknown;
  onSubmit: (value: unknown) => Promise<void>;
}

export function FormStep({ step, totalInputScreens, initialValue, onSubmit }: FormStepProps) {
  const [value, setValue] = useState<unknown>(
    initialValue ?? (step.type === 'checkbox' ? [] : step.type === 'number' ? '' : ''),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (step.type === 'number') {
      const num = parseFloat(value as string);
      if (isNaN(num)) { setError('Please enter a valid number'); return; }
      if (step.validation?.min !== undefined && num < step.validation.min) {
        setError(`Value must be at least ${step.validation.min}`); return;
      }
      if (step.validation?.max !== undefined && num > step.validation.max) {
        setError(`Value must be at most ${step.validation.max}`); return;
      }
    }
    if (step.type === 'radio' && !value) { setError('Please select an option'); return; }
    if (step.type === 'checkbox' && (value as string[]).length === 0 && step.validation?.required) {
      setError('Please select at least one option'); return;
    }

    setLoading(true);
    try {
      const submitValue = step.type === 'number' ? parseFloat(value as string) : value;
      await onSubmit(submitValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const canSkip = step.type === 'checkbox' && !step.validation?.required;

  return (
    <form onSubmit={handleSubmit} data-testid={`form-step-${step.id}`} className="w-full">
      <ProgressBar current={step.id} total={totalInputScreens} />

      <h2
        id={`step-${step.id}-label`}
        className="text-2xl font-extrabold text-gray-900 leading-snug tracking-tight mb-8"
        data-testid="step-prompt"
      >
        {step.prompt}
      </h2>

      {step.type === 'radio' && step.options && (
        <RadioInput
          id={step.key}
          options={step.options}
          value={value as string}
          onChange={setValue}
        />
      )}
      {step.type === 'checkbox' && step.options && (
        <CheckboxInput
          id={step.key}
          options={step.options}
          value={value as string[]}
          onChange={setValue}
        />
      )}
      {step.type === 'number' && (
        <NumberInput
          id={step.key}
          label={step.prompt}
          value={value as string}
          onChange={setValue}
          min={step.validation?.min}
          max={step.validation?.max}
          unit={step.unit}
        />
      )}

      {error && (
        <div role="alert" className="flex items-center gap-2 text-red-600 text-sm font-semibold mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl" data-testid="step-error">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="mt-10 flex gap-4">
        <button
          type="submit"
          disabled={loading}
          data-testid="step-submit"
          className="flex-1 bg-gradient-to-r from-brand-coral to-[#f59e7a] text-white py-4 px-6 rounded-2xl font-bold tracking-wide shadow-lg shadow-brand-coral/20 hover:brightness-105 active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
        {canSkip && (
          <button
            type="button"
            onClick={() => onSubmit([])}
            data-testid="step-skip"
            className="px-6 py-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/80 text-gray-700 hover:bg-brand-gold/25 font-bold transition-all duration-200"
          >
            Skip
          </button>
        )}
      </div>
    </form>
  );
}

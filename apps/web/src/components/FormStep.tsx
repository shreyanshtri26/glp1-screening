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
        className="text-xl font-semibold text-gray-800 mb-6"
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
        <p role="alert" className="text-red-600 text-sm mt-2" data-testid="step-error">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-3">
        <button
          type="submit"
          disabled={loading}
          data-testid="step-submit"
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
        {canSkip && (
          <button
            type="button"
            onClick={() => onSubmit([])}
            data-testid="step-skip"
            className="px-4 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Skip
          </button>
        )}
      </div>
    </form>
  );
}

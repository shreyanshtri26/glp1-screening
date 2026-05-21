'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getStep, TOTAL_INPUT_SCREENS } from '@glp1/shared';
import type { FormStep as FormStepType } from '@glp1/shared';
import { useFormStore } from '@/store/form-store';
import { submitAnswer } from '@/lib/api';
import { FormStep } from '@/components/FormStep';

export default function FormStepPage() {
  const params = useParams();
  const router = useRouter();
  const stepId = parseInt(params.step as string, 10);
  const { sessionId, answers, setAnswer, setCurrentStep, setResult, reset } = useFormStore();

  const [step, setStep] = useState<FormStepType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) { router.replace('/'); return; }
    const s = getStep(stepId);
    if (!s) { router.replace('/'); return; }
    // Skip computed steps — they're handled server-side
    if (s.type === 'computed') { router.replace('/'); return; }
    setStep(s);
  }, [stepId, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (value: unknown) => {
    if (!sessionId || !step) return;
    setAnswer(step.id, value);

    const { next } = await submitAnswer(sessionId, step.id, value);

    if ('outcome' in next) {
      // Final result
      setResult(next);
      router.push('/result');
    } else {
      setCurrentStep(next.id);
      router.push(`/form/${next.id}`);
    }
  };

  if (!step) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <FormStep
        step={step}
        totalInputScreens={TOTAL_INPUT_SCREENS}
        initialValue={answers[step.id]}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStore } from '@/store/form-store';
import { startSession } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const { sessionId, currentStep, result, setSessionId, setCurrentStep, hydrate } = useFormStore();

  useEffect(() => {
    async function init() {
      if (result) {
        router.replace('/result');
        return;
      }
      if (sessionId) {
        await hydrate();
        const fresh = useFormStore.getState();
        if (fresh.result) { router.replace('/result'); return; }
        router.replace(`/form/${fresh.currentStep}`);
        return;
      }
      // Start a new session
      const { sessionId: id, step } = await startSession();
      setSessionId(id);
      setCurrentStep(step.id);
      router.replace(`/form/${step.id}`);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-[50vh]" suppressHydrationWarning>
      <p className="text-gray-400 animate-pulse">Loading…</p>
    </div>
  );
}

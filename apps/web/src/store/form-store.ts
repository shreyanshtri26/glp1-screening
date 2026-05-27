'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EligibilityResult } from '@glp1/shared';
import { getSession } from '@/lib/api';

interface FormStore {
  sessionId: string | null;
  currentStep: number;
  answers: Record<number, unknown>;
  result: EligibilityResult | null;
  // actions
  setSessionId: (id: string) => void;
  setCurrentStep: (step: number) => void;
  setAnswer: (step: number, value: unknown) => void;
  setResult: (result: EligibilityResult) => void;
  reset: () => void;
  hydrate: () => Promise<void>;
}

export const useFormStore = create<FormStore>()(
  persist(
    (set, get) => ({
      sessionId: null,
      currentStep: 1,
      answers: {},
      result: null,

      setSessionId: (id) => set({ sessionId: id }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setAnswer: (step, value) =>
        set((s) => ({ answers: { ...s.answers, [step]: value } })),
      setResult: (result) => set({ result }),
      reset: () => set({ sessionId: null, currentStep: 1, answers: {}, result: null }),

      hydrate: async () => {
        const { sessionId } = get();
        if (!sessionId) return;
        try {
          const data = await getSession(sessionId);
          const answersMap: Record<number, unknown> = {};
          data.answers.forEach((a) => { answersMap[a.step] = a.value; });
          set({
            currentStep: data.currentStep,
            answers: answersMap,
            result: data.session.result
              ? { outcome: data.session.result as EligibilityResult['outcome'], reason: data.session.resultReason ?? '' }
              : null,
          });
        } catch {
          // stale session — reset
          set({ sessionId: null, currentStep: 1, answers: {}, result: null });
        }
      },
    }),
    {
      name: 'glp1-form',
      partialize: (state) => ({
        sessionId: state.sessionId,
        currentStep: state.currentStep,
        answers: state.answers,
        result: state.result,
      }),
    },
  ),
);

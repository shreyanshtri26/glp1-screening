'use client';

import type { EligibilityResult } from '@glp1/shared';
import Link from 'next/link';

interface ResultScreenProps {
  result: EligibilityResult;
  onStartOver: () => void;
}

const CONFIG: Record<EligibilityResult['outcome'], { title: string; color: string; icon: string; bg: string }> = {
  eligible: {
    title: 'You appear eligible',
    color: 'text-green-700',
    icon: '✓',
    bg: 'bg-green-50 border-green-200',
  },
  ineligible: {
    title: 'Not eligible at this time',
    color: 'text-red-700',
    icon: '✗',
    bg: 'bg-red-50 border-red-200',
  },
  clinical_review: {
    title: 'Clinical review required',
    color: 'text-yellow-700',
    icon: '!',
    bg: 'bg-yellow-50 border-yellow-200',
  },
};

export function ResultScreen({ result, onStartOver }: ResultScreenProps) {
  const cfg = CONFIG[result.outcome];
  return (
    <div data-testid="result-screen" className="max-w-lg mx-auto text-center">
      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-4xl font-bold mb-6 border-2 ${cfg.bg} ${cfg.color}`}>
        {cfg.icon}
      </div>
      <h1 className={`text-2xl font-bold mb-3 ${cfg.color}`} data-testid="result-outcome">
        {cfg.title}
      </h1>
      <p className="text-gray-600 mb-8" data-testid="result-reason">{result.reason}</p>
      <div className={`rounded-xl border p-4 mb-8 ${cfg.bg}`}>
        <p className="text-sm text-gray-600">
          {result.outcome === 'eligible'
            ? 'Based on your responses, you may be a suitable candidate for GLP-1 medication. Please consult with a healthcare provider to confirm.'
            : result.outcome === 'clinical_review'
            ? 'Your responses indicate that a clinical review is needed. Please schedule an appointment with a healthcare provider.'
            : 'Based on your responses, GLP-1 medication may not be appropriate for you at this time. Please speak with your doctor for alternatives.'}
        </p>
      </div>
      <button
        onClick={onStartOver}
        data-testid="start-over-btn"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Start Over
      </button>
    </div>
  );
}

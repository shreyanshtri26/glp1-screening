'use client';

import type { EligibilityResult } from '@glp1/shared';
import Link from 'next/link';

interface ResultScreenProps {
  result: EligibilityResult;
  onStartOver: () => void;
}

const CONFIG: Record<EligibilityResult['outcome'], { title: string; color: string; icon: string; bg: string; iconBg: string }> = {
  eligible: {
    title: 'You appear eligible',
    color: 'text-[#1b6160]',
    icon: '✓',
    bg: 'bg-gradient-to-br from-brand-teal/10 via-white to-white border-brand-teal/30',
    iconBg: 'bg-brand-teal/20 border-brand-teal/40',
  },
  ineligible: {
    title: 'Not eligible at this time',
    color: 'text-[#8a3311]',
    icon: '✗',
    bg: 'bg-gradient-to-br from-brand-coral/8 via-white to-white border-brand-coral/20',
    iconBg: 'bg-brand-coral/15 border-brand-coral/25',
  },
  clinical_review: {
    title: 'Clinical review required',
    color: 'text-[#7d5e0a]',
    icon: '!',
    bg: 'bg-gradient-to-br from-brand-gold/15 via-white to-white border-brand-gold/30',
    iconBg: 'bg-brand-gold/25 border-brand-gold/40',
  },
};

export function ResultScreen({ result, onStartOver }: ResultScreenProps) {
  const cfg = CONFIG[result.outcome];
  return (
    <div data-testid="result-screen" className="max-w-lg mx-auto text-center py-6">
      <div className={`inline-flex items-center justify-center w-24 h-24 rounded-[2rem] text-4xl font-extrabold mb-8 border transition-transform duration-500 hover:rotate-[360deg] ${cfg.iconBg} ${cfg.color}`}>
        {cfg.icon}
      </div>
      
      <div className="inline-block px-3 py-1 bg-gray-100/80 border border-gray-200/50 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-4">
        Assessment Completed
      </div>

      <h1 className={`text-3xl font-extrabold mb-3 tracking-tight ${cfg.color}`} data-testid="result-outcome">
        {cfg.title}
      </h1>
      
      <p className="text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-100 rounded-2xl py-2 px-4 inline-block mb-8" data-testid="result-reason">
        Reason: {result.reason}
      </p>

      <div className={`rounded-2xl border p-6 mb-10 text-left transition-all ${cfg.bg}`}>
        <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${cfg.color}`}>What this means:</h4>
        <p className="text-sm text-gray-600 leading-relaxed font-medium">
          {result.outcome === 'eligible'
            ? 'Based on your responses, you may be a suitable candidate for GLP-1 weight-loss medication. Please consult with one of our affiliated healthcare providers to confirm your treatment plan.'
            : result.outcome === 'clinical_review'
            ? 'Your responses indicate that a clinical review is needed by a practitioner. This is completely normal — certain health history markers just require a safe, human review before prescription approval.'
            : 'Based on your responses, GLP-1 weight-loss medication may not be safe or appropriate for you at this time. Please speak with your doctor to explore alternative metabolic options.'}
        </p>
      </div>

      <button
        onClick={onStartOver}
        data-testid="start-over-btn"
        className="w-full sm:w-auto bg-gradient-to-r from-brand-coral to-[#f59e7a] text-white px-10 py-4 rounded-2xl font-bold tracking-wide shadow-lg shadow-brand-coral/20 hover:brightness-105 active:scale-[0.98] transition-all duration-200"
      >
        Start Over
      </button>
    </div>
  );
}

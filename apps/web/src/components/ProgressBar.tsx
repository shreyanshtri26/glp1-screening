'use client';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center text-xs font-bold tracking-wider uppercase mb-2">
        <span className="text-brand-coral">Step {current} of {total}</span>
        <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${current} of ${total}`}
        className="w-full bg-gray-100 rounded-full h-3 p-[2px] border border-gray-200/40"
      >
        <div
          className="bg-gradient-to-r from-brand-teal via-brand-gold to-brand-coral h-full rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

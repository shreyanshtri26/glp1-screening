'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStore } from '@/store/form-store';
import { ResultScreen } from '@/components/ResultScreen';

export default function ResultPage() {
  const router = useRouter();
  const { result, reset } = useFormStore();

  useEffect(() => {
    if (!result) { router.replace('/'); }
  }, [result, router]);

  const handleStartOver = () => {
    reset();
    router.push('/');
  };

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-xl shadow-brand-coral/5 p-8 md:p-10 transition-all duration-300">
      <ResultScreen result={result} onStartOver={handleStartOver} />
    </div>
  );
}

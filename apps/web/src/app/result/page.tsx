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
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <ResultScreen result={result} onStartOver={handleStartOver} />
    </div>
  );
}

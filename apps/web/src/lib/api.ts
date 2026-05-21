import type { EligibilityResult, StepOrResult } from '@glp1/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface StartSessionResponse {
  sessionId: string;
  step: StepOrResult;
}

export interface SubmitAnswerResponse {
  next: StepOrResult;
}

export interface GetSessionResponse {
  session: {
    id: string;
    currentStep: number;
    status: string;
    result: string | null;
    resultReason: string | null;
  };
  answers: Array<{ step: number; value: unknown }>;
  currentStep: number;
}

export async function startSession(): Promise<StartSessionResponse> {
  const res = await fetch(`${API_BASE}/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`startSession failed: ${res.status}`);
  return res.json();
}

export async function submitAnswer(
  sessionId: string,
  step: number,
  value: unknown,
): Promise<SubmitAnswerResponse> {
  const res = await fetch(`${API_BASE}/session/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, step, value }),
  });
  if (!res.ok) throw new Error(`submitAnswer failed: ${res.status}`);
  return res.json();
}

export async function getSession(sessionId: string): Promise<GetSessionResponse> {
  const res = await fetch(`${API_BASE}/session/${sessionId}`);
  if (!res.ok) throw new Error(`getSession failed: ${res.status}`);
  return res.json();
}

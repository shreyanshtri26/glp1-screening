// ─── Form Schema Types ────────────────────────────────────────────────────────

export type InputType = 'number' | 'radio' | 'checkbox' | 'computed';

export type EligibilityOutcome = 'eligible' | 'ineligible' | 'clinical_review';

export interface EndState {
  type: 'end';
  outcome: EligibilityOutcome;
  reason: string;
}

export interface NextState {
  type: 'next';
  step: number;
}

export type BranchTarget = EndState | NextState;

export interface BranchCondition {
  field: string;
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'neq' | 'includes' | 'not_includes' | 'count_gte';
  value: number | string | boolean;
}

export interface BranchRule {
  condition: BranchCondition;
  target: BranchTarget;
}

export interface OptionItem {
  value: string;
  label: string;
}

export interface FormStep {
  id: number;
  key: string;
  prompt: string;
  type: InputType;
  options?: OptionItem[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
  };
  branch?: BranchRule[];
  /** default target when no branch matches (or type === 'computed') */
  defaultNext?: BranchTarget;
  /** for computed type, describes what is being computed */
  computeDescription?: string;
}

// ─── Session / API Types ──────────────────────────────────────────────────────

export type SessionStatus = 'in_progress' | 'completed';

export interface Session {
  id: string;
  currentStep: number;
  status: SessionStatus;
  result?: EligibilityOutcome;
  resultReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerRecord {
  id: string;
  sessionId: string;
  step: number;
  value: AnswerValue;
  createdAt: string;
}

export type AnswerValue = number | string | string[];

// ─── API Request/Response Types ──────────────────────────────────────────────

export interface StartSessionResponse {
  sessionId: string;
  step: FormStep;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  step: number;
  value: AnswerValue;
}

export type StepOrResult =
  | { type: 'step'; step: FormStep }
  | { type: 'result'; outcome: EligibilityOutcome; reason: string };

export interface SubmitAnswerResponse {
  next: StepOrResult;
}

export interface GetSessionResponse {
  session: Session;
  answers: AnswerRecord[];
  currentStep: FormStep | null;
}

// ─── Evaluator Types ──────────────────────────────────────────────────────────

export interface EligibilityAnswers {
  age: number;
  weight: number;
  height: number;
  bmi: number;
  pregnant: 'yes' | 'no';
  comorbidities: string[];
  diabetes: 'yes' | 'no';
  hba1c?: number;
  bloodPressure: string[];
  medications: string[];
  smoking: 'yes' | 'no';
  alcoholFrequency: 'never' | 'monthly' | 'weekly' | 'daily';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'vigorous';
  diet: string[];
}

export interface EligibilityResult {
  outcome: EligibilityOutcome;
  reason: string;
}

import type { FormStep } from './types';

/**
 * Complete 15-screen GLP-1 eligibility form schema.
 * Each step defines prompt, input type, options, branch logic, and default next.
 *
 * Screen 4 (BMI) and Screen 15 (Final Evaluation) are "computed" steps —
 * they perform calculations or evaluation rather than collecting direct user input.
 */
export const FORM_SCHEMA: FormStep[] = [
  // ─── Screen 1 — Age ────────────────────────────────────────────────────────
  {
    id: 1,
    key: 'age',
    prompt: 'What is your age?',
    type: 'number',
    validation: { required: true, min: 0, max: 120 },
    branch: [
      {
        condition: { field: 'age', operator: 'lt', value: 18 },
        target: { type: 'end', outcome: 'ineligible', reason: 'Underage' },
      },
      // age > 75 is flagged but we continue the flow; evaluator enforces clinical_review at Screen 15
    ],
    defaultNext: { type: 'next', step: 2 },
  },

  // ─── Screen 2 — Weight ─────────────────────────────────────────────────────
  {
    id: 2,
    key: 'weight',
    prompt: 'Enter your weight in kilograms.',
    type: 'number',
    validation: { required: true, min: 10, max: 500 },
    defaultNext: { type: 'next', step: 3 },
  },

  // ─── Screen 3 — Height ─────────────────────────────────────────────────────
  {
    id: 3,
    key: 'height',
    prompt: 'Enter your height in centimeters.',
    type: 'number',
    validation: { required: true, min: 50, max: 300 },
    defaultNext: { type: 'next', step: 4 },
  },

  // ─── Screen 4 — BMI Computation ────────────────────────────────────────────
  {
    id: 4,
    key: 'bmi',
    prompt: 'Computing your BMI from weight and height…',
    type: 'computed',
    computeDescription: 'BMI = weight ÷ (height / 100)²',
    branch: [
      {
        condition: { field: 'bmi', operator: 'lt', value: 25 },
        target: { type: 'end', outcome: 'ineligible', reason: 'BMI Too Low' },
      },
      {
        condition: { field: 'bmi', operator: 'gte', value: 40 },
        target: { type: 'end', outcome: 'clinical_review', reason: 'High BMI' },
      },
    ],
    defaultNext: { type: 'next', step: 5 },
  },

  // ─── Screen 5 — Pregnancy Status ───────────────────────────────────────────
  {
    id: 5,
    key: 'pregnant',
    prompt: 'Are you currently pregnant?',
    type: 'radio',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    validation: { required: true },
    branch: [
      {
        condition: { field: 'pregnant', operator: 'eq', value: 'yes' },
        target: { type: 'end', outcome: 'ineligible', reason: 'Pregnancy Contraindication' },
      },
    ],
    defaultNext: { type: 'next', step: 6 },
  },

  // ─── Screen 6 — Comorbid Conditions ────────────────────────────────────────
  {
    id: 6,
    key: 'comorbidities',
    prompt: 'Which chronic conditions have you been diagnosed with? (Select all that apply)',
    type: 'checkbox',
    options: [
      { value: 'hypertension', label: 'Hypertension' },
      { value: 'dyslipidemia', label: 'Dyslipidemia' },
      { value: 'sleep_apnea', label: 'Sleep Apnea' },
      { value: 'gerd', label: 'GERD' },
      { value: 'thyroid_disorder', label: 'Thyroid Disorder' },
    ],
    defaultNext: { type: 'next', step: 7 },
  },

  // ─── Screen 7 — Diabetes History ───────────────────────────────────────────
  {
    id: 7,
    key: 'diabetes',
    prompt: 'Have you ever been diagnosed with diabetes?',
    type: 'radio',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    validation: { required: true },
    branch: [
      {
        condition: { field: 'diabetes', operator: 'eq', value: 'yes' },
        target: { type: 'next', step: 8 },
      },
    ],
    defaultNext: { type: 'next', step: 9 },
  },

  // ─── Screen 8 — HbA1c ──────────────────────────────────────────────────────
  {
    id: 8,
    key: 'hba1c',
    prompt: 'Enter your latest HbA1c (%) result.',
    type: 'number',
    validation: { required: true, min: 0, max: 20 },
    branch: [
      {
        condition: { field: 'hba1c', operator: 'gt', value: 9.0 },
        target: { type: 'end', outcome: 'ineligible', reason: 'Uncontrolled Diabetes' },
      },
    ],
    defaultNext: { type: 'next', step: 9 },
  },

  // ─── Screen 9 — Blood Pressure ─────────────────────────────────────────────
  {
    id: 9,
    key: 'bloodPressure',
    prompt: 'Check all that apply based on your most recent blood pressure reading.',
    type: 'checkbox',
    options: [
      { value: 'normal', label: 'Normal (< 120/80)' },
      { value: 'elevated', label: 'Elevated (120–129 / <80)' },
      { value: 'stage1', label: 'Stage 1 Hypertension (130–139 / 80–89)' },
      { value: 'stage2', label: 'Stage 2 Hypertension (≥140 / ≥90)' },
      { value: 'hypertensive_crisis', label: 'Hypertensive Crisis (>180 / >120)' },
    ],
    validation: { required: true },
    defaultNext: { type: 'next', step: 10 },
  },

  // ─── Screen 10 — Current Medications ───────────────────────────────────────
  {
    id: 10,
    key: 'medications',
    prompt: 'Which medications are you currently prescribed? (Select all that apply)',
    type: 'checkbox',
    options: [
      { value: 'ace_inhibitors', label: 'ACE inhibitors' },
      { value: 'beta_blockers', label: 'Beta blockers' },
      { value: 'statins', label: 'Statins' },
      { value: 'thyroid_medication', label: 'Thyroid medication' },
      { value: 'glp1', label: 'GLP-1 receptor agonist' },
    ],
    branch: [
      {
        condition: { field: 'medications', operator: 'includes', value: 'glp1' },
        target: { type: 'end', outcome: 'clinical_review', reason: 'Already On GLP-1 Therapy' },
      },
    ],
    defaultNext: { type: 'next', step: 11 },
  },

  // ─── Screen 11 — Smoking Status ────────────────────────────────────────────
  {
    id: 11,
    key: 'smoking',
    prompt: 'Do you currently smoke tobacco?',
    type: 'radio',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    validation: { required: true },
    defaultNext: { type: 'next', step: 12 },
  },

  // ─── Screen 12 — Alcohol Use Frequency ─────────────────────────────────────
  {
    id: 12,
    key: 'alcoholFrequency',
    prompt: 'How often do you consume alcohol?',
    type: 'radio',
    options: [
      { value: 'never', label: 'Never' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'daily', label: 'Daily' },
    ],
    validation: { required: true },
    defaultNext: { type: 'next', step: 13 },
  },

  // ─── Screen 13 — Physical Activity Level ───────────────────────────────────
  {
    id: 13,
    key: 'activityLevel',
    prompt: 'How would you describe your typical activity level?',
    type: 'radio',
    options: [
      { value: 'sedentary', label: 'Sedentary' },
      { value: 'light', label: 'Light (1–2x/week)' },
      { value: 'moderate', label: 'Moderate (3–4x/week)' },
      { value: 'vigorous', label: 'Vigorous (5+x/week)' },
    ],
    validation: { required: true },
    defaultNext: { type: 'next', step: 14 },
  },

  // ─── Screen 14 — Dietary Habits ────────────────────────────────────────────
  {
    id: 14,
    key: 'diet',
    prompt: 'Which best describes your diet? (Select all that apply)',
    type: 'checkbox',
    options: [
      { value: 'high_sugar', label: 'High sugar intake' },
      { value: 'high_processed', label: 'High processed foods' },
      { value: 'sugary_beverages', label: 'Frequent sugary beverages' },
      { value: 'high_fiber', label: 'High fiber diet' },
      { value: 'balanced', label: 'Balanced diet' },
    ],
    defaultNext: { type: 'next', step: 15 },
  },

  // ─── Screen 15 — Final Evaluation ──────────────────────────────────────────
  {
    id: 15,
    key: 'evaluation',
    prompt: 'Evaluating your eligibility…',
    type: 'computed',
    computeDescription: 'Final eligibility evaluation based on all answers',
    defaultNext: { type: 'next', step: 15 }, // placeholder; evaluator handles this
  },
];

/** Map from step id to schema object for O(1) lookup */
export const STEP_MAP: Map<number, FormStep> = new Map(
  FORM_SCHEMA.map((step) => [step.id, step]),
);

/** Total number of user-facing screens (excludes computed steps 4 and 15 from progress count) */
export const TOTAL_INPUT_SCREENS = FORM_SCHEMA.filter((s) => s.type !== 'computed').length;

export function getStep(id: number): FormStep {
  const step = STEP_MAP.get(id);
  if (!step) throw new Error(`Unknown step id: ${id}`);
  return step;
}

import type { EligibilityAnswers, EligibilityResult } from './types';

/**
 * Pure eligibility evaluator for GLP-1 weight-loss medication screening.
 *
 * This function is intentionally free of any framework dependencies so it can
 * be called from unit tests without spinning up Next.js or NestJS.
 *
 * Priority order (highest → lowest):
 *   1. Immediate Ineligibility
 *   2. Automatic Clinical Review
 *   3. Optional Clinical Review rules
 *   4. Eligible
 *
 * Spec ambiguity resolutions:
 *   - Age > 75: "proceed with caution" means continue all screens but flag at evaluation.
 *   - GLP-1 agonist in Screen 10 → Clinical Review (overrides the "Ineligible" listed in
 *     the Screen 15 rules summary — Clinical Review is the medically correct outcome).
 *   - BP checkbox is multi-select; highest-severity category wins in evaluation.
 *   - "Daily alcohol + moderate/high risk factors" = smoking OR BP≥Stage1 OR ≥2 comorbidities.
 */
export function evaluateEligibility(answers: Partial<EligibilityAnswers>): EligibilityResult {
  const {
    age = 0,
    bmi = 0,
    pregnant,
    hba1c,
    medications = [],
    comorbidities = [],
    bloodPressure = [],
    diabetes,
    activityLevel,
    alcoholFrequency,
    diet = [],
    smoking,
  } = answers;

  // ── 1. Immediate Ineligibility ─────────────────────────────────────────────

  if (age < 18) {
    return { outcome: 'ineligible', reason: 'Underage' };
  }

  if (bmi > 0 && bmi < 25) {
    return { outcome: 'ineligible', reason: 'BMI Too Low' };
  }

  if (pregnant === 'yes') {
    return { outcome: 'ineligible', reason: 'Pregnancy Contraindication' };
  }

  if (hba1c !== undefined && hba1c > 9.0) {
    return { outcome: 'ineligible', reason: 'Uncontrolled Diabetes' };
  }

  // NOTE: GLP-1 agonist → Clinical Review (not Ineligible) per Screen 10 logic.
  // The Screen 15 rules summary lists it under "Immediate Ineligibility" which
  // contradicts Screen 10. We follow Screen 10 (Clinical Review) as it is more
  // medically appropriate — the patient may need evaluation to safely switch therapy.
  if (medications.includes('glp1')) {
    return { outcome: 'clinical_review', reason: 'Already On GLP-1 Therapy' };
  }

  // ── 2. Automatic Clinical Review ───────────────────────────────────────────

  if (age > 75) {
    return { outcome: 'clinical_review', reason: 'Age Over 75 — Proceed With Caution' };
  }

  if (bmi >= 40) {
    return { outcome: 'clinical_review', reason: 'High BMI (≥40)' };
  }

  // Hypertensive Crisis takes precedence over any other BP category
  if (bloodPressure.includes('hypertensive_crisis')) {
    return { outcome: 'clinical_review', reason: 'Hypertensive Crisis' };
  }

  // Stage 2 hypertension + diabetes = clinical review
  if (bloodPressure.includes('stage2') && diabetes === 'yes') {
    return { outcome: 'clinical_review', reason: 'Stage 2 Hypertension with Diabetes' };
  }

  if (comorbidities.length >= 3) {
    return { outcome: 'clinical_review', reason: '3 or More Comorbid Conditions' };
  }

  // ── 3. Optional Clinical Review Rules ──────────────────────────────────────

  if (
    bloodPressure.includes('stage1') &&
    activityLevel === 'sedentary' &&
    diet.includes('high_sugar')
  ) {
    return {
      outcome: 'clinical_review',
      reason: 'Stage 1 Hypertension + Sedentary Lifestyle + High Sugar Diet',
    };
  }

  if (alcoholFrequency === 'daily' && hasModerateOrHighRiskFactors(answers)) {
    return {
      outcome: 'clinical_review',
      reason: 'Daily Alcohol Use With Additional Risk Factors',
    };
  }

  // ── 4. Eligible ────────────────────────────────────────────────────────────

  return { outcome: 'eligible', reason: 'All eligibility criteria met' };
}

/**
 * Determines whether the patient has moderate or high risk factors.
 *
 * The spec says "Daily alcohol + moderate/high risk factors → Review" but leaves
 * "moderate/high risk factors" undefined. We resolve this as:
 *   - Currently smoking, OR
 *   - Blood pressure ≥ Stage 1, OR
 *   - ≥ 2 comorbid conditions
 *
 * This is a conservative interpretation (errs toward clinical review).
 */
function hasModerateOrHighRiskFactors(answers: Partial<EligibilityAnswers>): boolean {
  const { smoking, bloodPressure = [], comorbidities = [] } = answers;
  return (
    smoking === 'yes' ||
    bloodPressure.includes('stage1') ||
    bloodPressure.includes('stage2') ||
    bloodPressure.includes('hypertensive_crisis') ||
    comorbidities.length >= 2
  );
}

/**
 * Compute BMI from weight (kg) and height (cm).
 */
export function computeBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Resolve BMI branch from the form schema.
 * Returns the next step id (5) or an end state key.
 */
export function resolveBMIBranch(bmi: number): { type: 'end'; reason: string } | { type: 'next'; step: number } {
  if (bmi < 25) return { type: 'end', reason: 'BMI Too Low' };
  if (bmi >= 40) return { type: 'end', reason: 'High BMI (≥40)' };
  return { type: 'next', step: 5 };
}

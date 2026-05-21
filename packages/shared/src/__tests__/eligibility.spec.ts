import { describe, it, expect } from 'vitest';
import { evaluateEligibility, computeBMI, resolveBMIBranch } from '../eligibility';
import type { EligibilityAnswers } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Base eligible patient profile */
const ELIGIBLE: EligibilityAnswers = {
  age: 45,
  weight: 90,
  height: 170,
  bmi: 31.1,
  pregnant: 'no',
  comorbidities: ['hypertension'],
  diabetes: 'no',
  bloodPressure: ['normal'],
  medications: [],
  smoking: 'no',
  alcoholFrequency: 'monthly',
  activityLevel: 'moderate',
  diet: ['balanced'],
};

// ─── evaluateEligibility ──────────────────────────────────────────────────────

describe('evaluateEligibility — Immediate Ineligibility', () => {
  it('returns ineligible for age < 18', () => {
    const result = evaluateEligibility({ ...ELIGIBLE, age: 17 });
    expect(result.outcome).toBe('ineligible');
    expect(result.reason).toMatch(/underage/i);
  });

  it('returns ineligible for age exactly 17 (boundary)', () => {
    expect(evaluateEligibility({ ...ELIGIBLE, age: 17 }).outcome).toBe('ineligible');
  });

  it('does NOT return ineligible for age exactly 18 (boundary)', () => {
    expect(evaluateEligibility({ ...ELIGIBLE, age: 18 }).outcome).toBe('eligible');
  });

  it('returns ineligible for BMI < 25', () => {
    const result = evaluateEligibility({ ...ELIGIBLE, bmi: 24.9 });
    expect(result.outcome).toBe('ineligible');
    expect(result.reason).toMatch(/bmi too low/i);
  });

  it('does NOT return ineligible for BMI exactly 25', () => {
    expect(evaluateEligibility({ ...ELIGIBLE, bmi: 25 }).outcome).toBe('eligible');
  });

  it('skips BMI check when bmi = 0 (not yet computed — guard against false positive)', () => {
    // bmi=0 means the computed step hasn't run yet; we don't treat "no data" as ineligible.
    // In practice the form enforces BMI computation before reaching the evaluator.
    expect(evaluateEligibility({ ...ELIGIBLE, bmi: 0 }).outcome).toBe('eligible');
  });

  it('returns ineligible for pregnancy = yes', () => {
    const result = evaluateEligibility({ ...ELIGIBLE, pregnant: 'yes' });
    expect(result.outcome).toBe('ineligible');
    expect(result.reason).toMatch(/pregnancy/i);
  });

  it('returns ineligible for HbA1c > 9.0', () => {
    const result = evaluateEligibility({ ...ELIGIBLE, diabetes: 'yes', hba1c: 9.1 });
    expect(result.outcome).toBe('ineligible');
    expect(result.reason).toMatch(/uncontrolled diabetes/i);
  });

  it('does NOT return ineligible for HbA1c exactly 9.0', () => {
    expect(evaluateEligibility({ ...ELIGIBLE, diabetes: 'yes', hba1c: 9.0 }).outcome).toBe('eligible');
  });

  it('returns clinical_review (not ineligible) when GLP-1 agonist is selected', () => {
    const result = evaluateEligibility({ ...ELIGIBLE, medications: ['glp1'] });
    expect(result.outcome).toBe('clinical_review');
    expect(result.reason).toMatch(/glp-1 therapy/i);
  });
});

describe('evaluateEligibility — Automatic Clinical Review', () => {
  it('returns clinical_review for age > 75', () => {
    const result = evaluateEligibility({ ...ELIGIBLE, age: 76 });
    expect(result.outcome).toBe('clinical_review');
    expect(result.reason).toMatch(/age over 75/i);
  });

  it('does NOT return clinical_review for age exactly 75', () => {
    expect(evaluateEligibility({ ...ELIGIBLE, age: 75 }).outcome).toBe('eligible');
  });

  it('returns clinical_review for BMI ≥ 40', () => {
    const result = evaluateEligibility({ ...ELIGIBLE, bmi: 40 });
    expect(result.outcome).toBe('clinical_review');
    expect(result.reason).toMatch(/high bmi/i);
  });

  it('returns clinical_review for BMI = 40 exactly', () => {
    expect(evaluateEligibility({ ...ELIGIBLE, bmi: 40 }).outcome).toBe('clinical_review');
  });

  it('returns clinical_review for BMI = 39.99 (just under)', () => {
    expect(evaluateEligibility({ ...ELIGIBLE, bmi: 39.99 }).outcome).toBe('eligible');
  });

  it('returns clinical_review for Hypertensive Crisis', () => {
    const result = evaluateEligibility({ ...ELIGIBLE, bloodPressure: ['hypertensive_crisis'] });
    expect(result.outcome).toBe('clinical_review');
    expect(result.reason).toMatch(/hypertensive crisis/i);
  });

  it('returns clinical_review for Stage 2 BP + Diabetes', () => {
    const result = evaluateEligibility({
      ...ELIGIBLE,
      bloodPressure: ['stage2'],
      diabetes: 'yes',
      hba1c: 7.0,
    });
    expect(result.outcome).toBe('clinical_review');
    expect(result.reason).toMatch(/stage 2 hypertension with diabetes/i);
  });

  it('does NOT trigger Stage2+Diabetes rule without diabetes', () => {
    const result = evaluateEligibility({ ...ELIGIBLE, bloodPressure: ['stage2'], diabetes: 'no' });
    expect(result.outcome).toBe('eligible');
  });

  it('returns clinical_review for ≥ 3 comorbidities', () => {
    const result = evaluateEligibility({
      ...ELIGIBLE,
      comorbidities: ['hypertension', 'dyslipidemia', 'sleep_apnea'],
    });
    expect(result.outcome).toBe('clinical_review');
    expect(result.reason).toMatch(/3 or more comorbid/i);
  });

  it('does NOT trigger comorbidity rule for exactly 2', () => {
    expect(
      evaluateEligibility({ ...ELIGIBLE, comorbidities: ['hypertension', 'dyslipidemia'] }).outcome,
    ).toBe('eligible');
  });
});

describe('evaluateEligibility — Optional Clinical Review Rules', () => {
  it('returns clinical_review: Stage1 + Sedentary + High Sugar', () => {
    const result = evaluateEligibility({
      ...ELIGIBLE,
      bloodPressure: ['stage1'],
      activityLevel: 'sedentary',
      diet: ['high_sugar'],
    });
    expect(result.outcome).toBe('clinical_review');
    expect(result.reason).toMatch(/stage 1/i);
  });

  it('does NOT trigger Stage1 rule without sedentary', () => {
    expect(
      evaluateEligibility({
        ...ELIGIBLE,
        bloodPressure: ['stage1'],
        activityLevel: 'moderate',
        diet: ['high_sugar'],
      }).outcome,
    ).toBe('eligible');
  });

  it('does NOT trigger Stage1 rule without high sugar', () => {
    expect(
      evaluateEligibility({
        ...ELIGIBLE,
        bloodPressure: ['stage1'],
        activityLevel: 'sedentary',
        diet: ['balanced'],
      }).outcome,
    ).toBe('eligible');
  });

  it('returns clinical_review: Daily alcohol + smoking', () => {
    const result = evaluateEligibility({ ...ELIGIBLE, alcoholFrequency: 'daily', smoking: 'yes' });
    expect(result.outcome).toBe('clinical_review');
    expect(result.reason).toMatch(/daily alcohol/i);
  });

  it('returns clinical_review: Daily alcohol + BP Stage1', () => {
    const result = evaluateEligibility({
      ...ELIGIBLE,
      alcoholFrequency: 'daily',
      bloodPressure: ['stage1'],
    });
    expect(result.outcome).toBe('clinical_review');
  });

  it('returns clinical_review: Daily alcohol + BP Stage2', () => {
    const result = evaluateEligibility({
      ...ELIGIBLE,
      alcoholFrequency: 'daily',
      bloodPressure: ['stage2'],
    });
    expect(result.outcome).toBe('clinical_review');
  });

  it('returns clinical_review: Daily alcohol + ≥2 comorbidities', () => {
    const result = evaluateEligibility({
      ...ELIGIBLE,
      alcoholFrequency: 'daily',
      comorbidities: ['hypertension', 'dyslipidemia'],
    });
    expect(result.outcome).toBe('clinical_review');
  });

  it('does NOT trigger daily-alcohol rule without risk factors', () => {
    expect(
      evaluateEligibility({
        ...ELIGIBLE,
        alcoholFrequency: 'daily',
        smoking: 'no',
        bloodPressure: ['normal'],
        comorbidities: [],
      }).outcome,
    ).toBe('eligible');
  });
});

describe('evaluateEligibility — Eligible paths', () => {
  it('happy path: age 45, BMI 32, no diabetes, BP normal → Eligible', () => {
    const result = evaluateEligibility(ELIGIBLE);
    expect(result.outcome).toBe('eligible');
  });

  it('eligible with HbA1c exactly 9.0 (not > 9.0)', () => {
    const result = evaluateEligibility({ ...ELIGIBLE, diabetes: 'yes', hba1c: 9.0 });
    expect(result.outcome).toBe('eligible');
  });

  it('eligible with vigorous activity and daily alcohol but no risk factors', () => {
    const result = evaluateEligibility({
      ...ELIGIBLE,
      alcoholFrequency: 'daily',
      activityLevel: 'vigorous',
      smoking: 'no',
      bloodPressure: ['normal'],
      comorbidities: [],
    });
    expect(result.outcome).toBe('eligible');
  });

  it('eligible with no comorbidities', () => {
    expect(evaluateEligibility({ ...ELIGIBLE, comorbidities: [] }).outcome).toBe('eligible');
  });

  it('eligible with 2 comorbidities (under threshold)', () => {
    expect(
      evaluateEligibility({
        ...ELIGIBLE,
        comorbidities: ['hypertension', 'dyslipidemia'],
      }).outcome,
    ).toBe('eligible');
  });
});

describe('evaluateEligibility — Priority / Edge Cases', () => {
  it('ineligibility takes priority over clinical_review (age < 18 overrides age > 75 logic)', () => {
    // age < 18 is checked first; this patient would never actually be > 75, just testing priority
    const result = evaluateEligibility({ ...ELIGIBLE, age: 15 });
    expect(result.outcome).toBe('ineligible');
  });

  it('BMI < 25 takes priority over age > 75', () => {
    const result = evaluateEligibility({ ...ELIGIBLE, age: 80, bmi: 20 });
    // age < 18 check passes (80 > 18), then bmi < 25 → ineligible
    expect(result.outcome).toBe('ineligible');
    expect(result.reason).toMatch(/bmi too low/i);
  });

  it('handles missing optional fields gracefully (partial answers)', () => {
    // Only age and bmi provided; should still evaluate without throwing
    const result = evaluateEligibility({ age: 30, bmi: 30 });
    expect(result.outcome).toBe('eligible');
  });

  it('Hypertensive Crisis + Normal both selected → clinical_review (Crisis wins)', () => {
    // Edge case from Playwright spec: multi-select BP where user checks contradictory options.
    // Resolution: highest-severity category (Hypertensive Crisis) wins.
    const result = evaluateEligibility({
      ...ELIGIBLE,
      bloodPressure: ['normal', 'hypertensive_crisis'],
    });
    expect(result.outcome).toBe('clinical_review');
    expect(result.reason).toMatch(/hypertensive crisis/i);
  });
});

// ─── computeBMI ───────────────────────────────────────────────────────────────

describe('computeBMI', () => {
  it('computes BMI correctly for typical values', () => {
    // 90kg / (1.70m)^2 = 31.14
    expect(computeBMI(90, 170)).toBeCloseTo(31.14, 1);
  });

  it('returns 0 for zero height (safe guard)', () => {
    expect(computeBMI(70, 0)).toBe(0);
  });

  it('computes BMI = 25 at boundary', () => {
    // 62.5 kg / 1.58m^2 = ~25 — rough test
    const bmi = computeBMI(62.5, 158.1);
    expect(bmi).toBeCloseTo(25, 0);
  });
});

// ─── resolveBMIBranch ─────────────────────────────────────────────────────────

describe('resolveBMIBranch', () => {
  it('returns end/ineligible for BMI < 25', () => {
    expect(resolveBMIBranch(24.9)).toEqual({ type: 'end', reason: 'BMI Too Low' });
  });

  it('returns next:5 for BMI in [25, 40)', () => {
    expect(resolveBMIBranch(25)).toEqual({ type: 'next', step: 5 });
    expect(resolveBMIBranch(32)).toEqual({ type: 'next', step: 5 });
    expect(resolveBMIBranch(39.99)).toEqual({ type: 'next', step: 5 });
  });

  it('returns end/clinical_review for BMI ≥ 40', () => {
    expect(resolveBMIBranch(40)).toEqual({ type: 'end', reason: 'High BMI (≥40)' });
    expect(resolveBMIBranch(50)).toEqual({ type: 'end', reason: 'High BMI (≥40)' });
  });
});

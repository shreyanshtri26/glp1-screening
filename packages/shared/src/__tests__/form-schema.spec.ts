import { describe, it, expect } from 'vitest';
import { FORM_SCHEMA, STEP_MAP, getStep, TOTAL_INPUT_SCREENS } from '../form-schema';
import type { FormStep } from '../types';

describe('FORM_SCHEMA — structure', () => {
  it('contains exactly 15 steps', () => {
    expect(FORM_SCHEMA).toHaveLength(15);
  });

  it('step ids are sequential 1–15', () => {
    FORM_SCHEMA.forEach((step, index) => {
      expect(step.id).toBe(index + 1);
    });
  });

  it('each step has required fields: id, key, prompt, type', () => {
    FORM_SCHEMA.forEach((step) => {
      expect(step.id).toBeDefined();
      expect(typeof step.id).toBe('number');
      expect(step.key).toBeDefined();
      expect(typeof step.key).toBe('string');
      expect(step.prompt).toBeDefined();
      expect(typeof step.prompt).toBe('string');
      expect(step.type).toMatch(/^(number|radio|checkbox|computed)$/);
    });
  });

  it('keys are unique across all steps', () => {
    const keys = FORM_SCHEMA.map((s) => s.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('radio/checkbox steps have at least 2 options', () => {
    FORM_SCHEMA
      .filter((s) => s.type === 'radio' || s.type === 'checkbox')
      .forEach((step) => {
        expect(step.options).toBeDefined();
        expect((step.options ?? []).length).toBeGreaterThanOrEqual(2);
      });
  });

  it('number steps do not have options', () => {
    FORM_SCHEMA
      .filter((s) => s.type === 'number')
      .forEach((step) => {
        expect(step.options).toBeUndefined();
      });
  });

  it('all branch targets reference valid step ids or are end states', () => {
    const validStepIds = new Set(FORM_SCHEMA.map((s) => s.id));
    FORM_SCHEMA.forEach((step) => {
      (step.branch ?? []).forEach((rule) => {
        const target = rule.target;
        if (target.type === 'next') {
          expect(validStepIds.has(target.step)).toBe(true);
        } else {
          expect(target.type).toBe('end');
          expect(target.outcome).toMatch(/^(eligible|ineligible|clinical_review)$/);
          expect(typeof target.reason).toBe('string');
        }
      });
      if (step.defaultNext) {
        const dn = step.defaultNext;
        if (dn.type === 'next') {
          expect(validStepIds.has(dn.step)).toBe(true);
        }
      }
    });
  });

  it('all option values are non-empty strings', () => {
    FORM_SCHEMA.forEach((step) => {
      (step.options ?? []).forEach((opt) => {
        expect(typeof opt.value).toBe('string');
        expect(opt.value.length).toBeGreaterThan(0);
        expect(typeof opt.label).toBe('string');
        expect(opt.label.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('FORM_SCHEMA — specific screens', () => {
  it('Screen 1 (age) branches: < 18 → ineligible', () => {
    const screen1 = FORM_SCHEMA[0];
    const underageBranch = screen1.branch?.find(
      (b) => b.condition.operator === 'lt' && b.condition.value === 18,
    );
    expect(underageBranch).toBeDefined();
    expect(underageBranch!.target.type).toBe('end');
    if (underageBranch!.target.type === 'end') {
      expect(underageBranch!.target.outcome).toBe('ineligible');
    }
  });

  it('Screen 4 (bmi) is computed type', () => {
    const screen4 = FORM_SCHEMA[3];
    expect(screen4.type).toBe('computed');
    expect(screen4.computeDescription).toBeDefined();
  });

  it('Screen 4 branches: bmi < 25 → ineligible; bmi ≥ 40 → clinical_review', () => {
    const screen4 = FORM_SCHEMA[3];
    const lowBranch = screen4.branch?.find((b) => b.condition.operator === 'lt');
    const highBranch = screen4.branch?.find((b) => b.condition.operator === 'gte');
    expect(lowBranch?.target.type).toBe('end');
    expect(highBranch?.target.type).toBe('end');
    if (lowBranch?.target.type === 'end') {
      expect(lowBranch.target.outcome).toBe('ineligible');
    }
    if (highBranch?.target.type === 'end') {
      expect(highBranch.target.outcome).toBe('clinical_review');
    }
  });

  it('Screen 5 (pregnancy) has exactly 2 options: yes/no', () => {
    const screen5 = FORM_SCHEMA[4];
    const values = screen5.options?.map((o) => o.value);
    expect(values).toContain('yes');
    expect(values).toContain('no');
    expect(values).toHaveLength(2);
  });

  it('Screen 6 (comorbidities) has exactly 5 options', () => {
    expect(FORM_SCHEMA[5].options).toHaveLength(5);
  });

  it('Screen 9 (blood pressure) has exactly 5 options including hypertensive_crisis', () => {
    const screen9 = FORM_SCHEMA[8];
    const values = screen9.options?.map((o) => o.value);
    expect(values).toHaveLength(5);
    expect(values).toContain('hypertensive_crisis');
  });

  it('Screen 10 (medications) branches: glp1 → clinical_review', () => {
    const screen10 = FORM_SCHEMA[9];
    const glp1Branch = screen10.branch?.find(
      (b) => b.condition.field === 'medications' && b.condition.value === 'glp1',
    );
    expect(glp1Branch).toBeDefined();
    expect(glp1Branch!.target.type).toBe('end');
    if (glp1Branch!.target.type === 'end') {
      expect(glp1Branch!.target.outcome).toBe('clinical_review');
    }
  });

  it('Screen 15 is computed type (final evaluation)', () => {
    const screen15 = FORM_SCHEMA[14];
    expect(screen15.type).toBe('computed');
    expect(screen15.id).toBe(15);
  });
});

describe('STEP_MAP', () => {
  it('contains all 15 steps', () => {
    expect(STEP_MAP.size).toBe(15);
  });

  it('lookup returns correct step', () => {
    expect(STEP_MAP.get(1)?.key).toBe('age');
    expect(STEP_MAP.get(7)?.key).toBe('diabetes');
    expect(STEP_MAP.get(15)?.key).toBe('evaluation');
  });
});

describe('getStep', () => {
  it('returns step for valid id', () => {
    const step = getStep(1);
    expect(step.id).toBe(1);
    expect(step.key).toBe('age');
  });

  it('throws for invalid id', () => {
    expect(() => getStep(99)).toThrow('Unknown step id: 99');
  });
});

describe('TOTAL_INPUT_SCREENS', () => {
  it('equals 13 (15 steps minus 2 computed steps)', () => {
    expect(TOTAL_INPUT_SCREENS).toBe(13);
  });
});

describe('FORM_SCHEMA — snapshot', () => {
  it('matches snapshot', () => {
    // Snapshot test: if schema shape changes unexpectedly, this fails
    const shape = FORM_SCHEMA.map((s: FormStep) => ({
      id: s.id,
      key: s.key,
      type: s.type,
      optionCount: s.options?.length ?? 0,
      branchCount: s.branch?.length ?? 0,
    }));
    expect(shape).toMatchSnapshot();
  });
});

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  evaluateEligibility,
  computeBMI,
  getStep,
  FORM_SCHEMA,
  type EligibilityAnswers,
  type AnswerValue,
  type StepOrResult,
} from '@glp1/shared';
import type { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /** POST /session/start — create a new session and return the first question */
  async startSession() {
    const session = await this.prisma.session.create({
      data: { currentStep: 1 },
    });
    const step = getStep(1);
    return { sessionId: session.id, step };
  }

  /** POST /session/answer — save answer, compute next step or final result */
  async submitAnswer(dto: SubmitAnswerDto): Promise<{ next: StepOrResult }> {
    const { sessionId, step, value } = dto;

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { answers: true },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    // Upsert the answer for this step
    await this.prisma.answer.upsert({
      where: { sessionId_step: { sessionId, step } },
      create: { sessionId, step, value: value as object },
      update: { value: value as object },
    });

    // Rebuild the answers map from all answers (including new one)
    const allAnswers = await this.prisma.answer.findMany({
      where: { sessionId },
      orderBy: { step: 'asc' },
    });
    const answersMap = this.buildAnswersMap(allAnswers as { step: number; value: unknown }[]);

    // Check for mid-flow early exit (branches on the current step schema)
    const currentSchema = getStep(step);
    for (const rule of currentSchema.branch ?? []) {
      if (this.evaluateCondition(rule.condition, answersMap)) {
        const target = rule.target;
        if (target.type === 'end') {
          // Persist result
          await this.prisma.session.update({
            where: { id: sessionId },
            data: {
              status: 'completed',
              result: target.outcome,
              resultReason: target.reason,
              currentStep: step,
            },
          });
          return {
            next: { type: 'result', outcome: target.outcome, reason: target.reason },
          };
        }
        // Branch redirects to a different step
        await this.prisma.session.update({
          where: { id: sessionId },
          data: { currentStep: target.step },
        });
        return { next: { type: 'step', step: getStep(target.step) } };
      }
    }

    // Determine next step from defaultNext
    const defaultNext = currentSchema.defaultNext;

    // Handle computed step 4 (BMI)
    if (step === 3) {
      // After height is entered, compute BMI and advance to step 4 logic
      const weight = Number(answersMap['weight'] ?? 0);
      const height = Number(value);
      const bmi = computeBMI(weight, height);
      // Store computed BMI as step 4 answer
      await this.prisma.answer.upsert({
        where: { sessionId_step: { sessionId, step: 4 } },
        create: { sessionId, step: 4, value: bmi as unknown as object },
        update: { value: bmi as unknown as object },
      });
      answersMap['bmi'] = bmi;

      // Apply BMI branch logic
      if (bmi < 25) {
        await this.prisma.session.update({
          where: { id: sessionId },
          data: { status: 'completed', result: 'ineligible', resultReason: 'BMI Too Low', currentStep: 4 },
        });
        return { next: { type: 'result', outcome: 'ineligible', reason: 'BMI Too Low' } };
      }
      if (bmi >= 40) {
        await this.prisma.session.update({
          where: { id: sessionId },
          data: { status: 'completed', result: 'clinical_review', resultReason: 'High BMI (≥40)', currentStep: 4 },
        });
        return { next: { type: 'result', outcome: 'clinical_review', reason: 'High BMI (≥40)' } };
      }
      // BMI valid → go to step 5
      await this.prisma.session.update({ where: { id: sessionId }, data: { currentStep: 5 } });
      return { next: { type: 'step', step: getStep(5) } };
    }

    // Handle final evaluation step 14 → 15
    if (step === 14) {
      const eligibilityAnswers = this.mapToEligibilityAnswers(answersMap);
      const result = evaluateEligibility(eligibilityAnswers);
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { status: 'completed', result: result.outcome, resultReason: result.reason, currentStep: 15 },
      });
      return { next: { type: 'result', outcome: result.outcome, reason: result.reason } };
    }

    // Default: advance to next step
    if (defaultNext?.type === 'next') {
      // Skip step 4 (BMI computed inline above) if somehow reached directly
      const nextStepId = defaultNext.step === 4 ? 5 : defaultNext.step;
      await this.prisma.session.update({ where: { id: sessionId }, data: { currentStep: nextStepId } });
      return { next: { type: 'step', step: getStep(nextStepId) } };
    }

    // Fallback — should not happen in normal flow
    throw new Error(`No valid next step from step ${step}`);
  }

  /** GET /session/:id — return saved progress */
  async getSession(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { answers: { orderBy: { step: 'asc' } } },
    });
    if (!session) throw new NotFoundException(`Session ${id} not found`);

    const currentStep = session.status === 'completed'
      ? null
      : FORM_SCHEMA.find((s) => s.id === session.currentStep) ?? null;

    return { session, answers: session.answers, currentStep };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private buildAnswersMap(answers: { step: number; value: unknown }[]): Record<string, unknown> {
    const map: Record<string, unknown> = {};
    for (const answer of answers) {
      const schema = FORM_SCHEMA.find((s) => s.id === answer.step);
      if (schema) map[schema.key] = answer.value;
    }
    return map;
  }

  private evaluateCondition(
    condition: { field: string; operator: string; value: unknown },
    answers: Record<string, unknown>,
  ): boolean {
    const actual = answers[condition.field];
    const expected = condition.value;

    switch (condition.operator) {
      case 'lt': return Number(actual) < Number(expected);
      case 'lte': return Number(actual) <= Number(expected);
      case 'gt': return Number(actual) > Number(expected);
      case 'gte': return Number(actual) >= Number(expected);
      case 'eq': return actual === expected;
      case 'neq': return actual !== expected;
      case 'includes': return Array.isArray(actual) && actual.includes(expected);
      case 'not_includes': return !Array.isArray(actual) || !actual.includes(expected);
      case 'count_gte': return Array.isArray(actual) && actual.length >= Number(expected);
      default: return false;
    }
  }

  private mapToEligibilityAnswers(map: Record<string, unknown>): Partial<EligibilityAnswers> {
    return {
      age: Number(map['age'] ?? 0),
      weight: Number(map['weight'] ?? 0),
      height: Number(map['height'] ?? 0),
      bmi: Number(map['bmi'] ?? 0),
      pregnant: (map['pregnant'] as 'yes' | 'no') ?? 'no',
      comorbidities: (map['comorbidities'] as string[]) ?? [],
      diabetes: (map['diabetes'] as 'yes' | 'no') ?? 'no',
      hba1c: map['hba1c'] !== undefined ? Number(map['hba1c']) : undefined,
      bloodPressure: (map['bloodPressure'] as string[]) ?? [],
      medications: (map['medications'] as string[]) ?? [],
      smoking: (map['smoking'] as 'yes' | 'no') ?? 'no',
      alcoholFrequency: (map['alcoholFrequency'] as EligibilityAnswers['alcoholFrequency']) ?? 'never',
      activityLevel: (map['activityLevel'] as EligibilityAnswers['activityLevel']) ?? 'sedentary',
      diet: (map['diet'] as string[]) ?? [],
    };
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { SessionService } from './session.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// ─── Prisma Mock ──────────────────────────────────────────────────────────────

const mockPrisma = {
  session: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  answer: {
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
};

// ─── Test data helpers ────────────────────────────────────────────────────────

function makeSession(overrides = {}) {
  return {
    id: 'sess_test',
    currentStep: 1,
    status: 'in_progress',
    result: null,
    resultReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    answers: [],
    ...overrides,
  };
}

function makeAnswer(step: number, value: unknown) {
  return { id: `ans_${step}`, sessionId: 'sess_test', step, value, createdAt: new Date() };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SessionService(mockPrisma as unknown as PrismaService);
  });

  describe('startSession', () => {
    it('creates a session and returns sessionId + first step', async () => {
      mockPrisma.session.create.mockResolvedValue(makeSession());

      const result = await service.startSession();

      expect(mockPrisma.session.create).toHaveBeenCalledWith({ data: { currentStep: 1 } });
      expect(result.sessionId).toBe('sess_test');
      expect(result.step.id).toBe(1);
      expect(result.step.key).toBe('age');
    });
  });

  describe('submitAnswer — age step', () => {
    it('returns ineligible result for age < 18', async () => {
      const session = makeSession({ answers: [] });
      mockPrisma.session.findUnique.mockResolvedValue(session);
      mockPrisma.answer.upsert.mockResolvedValue({});
      mockPrisma.answer.findMany.mockResolvedValue([makeAnswer(1, 16)]);
      mockPrisma.session.update.mockResolvedValue({});

      const result = await service.submitAnswer({ sessionId: 'sess_test', step: 1, value: 16 });

      expect(result.next.type).toBe('result');
      if (result.next.type === 'result') {
        expect(result.next.outcome).toBe('ineligible');
        expect(result.next.reason).toMatch(/underage/i);
      }
    });

    it('advances to next step for valid age', async () => {
      const session = makeSession({ answers: [] });
      mockPrisma.session.findUnique.mockResolvedValue(session);
      mockPrisma.answer.upsert.mockResolvedValue({});
      mockPrisma.answer.findMany.mockResolvedValue([makeAnswer(1, 30)]);
      mockPrisma.session.update.mockResolvedValue({});

      const result = await service.submitAnswer({ sessionId: 'sess_test', step: 1, value: 30 });

      expect(result.next.type).toBe('step');
      if (result.next.type === 'step') {
        expect(result.next.step.id).toBe(2);
      }
    });
  });

  describe('submitAnswer — height step (BMI computation)', () => {
    it('returns ineligible for BMI < 25', async () => {
      const session = makeSession({ answers: [] });
      mockPrisma.session.findUnique.mockResolvedValue(session);
      mockPrisma.answer.upsert.mockResolvedValue({});
      // weight=50, height=170 → BMI ≈ 17.3 (< 25)
      mockPrisma.answer.findMany.mockResolvedValue([
        makeAnswer(1, 30),
        makeAnswer(2, 50),
        makeAnswer(3, 170),
      ]);
      mockPrisma.session.update.mockResolvedValue({});

      const result = await service.submitAnswer({ sessionId: 'sess_test', step: 3, value: 170 });

      expect(result.next.type).toBe('result');
      if (result.next.type === 'result') {
        expect(result.next.outcome).toBe('ineligible');
      }
    });

    it('returns clinical_review for BMI ≥ 40', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(makeSession({ answers: [] }));
      mockPrisma.answer.upsert.mockResolvedValue({});
      // weight=130, height=170 → BMI ≈ 45 (≥ 40)
      mockPrisma.answer.findMany.mockResolvedValue([
        makeAnswer(1, 30),
        makeAnswer(2, 130),
        makeAnswer(3, 170),
      ]);
      mockPrisma.session.update.mockResolvedValue({});

      const result = await service.submitAnswer({ sessionId: 'sess_test', step: 3, value: 170 });

      expect(result.next.type).toBe('result');
      if (result.next.type === 'result') {
        expect(result.next.outcome).toBe('clinical_review');
      }
    });

    it('advances to step 5 for valid BMI (25–39)', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(makeSession({ answers: [] }));
      mockPrisma.answer.upsert.mockResolvedValue({});
      // weight=90, height=170 → BMI ≈ 31.1
      mockPrisma.answer.findMany.mockResolvedValue([
        makeAnswer(1, 45),
        makeAnswer(2, 90),
        makeAnswer(3, 170),
      ]);
      mockPrisma.session.update.mockResolvedValue({});

      const result = await service.submitAnswer({ sessionId: 'sess_test', step: 3, value: 170 });

      expect(result.next.type).toBe('step');
      if (result.next.type === 'step') {
        expect(result.next.step.id).toBe(5);
      }
    });
  });

  describe('submitAnswer — medications step (GLP-1)', () => {
    it('returns clinical_review when GLP-1 agonist is selected', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(makeSession({ answers: [] }));
      mockPrisma.answer.upsert.mockResolvedValue({});
      mockPrisma.answer.findMany.mockResolvedValue([makeAnswer(10, ['glp1'])]);
      mockPrisma.session.update.mockResolvedValue({});

      const result = await service.submitAnswer({
        sessionId: 'sess_test',
        step: 10,
        value: ['glp1'],
      });

      expect(result.next.type).toBe('result');
      if (result.next.type === 'result') {
        expect(result.next.outcome).toBe('clinical_review');
      }
    });
  });

  describe('submitAnswer — final step (step 14)', () => {
    it('returns eligible result for compliant patient', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(makeSession({ answers: [] }));
      mockPrisma.answer.upsert.mockResolvedValue({});
      mockPrisma.answer.findMany.mockResolvedValue([
        makeAnswer(1, 45),       // age
        makeAnswer(2, 90),       // weight
        makeAnswer(3, 170),      // height
        makeAnswer(4, 31.1),     // bmi
        makeAnswer(5, 'no'),     // pregnant
        makeAnswer(6, ['hypertension']), // comorbidities (1)
        makeAnswer(7, 'no'),     // diabetes
        makeAnswer(9, ['normal']), // bp
        makeAnswer(10, []),      // medications
        makeAnswer(11, 'no'),    // smoking
        makeAnswer(12, 'monthly'), // alcohol
        makeAnswer(13, 'moderate'), // activity
        makeAnswer(14, ['balanced']), // diet
      ]);
      mockPrisma.session.update.mockResolvedValue({});

      const result = await service.submitAnswer({
        sessionId: 'sess_test',
        step: 14,
        value: ['balanced'],
      });

      expect(result.next.type).toBe('result');
      if (result.next.type === 'result') {
        expect(result.next.outcome).toBe('eligible');
      }
    });
  });

  describe('getSession', () => {
    it('returns session with answers and current step', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        ...makeSession({ currentStep: 7 }),
        answers: [makeAnswer(1, 30), makeAnswer(2, 85)],
      });

      const result = await service.getSession('sess_test');

      expect(result.session.id).toBe('sess_test');
      expect(result.answers).toHaveLength(2);
      expect(result.currentStep?.id).toBe(7);
    });

    it('throws NotFoundException for unknown session', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(service.getSession('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('returns null for currentStep when session is completed', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        ...makeSession({ status: 'completed', result: 'eligible' }),
        answers: [],
      });

      const result = await service.getSession('sess_test');

      expect(result.currentStep).toBeNull();
    });
  });
});

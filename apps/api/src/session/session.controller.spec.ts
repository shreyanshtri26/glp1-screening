import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { NotFoundException } from '@nestjs/common';

// ─── Mock SessionService ──────────────────────────────────────────────────────

const mockSessionService = {
  startSession: vi.fn(),
  submitAnswer: vi.fn(),
  getSession: vi.fn(),
} as unknown as SessionService;

describe('SessionController', () => {
  let controller: SessionController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new SessionController(mockSessionService);
  });

  describe('POST /start', () => {
    it('returns sessionId and first step', async () => {
      const mockResponse = {
        sessionId: 'sess_abc123',
        step: { id: 1, key: 'age', prompt: 'What is your age?', type: 'number' },
      };
      (mockSessionService.startSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await controller.start();

      expect(mockSessionService.startSession).toHaveBeenCalledOnce();
      expect(result.sessionId).toBe('sess_abc123');
      expect(result.step.id).toBe(1);
    });
  });

  describe('POST /answer', () => {
    it('returns next step when not final', async () => {
      const mockResponse = {
        next: { type: 'step', step: { id: 2, key: 'weight' } },
      };
      (mockSessionService.submitAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await controller.answer({ sessionId: 'sess_abc123', step: 1, value: 30 });

      expect(mockSessionService.submitAnswer).toHaveBeenCalledWith({
        sessionId: 'sess_abc123',
        step: 1,
        value: 30,
      });
      expect(result.next.type).toBe('step');
    });

    it('returns result when eligible', async () => {
      const mockResponse = {
        next: { type: 'result', outcome: 'eligible', reason: 'All eligibility criteria met' },
      };
      (mockSessionService.submitAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await controller.answer({ sessionId: 'sess_abc123', step: 14, value: ['balanced'] });

      expect(result.next.type).toBe('result');
      if (result.next.type === 'result') {
        expect(result.next.outcome).toBe('eligible');
      }
    });

    it('returns result when ineligible (early exit)', async () => {
      const mockResponse = {
        next: { type: 'result', outcome: 'ineligible', reason: 'Underage' },
      };
      (mockSessionService.submitAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await controller.answer({ sessionId: 'sess_abc123', step: 1, value: 16 });

      expect(result.next.type).toBe('result');
    });

    it('returns clinical_review result', async () => {
      const mockResponse = {
        next: { type: 'result', outcome: 'clinical_review', reason: 'Hypertensive Crisis' },
      };
      (mockSessionService.submitAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await controller.answer({
        sessionId: 'sess_abc123',
        step: 9,
        value: ['hypertensive_crisis'],
      });

      if (result.next.type === 'result') {
        expect(result.next.outcome).toBe('clinical_review');
      }
    });
  });

  describe('GET /:id', () => {
    it('returns session with answers and current step', async () => {
      const mockSession = {
        session: { id: 'sess_abc123', currentStep: 7, status: 'in_progress' },
        answers: [
          { step: 1, value: 30 },
          { step: 2, value: 85 },
        ],
        currentStep: { id: 7, key: 'diabetes' },
      };
      (mockSessionService.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);

      const result = await controller.getSession('sess_abc123');

      expect(mockSessionService.getSession).toHaveBeenCalledWith('sess_abc123');
      expect(result.session.currentStep).toBe(7);
      expect(result.answers).toHaveLength(2);
      expect(result.currentStep?.key).toBe('diabetes');
    });

    it('throws NotFoundException for unknown session id', async () => {
      (mockSessionService.getSession as ReturnType<typeof vi.fn>).mockRejectedValue(
        new NotFoundException('Session not_found not found'),
      );

      await expect(controller.getSession('not_found')).rejects.toThrow(NotFoundException);
    });
  });
});


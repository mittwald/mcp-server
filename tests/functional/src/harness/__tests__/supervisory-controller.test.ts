/**
 * Supervisory Controller Tests (WP03)
 *
 * Tests for state machine transitions, timeout handling, question handling,
 * failure detection, and StreamParser integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { Writable } from 'stream';
import {
  SupervisoryController,
  createSupervisoryController,
  type StateChangeEvent,
  type QuestionHandledEvent,
  type TimeoutWarningEvent,
} from '../supervisory-controller.js';
import type { StreamParser, QuestionDetectedEvent, PatternState } from '../stream-parser.js';
import type { UseCase, ExecutionStatus } from '../../use-cases/types.js';

// Mock StreamParser for testing
class MockStreamParser extends EventEmitter {
  emitQuestion(content: string, id?: string): void {
    const event: QuestionDetectedEvent = {
      type: 'question_detected',
      timestamp: new Date(),
      messageContent: content,
      assistantMessageId: id,
    };
    this.emit('question_detected', event);
  }

  getPatternState(): PatternState {
    return {
      consecutiveErrors: 0,
      idleTimeMs: 0,
      sameToolRepeated: 0,
      lastToolName: '',
      lastActivityTime: new Date(),
      recentToolCalls: [],
      recentOutput: [],
    };
  }
}

// Mock stdin for testing
function createMockStdin(): Writable & { written: string[] } {
  const written: string[] = [];
  const writable = new Writable({
    write(chunk, _encoding, callback) {
      written.push(chunk.toString());
      callback();
    },
  });
  (writable as Writable & { written: string[] }).written = written;
  return writable as Writable & { written: string[] };
}

// Base use case for testing
function createTestUseCase(overrides: Partial<UseCase> = {}): UseCase {
  return {
    id: 'test-001',
    title: 'Test Use Case',
    domain: 'apps',
    description: 'Test use case for unit testing',
    priority: 'P1',
    tags: ['test'],
    prompt: 'Test prompt',
    timeout: 1, // 1 minute for fast tests
    estimatedDuration: 1, // 1 minute estimated
    expectedDomains: ['apps'],
    expectedTools: [],
    questionAnswers: [],
    successCriteria: [],
    cleanupRequirements: [],
    ...overrides,
  };
}

describe('SupervisoryController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('State Machine', () => {
    it('starts in pending state', () => {
      const controller = createSupervisoryController(createTestUseCase());
      expect(controller.getState()).toBe('pending');
    });

    it('transitions from pending to running on start()', () => {
      const controller = createSupervisoryController(createTestUseCase());
      const stateChanges: StateChangeEvent[] = [];
      controller.on('state_change', (event) => stateChanges.push(event));

      controller.start();

      expect(controller.getState()).toBe('running');
      expect(stateChanges).toHaveLength(1);
      expect(stateChanges[0].from).toBe('pending');
      expect(stateChanges[0].to).toBe('running');
    });

    it('transitions from running to success on markSuccess()', () => {
      const controller = createSupervisoryController(createTestUseCase());
      controller.start();

      const stateChanges: StateChangeEvent[] = [];
      controller.on('state_change', (event) => stateChanges.push(event));

      controller.markSuccess('Test passed');

      expect(controller.getState()).toBe('success');
      expect(stateChanges).toHaveLength(1);
      expect(stateChanges[0].to).toBe('success');
      expect(stateChanges[0].reason).toBe('Test passed');
    });

    it('transitions from running to failure on markFailure()', () => {
      const controller = createSupervisoryController(createTestUseCase());
      controller.start();

      controller.markFailure('Test failed');

      expect(controller.getState()).toBe('failure');
    });

    it('ignores transitions from terminal states', () => {
      const controller = createSupervisoryController(createTestUseCase());
      controller.start();
      controller.markSuccess('Done');

      // Try to transition again
      controller.markFailure('Should not work');

      expect(controller.getState()).toBe('success');
    });

    it('throws on invalid transitions', () => {
      const controller = createSupervisoryController(createTestUseCase());

      // pending -> success is not valid
      expect(() => controller.markSuccess('Invalid')).toThrow('Invalid state transition');
    });
  });

  describe('Timeout Handling', () => {
    it('transitions to timeout after configured duration', () => {
      const useCase = createTestUseCase({ timeout: 1 }); // 1 minute
      const controller = createSupervisoryController(useCase);
      controller.start();

      // Advance time to just before timeout
      vi.advanceTimersByTime(59 * 1000);
      expect(controller.getState()).toBe('running');

      // Advance past timeout
      vi.advanceTimersByTime(2 * 1000);
      expect(controller.getState()).toBe('timeout');
    });

    it('clears timeout on success', () => {
      const controller = createSupervisoryController(createTestUseCase({ timeout: 1 }));
      controller.start();

      controller.markSuccess('Done');

      // Advance past original timeout
      vi.advanceTimersByTime(120 * 1000);

      // Should still be success, not timeout
      expect(controller.getState()).toBe('success');
    });

    it('clears timeout on failure', () => {
      const controller = createSupervisoryController(createTestUseCase({ timeout: 1 }));
      controller.start();

      controller.markFailure('Failed');

      // Advance past original timeout
      vi.advanceTimersByTime(120 * 1000);

      // Should still be failure, not timeout
      expect(controller.getState()).toBe('failure');
    });

    it('emits timeout_warning at configured percentage', () => {
      const controller = createSupervisoryController(
        createTestUseCase({ timeout: 1 }),
        { timeoutWarningPercent: 80 }
      );
      const warnings: TimeoutWarningEvent[] = [];
      controller.on('timeout_warning', (event) => warnings.push(event));

      controller.start();

      // Advance to 80% of timeout (48 seconds)
      vi.advanceTimersByTime(48 * 1000);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].remainingMs).toBeLessThanOrEqual(12000);
    });

    it('respects max timeout of 30 minutes', () => {
      const useCase = createTestUseCase({ timeout: 60 }); // Request 60 minutes
      // Disable idle check by setting very long idle timeout
      const controller = createSupervisoryController(useCase, {
        maxIdleTimeMs: 60 * 60 * 1000, // 1 hour
        idleCheckIntervalMs: 60 * 60 * 1000,
      });
      controller.start();

      // Advance to 30 minutes (max)
      vi.advanceTimersByTime(30 * 60 * 1000);

      // Should timeout at 30 min, not 60
      expect(controller.getState()).toBe('timeout');
    });

    it('returns remaining time correctly', () => {
      const controller = createSupervisoryController(createTestUseCase({ timeout: 1 }));

      expect(controller.getRemainingTimeMs()).toBeUndefined();

      controller.start();
      expect(controller.getRemainingTimeMs()).toBe(60 * 1000);

      vi.advanceTimersByTime(30 * 1000);
      expect(controller.getRemainingTimeMs()).toBe(30 * 1000);
    });
  });

  describe('Question Handling', () => {
    it('matches and answers predefined questions', () => {
      const useCase = createTestUseCase({
        questionAnswers: [
          { questionPattern: 'confirm.*deployment', answer: 'yes', skip: false, escalate: false },
        ],
      });
      const controller = createSupervisoryController(useCase);
      const stdin = createMockStdin();
      controller.setStdin(stdin);
      controller.start();

      controller.handleQuestion('Can you confirm the deployment?');

      expect(stdin.written).toHaveLength(1);
      expect(stdin.written[0]).toContain('yes');

      const log = controller.getQuestionLog();
      expect(log).toHaveLength(1);
      expect(log[0].action).toBe('answered');
      expect(log[0].response).toBe('yes');
    });

    it('skips questions when configured', () => {
      const useCase = createTestUseCase({
        questionAnswers: [
          { questionPattern: 'optional.*question', answer: '', skip: true, escalate: false },
        ],
      });
      const controller = createSupervisoryController(useCase);
      const stdin = createMockStdin();
      controller.setStdin(stdin);
      controller.start();

      controller.handleQuestion('This is an optional question?');

      expect(stdin.written).toHaveLength(0); // Nothing written
      expect(controller.getQuestionLog()[0].action).toBe('skipped');
    });

    it('escalates questions when configured', () => {
      const useCase = createTestUseCase({
        questionAnswers: [
          { questionPattern: 'dangerous.*action', answer: '', skip: false, escalate: true },
        ],
      });
      const controller = createSupervisoryController(useCase);
      controller.start();

      controller.handleQuestion('Should I perform a dangerous action?');

      expect(controller.getState()).toBe('failure');
      expect(controller.getQuestionLog()[0].action).toBe('escalated');
    });

    it('escalates unknown questions by default', () => {
      const controller = createSupervisoryController(createTestUseCase());
      controller.start();

      controller.handleQuestion('Unknown question?');

      expect(controller.getState()).toBe('failure');
    });

    it('skips unknown questions when skipUnknownQuestions is true', () => {
      const controller = createSupervisoryController(
        createTestUseCase(),
        { skipUnknownQuestions: true }
      );
      controller.start();

      controller.handleQuestion('Unknown question?');

      expect(controller.getState()).toBe('running');
      expect(controller.getQuestionLog()[0].action).toBe('skipped');
    });

    it('emits question_handled event', () => {
      const useCase = createTestUseCase({
        questionAnswers: [
          { questionPattern: 'test', answer: 'yes', skip: false, escalate: false },
        ],
      });
      const controller = createSupervisoryController(useCase);
      controller.setStdin(createMockStdin());
      const events: QuestionHandledEvent[] = [];
      controller.on('question_handled', (event) => events.push(event));
      controller.start();

      controller.handleQuestion('test question');

      expect(events).toHaveLength(1);
      expect(events[0].action).toBe('answered');
      expect(events[0].answer).toBe('yes');
    });

    it('ignores questions when not in running state', () => {
      const controller = createSupervisoryController(createTestUseCase());
      // Don't start - still in pending state

      controller.handleQuestion('question?');

      expect(controller.getQuestionLog()).toHaveLength(0);
    });
  });

  describe('StreamParser Integration', () => {
    it('attaches to parser and receives question events', () => {
      const useCase = createTestUseCase({
        questionAnswers: [
          { questionPattern: 'proceed', answer: 'yes', skip: false, escalate: false },
        ],
      });
      const controller = createSupervisoryController(useCase);
      controller.setStdin(createMockStdin());
      const parser = new MockStreamParser();

      controller.attachToParser(parser as unknown as StreamParser);
      controller.start();

      parser.emitQuestion('Should I proceed?');

      expect(controller.getQuestionLog()).toHaveLength(1);
      expect(controller.getQuestionLog()[0].action).toBe('answered');
    });

    it('detaches from parser on cleanup', () => {
      const controller = createSupervisoryController(createTestUseCase());
      const parser = new MockStreamParser();

      controller.attachToParser(parser as unknown as StreamParser);
      controller.start();
      controller.markSuccess('Done');

      // Emit question after cleanup
      parser.emitQuestion('Late question?');

      // Should not be processed
      expect(controller.getQuestionLog()).toHaveLength(0);
    });

    it('can reattach to a different parser', () => {
      const useCase = createTestUseCase({
        questionAnswers: [
          { questionPattern: 'test', answer: 'answer', skip: false, escalate: false },
        ],
      });
      const controller = createSupervisoryController(useCase);
      controller.setStdin(createMockStdin());
      const parser1 = new MockStreamParser();
      const parser2 = new MockStreamParser();

      controller.attachToParser(parser1 as unknown as StreamParser);
      controller.attachToParser(parser2 as unknown as StreamParser); // Should detach from parser1
      controller.start();

      parser1.emitQuestion('test from parser1'); // Should be ignored
      parser2.emitQuestion('test from parser2'); // Should be processed

      expect(controller.getQuestionLog()).toHaveLength(1);
    });
  });

  describe('Failure Detection', () => {
    it('fails after consecutive errors threshold', () => {
      const controller = createSupervisoryController(createTestUseCase());
      controller.start();

      controller.recordError('Error 1');
      controller.recordError('Error 2');
      expect(controller.getState()).toBe('running');

      controller.recordError('Error 3');
      expect(controller.getState()).toBe('failure');
    });

    it('clears error count on clearErrors()', () => {
      const controller = createSupervisoryController(createTestUseCase());
      controller.start();

      controller.recordError('Error 1');
      controller.recordError('Error 2');
      controller.clearErrors();
      controller.recordError('Error 3');

      expect(controller.getState()).toBe('running');
    });

    it('fails on same tool repeated too many times', () => {
      const controller = createSupervisoryController(createTestUseCase());
      controller.start();

      for (let i = 0; i < 5; i++) {
        controller.recordToolCall('same_tool');
      }

      expect(controller.getState()).toBe('failure');
    });

    it('emits tool_invoked event', () => {
      const controller = createSupervisoryController(createTestUseCase());
      const tools: string[] = [];
      controller.on('tool_invoked', (name) => tools.push(name));
      controller.start();

      controller.recordToolCall('test_tool');

      expect(tools).toEqual(['test_tool']);
    });

    it('emits error_detected event', () => {
      const controller = createSupervisoryController(createTestUseCase());
      const errors: string[] = [];
      controller.on('error_detected', (error) => errors.push(error));
      controller.start();

      controller.recordError('Test error');

      expect(errors).toEqual(['Test error']);
    });
  });

  describe('Idle Timeout', () => {
    it('fails on idle timeout via checkIdleTimeout()', () => {
      const controller = createSupervisoryController(
        createTestUseCase({ timeout: 5 }), // 5 minute timeout
        {
          maxIdleTimeMs: 10000,
          idleCheckIntervalMs: 60000, // Long interval so we can manually check
        }
      );
      controller.start();

      // Advance time past idle threshold
      vi.advanceTimersByTime(15000);

      // Manually check
      const timedOut = controller.checkIdleTimeout();

      expect(timedOut).toBe(true);
      expect(controller.getState()).toBe('failure');
    });

    it('runs idle check at configured interval', () => {
      const controller = createSupervisoryController(
        createTestUseCase({ timeout: 5 }),
        { idleCheckIntervalMs: 1000, maxIdleTimeMs: 3000 }
      );
      controller.start();

      // Advance past idle timeout - interval should trigger check
      vi.advanceTimersByTime(4000);

      expect(controller.getState()).toBe('failure');
    });

    it('resets idle timer on activity', () => {
      const controller = createSupervisoryController(
        createTestUseCase({ timeout: 5 }),
        { idleCheckIntervalMs: 1000, maxIdleTimeMs: 3000 }
      );
      controller.start();

      // Advance partway
      vi.advanceTimersByTime(2000);
      controller.recordActivity();

      // Advance past original idle time but not new one
      vi.advanceTimersByTime(2000);

      expect(controller.getState()).toBe('running');
    });
  });

  describe('Success Detection', () => {
    it('transitions to success when all criteria met', () => {
      const useCase = createTestUseCase({
        successCriteria: [
          { description: 'Criterion 1', method: 'log-pattern', config: { pattern: 'test1', minOccurrences: 1 } },
          { description: 'Criterion 2', method: 'log-pattern', config: { pattern: 'test2', minOccurrences: 1 } },
        ],
      });
      const controller = createSupervisoryController(useCase);
      controller.start();

      controller.markCriterionMet(0);
      expect(controller.getState()).toBe('running');

      controller.markCriterionMet(1);
      expect(controller.getState()).toBe('success');
    });

    it('tracks success criteria status', () => {
      const useCase = createTestUseCase({
        successCriteria: [
          { description: 'Criterion 1', method: 'log-pattern', config: { pattern: 'test1', minOccurrences: 1 } },
          { description: 'Criterion 2', method: 'log-pattern', config: { pattern: 'test2', minOccurrences: 1 } },
        ],
      });
      const controller = createSupervisoryController(useCase);
      controller.start();

      let status = controller.getSuccessCriteriaStatus();
      expect(status).toEqual({ total: 2, met: 0, remaining: 2 });

      controller.markCriterionMet(0);
      status = controller.getSuccessCriteriaStatus();
      expect(status).toEqual({ total: 2, met: 1, remaining: 1 });
    });

    it('detects success via processOutputLine with log patterns', () => {
      const useCase = createTestUseCase({
        successCriteria: [
          { description: 'Deploy success', method: 'log-pattern', config: { pattern: 'deployment.*successful', minOccurrences: 1 } },
        ],
      });
      const controller = createSupervisoryController(useCase);
      controller.start();

      controller.processOutputLine('Starting deployment...');
      expect(controller.getState()).toBe('running');

      controller.processOutputLine('deployment was successful');
      expect(controller.getState()).toBe('success');
    });
  });

  describe('Pattern State Processing', () => {
    it('detects consecutive errors from pattern state', () => {
      const controller = createSupervisoryController(createTestUseCase());
      controller.start();

      const patternState: PatternState = {
        consecutiveErrors: 5,
        idleTimeMs: 0,
        sameToolRepeated: 0,
        lastToolName: '',
        lastActivityTime: new Date(),
        recentToolCalls: [],
        recentOutput: [],
      };

      controller.processPatternState(patternState);

      expect(controller.getState()).toBe('failure');
    });

    it('detects stuck tool loop from pattern state', () => {
      const controller = createSupervisoryController(createTestUseCase());
      controller.start();

      const patternState: PatternState = {
        consecutiveErrors: 0,
        idleTimeMs: 0,
        sameToolRepeated: 10,
        lastToolName: 'stuck_tool',
        lastActivityTime: new Date(),
        recentToolCalls: [],
        recentOutput: [],
      };

      controller.processPatternState(patternState);

      expect(controller.getState()).toBe('failure');
    });

    it('detects idle timeout from pattern state', () => {
      const controller = createSupervisoryController(
        createTestUseCase(),
        { maxIdleTimeMs: 30000 }
      );
      controller.start();

      const patternState: PatternState = {
        consecutiveErrors: 0,
        idleTimeMs: 60000,
        sameToolRepeated: 0,
        lastToolName: '',
        lastActivityTime: new Date(Date.now() - 60000),
        recentToolCalls: [],
        recentOutput: [],
      };

      controller.processPatternState(patternState);

      expect(controller.getState()).toBe('failure');
    });
  });

  describe('Factory Function', () => {
    it('creates controller with default options', () => {
      const controller = createSupervisoryController(createTestUseCase());
      expect(controller).toBeInstanceOf(SupervisoryController);
      expect(controller.getState()).toBe('pending');
    });

    it('creates controller with custom options', () => {
      const controller = createSupervisoryController(
        createTestUseCase(),
        { skipUnknownQuestions: true }
      );
      controller.start();

      controller.handleQuestion('unknown?');

      // Should skip instead of fail
      expect(controller.getState()).toBe('running');
    });
  });
});

/**
 * Supervisory Controller - Orchestrates multi-step use case execution
 *
 * Implements state machine: pending → running → (success | failure | timeout)
 * Handles timeouts, success/failure detection, and question answering.
 */

import { EventEmitter } from 'events';
import type { Writable } from 'stream';
import type {
  UseCase,
  QuestionAnswer,
  SuccessCriterion,
  QuestionLogEntry,
  ExecutionStatus,
} from '../use-cases/types.js';
import { writeUserMessage } from './stdin-injector.js';

// Thresholds from existing coordinator
const MAX_CONSECUTIVE_ERRORS = 3;
const MAX_SAME_TOOL_REPEATS = 5;
const MAX_IDLE_TIME_MS = 60000;
const DEFAULT_TIMEOUT_MINUTES = 10;
const MAX_TIMEOUT_MINUTES = 30;

/**
 * State change event emitted on each transition
 */
export interface StateChangeEvent {
  from: ExecutionStatus;
  to: ExecutionStatus;
  timestamp: Date;
  reason?: string;
}

/**
 * Question handled event
 */
export interface QuestionHandledEvent {
  question: string;
  action: 'answered' | 'skipped' | 'escalated';
  answer?: string;
  timestamp: Date;
}

/**
 * Timeout warning event (emitted at 80% of timeout)
 */
export interface TimeoutWarningEvent {
  remainingMs: number;
  totalMs: number;
  timestamp: Date;
}

/**
 * Controller events
 */
export interface SupervisoryControllerEvents {
  state_change: (event: StateChangeEvent) => void;
  question_handled: (event: QuestionHandledEvent) => void;
  timeout_warning: (event: TimeoutWarningEvent) => void;
  tool_invoked: (toolName: string) => void;
  error_detected: (error: string) => void;
}

/**
 * Controller configuration options
 */
export interface ControllerOptions {
  /** Skip unknown questions instead of escalating */
  skipUnknownQuestions?: boolean;
  /** Emit timeout warning at this percentage (default 80) */
  timeoutWarningPercent?: number;
}

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<ExecutionStatus, ExecutionStatus[]> = {
  pending: ['running'],
  running: ['success', 'failure', 'timeout'],
  success: [],
  failure: [],
  timeout: [],
  'cleanup-failed': [],
};

/**
 * Check if a state is terminal (no further transitions allowed)
 */
function isTerminalState(state: ExecutionStatus): boolean {
  return VALID_TRANSITIONS[state].length === 0;
}

/**
 * Supervisory Controller for use case execution
 */
export class SupervisoryController extends EventEmitter {
  private state: ExecutionStatus = 'pending';
  private readonly useCase: UseCase;
  private readonly options: ControllerOptions;

  // Timeout handling
  private timeoutHandle?: NodeJS.Timeout;
  private warningHandle?: NodeJS.Timeout;
  private startTime?: Date;
  private readonly timeoutMs: number;

  // Stdin for response injection
  private stdin: Writable | null = null;

  // Failure detection state
  private consecutiveErrors = 0;
  private toolCallCounts = new Map<string, number>();
  private lastActivityTime = Date.now();

  // Question handling log
  private questionLog: QuestionLogEntry[] = [];

  // Success detection state
  private successCriteriaMet = new Set<number>();

  constructor(useCase: UseCase, options: ControllerOptions = {}) {
    super();
    this.useCase = useCase;
    this.options = {
      skipUnknownQuestions: false,
      timeoutWarningPercent: 80,
      ...options,
    };

    // Calculate timeout (default 10min, max 30min)
    const requestedTimeout = useCase.timeout || DEFAULT_TIMEOUT_MINUTES;
    const clampedTimeout = Math.min(requestedTimeout, MAX_TIMEOUT_MINUTES);
    this.timeoutMs = clampedTimeout * 60 * 1000;
  }

  /**
   * Get current execution state
   */
  getState(): ExecutionStatus {
    return this.state;
  }

  /**
   * Get remaining time in milliseconds (or undefined if not running)
   */
  getRemainingTimeMs(): number | undefined {
    if (!this.startTime || this.state !== 'running') {
      return undefined;
    }
    const elapsed = Date.now() - this.startTime.getTime();
    return Math.max(0, this.timeoutMs - elapsed);
  }

  /**
   * Get the question handling log
   */
  getQuestionLog(): QuestionLogEntry[] {
    return [...this.questionLog];
  }

  /**
   * Set the stdin handle for response injection
   */
  setStdin(stdin: Writable | null): void {
    this.stdin = stdin;
  }

  /**
   * Start execution - transitions from pending to running
   */
  start(): void {
    this.transition('running', 'Execution started');
    this.startTime = new Date();

    // Set up timeout
    this.timeoutHandle = setTimeout(() => {
      this.transition('timeout', 'Execution timed out');
      this.cleanup();
    }, this.timeoutMs);

    // Set up warning at configured percentage
    const warningMs = this.timeoutMs * (this.options.timeoutWarningPercent! / 100);
    this.warningHandle = setTimeout(() => {
      const remaining = this.getRemainingTimeMs() || 0;
      this.emit('timeout_warning', {
        remainingMs: remaining,
        totalMs: this.timeoutMs,
        timestamp: new Date(),
      } as TimeoutWarningEvent);
    }, warningMs);
  }

  /**
   * Mark execution as successful
   */
  markSuccess(reason?: string): void {
    this.transition('success', reason || 'All success criteria met');
    this.cleanup();
  }

  /**
   * Mark execution as failed
   */
  markFailure(reason: string): void {
    this.transition('failure', reason);
    this.cleanup();
  }

  /**
   * Handle a detected question from Claude
   */
  handleQuestion(question: string): void {
    if (this.state !== 'running') {
      return;
    }

    // Find matching predefined answer
    const match = this.useCase.questionAnswers.find((qa) =>
      new RegExp(qa.questionPattern, 'i').test(question)
    );

    if (match) {
      if (match.escalate) {
        this.logQuestion(question, 'escalated');
        this.markFailure(`Escalation triggered by question: ${question}`);
        return;
      }

      if (match.skip) {
        this.logQuestion(question, 'skipped');
        return;
      }

      // Inject the answer
      this.injectResponse(match.answer);
      this.logQuestion(question, 'answered', match.answer);
    } else {
      // No match found
      if (this.options.skipUnknownQuestions) {
        this.logQuestion(question, 'skipped');
      } else {
        this.logQuestion(question, 'escalated');
        this.markFailure(`Unknown question with no predefined answer: ${question}`);
      }
    }
  }

  /**
   * Record a tool invocation for failure detection
   */
  recordToolCall(toolName: string): void {
    this.lastActivityTime = Date.now();

    const count = (this.toolCallCounts.get(toolName) || 0) + 1;
    this.toolCallCounts.set(toolName, count);

    this.emit('tool_invoked', toolName);

    // Check for stuck pattern (same tool called too many times)
    if (count >= MAX_SAME_TOOL_REPEATS) {
      this.markFailure(`Tool ${toolName} called ${count} times - possible stuck loop`);
    }
  }

  /**
   * Record an error for failure detection
   */
  recordError(error: string): void {
    this.consecutiveErrors++;
    this.emit('error_detected', error);

    if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      this.markFailure(`${this.consecutiveErrors} consecutive errors detected`);
    }
  }

  /**
   * Clear consecutive error count (called on successful operations)
   */
  clearErrors(): void {
    this.consecutiveErrors = 0;
  }

  /**
   * Check for idle timeout
   */
  checkIdleTimeout(): boolean {
    if (this.state !== 'running') {
      return false;
    }

    const idleTime = Date.now() - this.lastActivityTime;
    if (idleTime >= MAX_IDLE_TIME_MS) {
      this.markFailure(`Idle timeout: no activity for ${idleTime}ms`);
      return true;
    }
    return false;
  }

  /**
   * Check if a success criterion has been met
   */
  markCriterionMet(criterionIndex: number): void {
    this.successCriteriaMet.add(criterionIndex);

    // Check if all criteria are met
    if (this.successCriteriaMet.size >= this.useCase.successCriteria.length) {
      this.markSuccess('All success criteria verified');
    }
  }

  /**
   * Get success criteria status
   */
  getSuccessCriteriaStatus(): { total: number; met: number; remaining: number } {
    return {
      total: this.useCase.successCriteria.length,
      met: this.successCriteriaMet.size,
      remaining: this.useCase.successCriteria.length - this.successCriteriaMet.size,
    };
  }

  /**
   * Transition to a new state
   */
  private transition(newState: ExecutionStatus, reason?: string): void {
    const oldState = this.state;

    // Check if transition is valid
    if (isTerminalState(oldState)) {
      // Already in terminal state, ignore
      return;
    }

    if (!VALID_TRANSITIONS[oldState].includes(newState)) {
      throw new Error(`Invalid state transition: ${oldState} → ${newState}`);
    }

    this.state = newState;

    const event: StateChangeEvent = {
      from: oldState,
      to: newState,
      timestamp: new Date(),
      reason,
    };

    this.emit('state_change', event);
  }

  /**
   * Inject a response via stdin
   */
  private injectResponse(content: string): void {
    if (!this.stdin) {
      console.warn('[SupervisoryController] Cannot inject response: stdin not set');
      return;
    }

    const result = writeUserMessage(this.stdin, content);
    if (!result.success) {
      console.warn('[SupervisoryController] Failed to inject response:', result.error);
    }
  }

  /**
   * Log a question handling action
   */
  private logQuestion(
    question: string,
    action: 'answered' | 'skipped' | 'escalated',
    response?: string
  ): void {
    const entry: QuestionLogEntry = {
      timestamp: new Date(),
      question,
      action,
      response,
    };

    this.questionLog.push(entry);

    this.emit('question_handled', {
      question,
      action,
      answer: response,
      timestamp: entry.timestamp,
    } as QuestionHandledEvent);
  }

  /**
   * Clean up timers and resources
   */
  private cleanup(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = undefined;
    }

    if (this.warningHandle) {
      clearTimeout(this.warningHandle);
      this.warningHandle = undefined;
    }
  }
}

/**
 * Create a supervisory controller for a use case
 */
export function createSupervisoryController(
  useCase: UseCase,
  options?: ControllerOptions
): SupervisoryController {
  return new SupervisoryController(useCase, options);
}
